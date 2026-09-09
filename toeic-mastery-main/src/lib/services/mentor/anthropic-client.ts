import "server-only";
import { MentorConfigError } from "./mentor-errors";

/**
 * Thin hand-rolled wrapper around the Anthropic Messages API — no SDK
 * dependency (matches the fetch-only style of translation-service.ts /
 * dictionary-service.ts, and avoids pulling in the Vercel AI SDK). Two
 * entry points: `streamMentorReply` for the live chat turn (SSE relayed
 * straight through to the browser by the route handler) and
 * `completeMentorTask` for cheap, non-streamed background jobs (memory
 * summarization, next-step rationale) on the faster/cheaper model tier.
 * Selected via llm-client.ts when MENTOR_LLM_PROVIDER=anthropic (the
 * Anthropic API has no free tier — see gemini-client.ts for the
 * no-cost-to-start default).
 */

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
export const DEFAULT_CHAT_MODEL = "claude-sonnet-5";
export const DEFAULT_BACKGROUND_MODEL = "claude-haiku-4-5-20251001";

export interface MentorChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface MentorUsage {
  inputTokens: number;
  outputTokens: number;
}

interface AnthropicStreamEvent {
  type: string;
  message?: { usage?: { input_tokens?: number } };
  delta?: { type?: string; text?: string; stop_reason?: string };
  usage?: { output_tokens?: number };
}

function requireApiKey(): string {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new MentorConfigError(
      "AI Mentor chưa được cấu hình: thiếu biến môi trường ANTHROPIC_API_KEY trên server. Vui lòng thêm API key Anthropic vào file .env rồi khởi động lại server."
    );
  }
  return apiKey;
}

/**
 * 401/403 → bad/missing key; 400/404 → most commonly an invalid
 * MENTOR_CHAT_MODEL/MENTOR_BACKGROUND_MODEL value (Anthropic returns 404
 * "not_found_error" for an unrecognized model id, sometimes 400 depending
 * on exactly what's wrong) — both are configuration problems an admin can
 * fix, so both throw MentorConfigError with Anthropic's own error detail
 * included. 5xx is Anthropic's own outage, genuinely transient, so that
 * stays a plain Error (generic "try again" message to the user).
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

  if (res.status === 401 || res.status === 403) {
    throw new MentorConfigError(
      "AI Mentor chưa được cấu hình đúng: ANTHROPIC_API_KEY trên server không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại giá trị trong file .env."
    );
  }
  if (res.status === 400 || res.status === 404) {
    throw new MentorConfigError(
      `AI Mentor chưa được cấu hình đúng (lỗi ${res.status} từ Anthropic${detail ? `: ${detail}` : ""}). Có thể MENTOR_CHAT_MODEL hoặc MENTOR_BACKGROUND_MODEL trong .env đang trỏ tới một model không tồn tại hoặc tài khoản API chưa có quyền dùng — vui lòng kiểm tra lại hai biến này.`
    );
  }
  throw new Error(`Anthropic API error ${res.status}: ${bodyText}`);
}

/**
 * Streams the conversational (chat-tier) model's reply as plain-text
 * deltas. The generator's return value (only available once the caller has
 * fully drained it) carries token usage for cost tracking — read via a
 * manual `for await` loop plus a final `.next()`, or see
 * mentor-messages route for the exact pattern.
 */
export async function* streamMentorReply(params: {
  system: string;
  messages: MentorChatMessage[];
  maxTokens?: number;
}): AsyncGenerator<string, MentorUsage, void> {
  const apiKey = requireApiKey();

  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.MENTOR_CHAT_MODEL || DEFAULT_CHAT_MODEL,
      max_tokens: params.maxTokens ?? 1024,
      system: params.system,
      messages: params.messages,
      stream: true,
    }),
  });

  if (!res.ok) {
    await throwForBadResponse(res);
  }
  if (!res.body) {
    throw new Error("Anthropic API không trả về nội dung stream.");
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
      let event: AnthropicStreamEvent;
      try {
        event = JSON.parse(line.slice(6));
      } catch {
        continue;
      }

      if (event.type === "content_block_delta" && event.delta?.type === "text_delta" && event.delta.text) {
        yield event.delta.text;
      } else if (event.type === "message_start") {
        inputTokens = event.message?.usage?.input_tokens ?? 0;
      } else if (event.type === "message_delta" && event.usage?.output_tokens !== undefined) {
        outputTokens = event.usage.output_tokens;
      }
    }
  }

  return { inputTokens, outputTokens };
}

/** Non-streamed call on the cheap/fast background-task model tier. */
export async function completeMentorTask(params: { system?: string; messages: MentorChatMessage[]; maxTokens?: number }): Promise<string> {
  const apiKey = requireApiKey();

  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.MENTOR_BACKGROUND_MODEL || DEFAULT_BACKGROUND_MODEL,
      max_tokens: params.maxTokens ?? 512,
      system: params.system,
      messages: params.messages,
    }),
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) {
    await throwForBadResponse(res);
  }

  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  return data.content?.find((block) => block.type === "text")?.text ?? "";
}
