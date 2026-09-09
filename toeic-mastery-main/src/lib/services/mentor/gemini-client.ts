import "server-only";
import { MentorConfigError } from "./mentor-errors";
import type { MentorChatMessage, MentorUsage } from "./anthropic-client";

/**
 * Google Gemini API — the free-to-start option (get a key at
 * https://aistudio.google.com/apikey, no credit card required, generous
 * free daily/per-minute quota on the Flash models). Selected via
 * llm-client.ts when MENTOR_LLM_PROVIDER=gemini (the default whenever no
 * Anthropic key is configured — see resolveProvider() there). Same
 * hand-rolled fetch style as anthropic-client.ts, and the same exported
 * shape (streamMentorReply/completeMentorTask), so llm-client.ts can swap
 * between the two without either caller needing to know which is active.
 */

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
/** Same id used for both tiers — Gemini's Flash line is already cheap/fast
 * enough that a separate "background" model isn't worth the extra env var;
 * unlike Anthropic's Sonnet/Haiku split, there's no meaningful cost win
 * from downgrading further for memory summarization. Check
 * https://ai.google.dev/gemini-api/docs/models for what's currently
 * free-tier eligible if this stops working. */
export const DEFAULT_MODEL = "gemini-2.0-flash";

interface GeminiStreamChunk {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
}

function requireApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new MentorConfigError(
      "AI Mentor chưa được cấu hình: thiếu biến môi trường GEMINI_API_KEY trên server. Lấy API key miễn phí tại https://aistudio.google.com/apikey rồi thêm vào file .env."
    );
  }
  return apiKey;
}

function toGeminiContents(messages: MentorChatMessage[]) {
  return messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
}

/**
 * 400/403 → bad/missing key or malformed request; 404 → most commonly an
 * invalid MENTOR_CHAT_MODEL/MENTOR_BACKGROUND_MODEL value (model ids on the
 * free tier change over time — see https://ai.google.dev/gemini-api/docs/models
 * for what's currently available); 429 → free-tier quota spent for
 * now — all three are things an admin can fix, so all throw
 * MentorConfigError with Gemini's own error detail included. 5xx is
 * Google's own outage, genuinely transient.
 */
async function throwForBadResponse(res: Response): Promise<never> {
  const bodyText = await res.text().catch(() => "");
  let detail = bodyText;
  try {
    const parsed = JSON.parse(bodyText) as { error?: { message?: string } };
    if (parsed.error?.message) detail = parsed.error.message;
  } catch {
    // Not JSON — keep the raw text as the detail.
  }

  if (res.status === 429) {
    throw new MentorConfigError(
      "AI Mentor đã dùng hết hạn mức miễn phí của Gemini API cho phút/ngày hiện tại. Vui lòng thử lại sau ít phút, hoặc nâng cấp gói Gemini nếu cần dùng nhiều hơn."
    );
  }
  if (res.status === 400 || res.status === 403) {
    throw new MentorConfigError(
      `AI Mentor chưa được cấu hình đúng: Gemini API báo lỗi (${res.status})${detail ? `: ${detail}` : ""}. Vui lòng kiểm tra lại GEMINI_API_KEY trong file .env.`
    );
  }
  if (res.status === 404) {
    throw new MentorConfigError(
      `AI Mentor chưa được cấu hình đúng: model Gemini không tồn tại hoặc chưa khả dụng cho tài khoản này (lỗi 404${detail ? `: ${detail}` : ""}). Kiểm tra MENTOR_CHAT_MODEL/MENTOR_BACKGROUND_MODEL trong .env — danh sách model hiện có tại https://ai.google.dev/gemini-api/docs/models.`
    );
  }
  throw new Error(`Gemini API error ${res.status}: ${bodyText}`);
}

export async function* streamMentorReply(params: {
  system: string;
  messages: MentorChatMessage[];
  maxTokens?: number;
}): AsyncGenerator<string, MentorUsage, void> {
  const apiKey = requireApiKey();
  const model = process.env.MENTOR_CHAT_MODEL || DEFAULT_MODEL;

  const res = await fetch(`${GEMINI_API_BASE}/${model}:streamGenerateContent?alt=sse`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: params.system }] },
      contents: toGeminiContents(params.messages),
      generationConfig: { maxOutputTokens: params.maxTokens ?? 1024 },
    }),
  });

  if (!res.ok) {
    await throwForBadResponse(res);
  }
  if (!res.body) {
    throw new Error("Gemini API không trả về nội dung stream.");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let inputTokens = 0;
  let outputTokens = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      let chunk: GeminiStreamChunk;
      try {
        chunk = JSON.parse(line.slice(6));
      } catch {
        continue;
      }

      const text = chunk.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
      if (text) yield text;
      if (chunk.usageMetadata) {
        inputTokens = chunk.usageMetadata.promptTokenCount ?? inputTokens;
        outputTokens = chunk.usageMetadata.candidatesTokenCount ?? outputTokens;
      }
    }
  }

  return { inputTokens, outputTokens };
}

/** Non-streamed call on the cheap/fast background-task model tier. */
export async function completeMentorTask(params: { system?: string; messages: MentorChatMessage[]; maxTokens?: number }): Promise<string> {
  const apiKey = requireApiKey();
  const model = process.env.MENTOR_BACKGROUND_MODEL || DEFAULT_MODEL;

  const res = await fetch(`${GEMINI_API_BASE}/${model}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      ...(params.system ? { systemInstruction: { parts: [{ text: params.system }] } } : {}),
      contents: toGeminiContents(params.messages),
      generationConfig: { maxOutputTokens: params.maxTokens ?? 512 },
    }),
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) {
    await throwForBadResponse(res);
  }

  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  return data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
}
