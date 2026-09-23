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
 * free-tier eligible if this stops working — Google retires model ids
 * faster than this comment gets updated (2.0-flash and 2.5-flash both
 * 404 "no longer available to new users" as of 2026-09). Deliberately the
 * full "-flash" tier, not "-flash-lite": lite variants have been seen
 * rejecting `thinkingConfig` outright with a 400 INVALID_ARGUMENT (see
 * streamMentorReply's generationConfig below), so swapping this back to a
 * lite model needs re-verifying that first. */
export const DEFAULT_MODEL = "gemini-3.5-flash";
/** Free-tier "high demand" 503s are common and hit different model
 * ids/aliases at different times (measured: gemini-flash-latest 503ing
 * consistently while gemini-3.5-flash next to it answered fine, and vice
 * versa on other days) — worth one retry against a different model before
 * giving up. This one specifically does NOT accept `thinkingConfig` (400s
 * on it), so the fallback call always omits that field. */
const FALLBACK_MODEL = "gemini-flash-lite-latest";

interface GeminiStreamChunk {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
}

/**
 * Multiple free-tier API keys round-robined — free-tier quota is enforced
 * per underlying Google Cloud project, so several keys from the SAME
 * project share one quota pool (no help), but keys from separate projects
 * each bring their own (this is what actually fixed the 429s: one key's
 * daily allowance getting hammered by both real traffic and hedging's extra
 * calls). GEMINI_KEYS="key1,key2,key3" is preferred; a lone GEMINI_API_KEY
 * still works as a single-key pool for anyone who hasn't set that up.
 */
interface TrackedKey {
  key: string;
  /** epoch ms; usable again once Date.now() >= this */
  cooldownUntil: number;
}

const DEFAULT_KEY_COOLDOWN_MS = 60_000;
/** Google's 429 body sometimes names a daily quota metric but still gives a
 * short retryDelay hint — never park a key longer than this even if that
 * hint is mis-parsed as huge, and never shorter than the floor above. */
const MAX_KEY_COOLDOWN_MS = 6 * 60 * 60 * 1000;

class GeminiKeyPool {
  private keys: TrackedKey[];
  private cursor = 0;

  constructor(keys: string[]) {
    this.keys = keys.map((key) => ({ key, cooldownUntil: 0 }));
  }

  get size(): number {
    return this.keys.length;
  }

  /** Round-robin over non-cooling-down keys; null once every key is
   * currently parked. */
  next(): string | null {
    for (let i = 0; i < this.keys.length; i++) {
      const idx = (this.cursor + i) % this.keys.length;
      const candidate = this.keys[idx];
      if (candidate.cooldownUntil <= Date.now()) {
        this.cursor = (idx + 1) % this.keys.length;
        return candidate.key;
      }
    }
    return null;
  }

  markCooldown(key: string, ms: number): void {
    const tracked = this.keys.find((k) => k.key === key);
    if (tracked) tracked.cooldownUntil = Date.now() + Math.min(Math.max(ms, DEFAULT_KEY_COOLDOWN_MS), MAX_KEY_COOLDOWN_MS);
  }
}

function loadGeminiKeys(): string[] {
  const multi = process.env.GEMINI_KEYS;
  if (multi) {
    return multi
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
  }
  const single = process.env.GEMINI_API_KEY;
  return single ? [single.trim()] : [];
}

/** Module-level singleton so cooldown state (and the round-robin cursor)
 * actually persists across requests within this Node process — a fresh
 * pool per call would forget every cooldown immediately. */
let sharedKeyPool: GeminiKeyPool | null = null;
function requireKeyPool(): GeminiKeyPool {
  if (!sharedKeyPool) sharedKeyPool = new GeminiKeyPool(loadGeminiKeys());
  if (sharedKeyPool.size === 0) {
    throw new MentorConfigError(
      "AI Mentor chưa được cấu hình: thiếu biến môi trường GEMINI_API_KEY (hoặc GEMINI_KEYS=\"key1,key2,...\" để dùng nhiều key) trên server. Lấy API key miễn phí tại https://aistudio.google.com/apikey rồi thêm vào file .env."
    );
  }
  return sharedKeyPool;
}

/** Parses Google's 429 body for its own suggested retry delay (e.g. "23s"),
 * falling back to DEFAULT_KEY_COOLDOWN_MS when absent/unparseable. */
function parseRetryDelayMs(bodyText: string): number {
  try {
    const parsed = JSON.parse(bodyText) as { error?: { details?: { "@type"?: string; retryDelay?: string }[] } };
    const detail = parsed.error?.details?.find((d) => d["@type"]?.includes("RetryInfo"));
    const match = detail?.retryDelay?.match(/^(\d+(?:\.\d+)?)s$/);
    if (match) return Math.round(parseFloat(match[1]) * 1000);
  } catch {
    // Not JSON, or no RetryInfo — fall through to the default.
  }
  return DEFAULT_KEY_COOLDOWN_MS;
}

function toGeminiContents(messages: MentorChatMessage[]) {
  return messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
}

/** disableThinking is a separate flag rather than always-on because
 * FALLBACK_MODEL 400s on `thinkingConfig` — see its comment above. */
function buildGenerationConfig(maxTokens: number, disableThinking: boolean) {
  return {
    maxOutputTokens: maxTokens,
    ...(disableThinking ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
  };
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

function fetchGeminiStream(
  model: string,
  apiKey: string,
  params: { system: string; messages: MentorChatMessage[]; maxTokens?: number },
  disableThinking: boolean,
  signal?: AbortSignal
) {
  return fetch(`${GEMINI_API_BASE}/${model}:streamGenerateContent?alt=sse`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: params.system }] },
      contents: toGeminiContents(params.messages),
      // 2.5+/3.x model lines default "thinking" (hidden chain-of-thought
      // tokens generated before the visible reply) to ON — great for hard
      // reasoning tasks, ~5-8x latency for a chat mentor that just needs a
      // direct answer (measured ~40s vs ~7-8s on the same prompt).
      generationConfig: buildGenerationConfig(params.maxTokens ?? 1024, disableThinking),
    }),
    signal,
  });
}

/** How long to give the configured model before hedging — measured
 * successful replies land well under this on a normal day (2.6-11s), so
 * this only fires once something's actually stuck, not on ordinary
 * variance. */
const HEDGE_DELAY_MS = 4_000;

function sleep(ms: number): Promise<"timeout"> {
  return new Promise((resolve) => setTimeout(() => resolve("timeout"), ms));
}

type StreamOutcome = { ok: true; res: Response } | { ok: false; error: unknown };

interface StreamAttempt {
  controller: AbortController;
  settled: Promise<StreamOutcome>;
}

function startStreamAttempt(
  model: string,
  apiKey: string,
  params: { system: string; messages: MentorChatMessage[]; maxTokens?: number },
  disableThinking: boolean
): StreamAttempt {
  const controller = new AbortController();
  const settled = fetchGeminiStream(model, apiKey, params, disableThinking, controller.signal)
    .then((res): StreamOutcome => ({ ok: true, res }))
    .catch((error): StreamOutcome => ({ ok: false, error }));
  return { controller, settled };
}

/**
 * Free-tier latency is highly variable on the exact same model+prompt
 * (measured 2.6s-68s) — most of that variance is Google's own queueing, not
 * something a retry-after-failure can fix since there's no failure to react
 * to yet. Hedging trades extra (still free) API calls for cutting off that
 * long tail: if the configured model hasn't answered within HEDGE_DELAY_MS,
 * fire the fallback model too and run with whichever actually comes back
 * first, aborting the other so it doesn't sit there burning quota.
 */
async function getGeminiStreamResponse(
  apiKey: string,
  params: { system: string; messages: MentorChatMessage[]; maxTokens?: number },
  primaryModel: string
): Promise<Response> {
  const primary = startStreamAttempt(primaryModel, apiKey, params, true);

  if (primaryModel === FALLBACK_MODEL) {
    const outcome = await primary.settled;
    if (!outcome.ok) throw outcome.error;
    return outcome.res;
  }

  const primaryOrTimeout = await Promise.race([primary.settled, sleep(HEDGE_DELAY_MS)]);
  if (primaryOrTimeout !== "timeout") {
    if (!primaryOrTimeout.ok) throw primaryOrTimeout.error;
    return primaryOrTimeout.res;
  }

  // Still no response after the hedge window — race the fallback alongside
  // the still-pending primary instead of replacing it, since the primary
  // may well finish (and finish first) a moment later.
  const fallback = startStreamAttempt(FALLBACK_MODEL, apiKey, params, false);

  const primaryDone = primary.settled.then((r) => ({ winner: primary, loser: fallback, outcome: r }));
  const fallbackDone = fallback.settled.then((r) => ({ winner: fallback, loser: primary, outcome: r }));

  let { winner, loser, outcome } = await Promise.race([primaryDone, fallbackDone]);
  if (!outcome.ok) {
    // That side failed at the network level (aborted/DNS/etc — a plain bad
    // HTTP status still comes through as `ok: true` here) — the other one
    // hasn't been touched yet, so give it the chance to actually answer.
    const other = winner === primary ? fallbackDone : primaryDone;
    ({ winner, loser, outcome } = await other);
    if (!outcome.ok) throw outcome.error;
  }

  loser.controller.abort();
  return outcome.res;
}

export async function* streamMentorReply(params: {
  system: string;
  messages: MentorChatMessage[];
  maxTokens?: number;
}): AsyncGenerator<string, MentorUsage, void> {
  const pool = requireKeyPool();
  const model = process.env.MENTOR_CHAT_MODEL || DEFAULT_MODEL;

  let res: Response | undefined;

  // Outer loop rotates API KEYS on 429 (quota exhausted — a different
  // key/project has its own separate allowance); the model hedging/fallback
  // inside getGeminiStreamResponse/the 503 check below is a different axis
  // (same key, different model) and stays nested inside one key's attempt.
  for (let attempt = 0; attempt < pool.size; attempt++) {
    const apiKey = pool.next();
    if (!apiKey) break; // every key currently cooling down from a recent 429

    res = await getGeminiStreamResponse(apiKey, params, model);

    if (res.status === 429) {
      pool.markCooldown(apiKey, parseRetryDelayMs(await res.text().catch(() => "")));
      continue;
    }

    // A 503 here means Gemini itself is overloaded, not a config mistake —
    // retrying the exact same model won't help, but a different model/alias
    // is frequently fine at the same moment (measured). Anything else
    // (400/403/404) is a real config problem an admin needs to see, so
    // those still go straight to throwForBadResponse below instead of
    // being silently papered over by the fallback.
    if (res.status === 503 && model !== FALLBACK_MODEL) {
      // Whether or not the fallback itself succeeds, it's the more relevant
      // response from here on — either the actual stream to consume, or the
      // error that should reach the user instead of the stale primary 503.
      res = await fetchGeminiStream(FALLBACK_MODEL, apiKey, params, false);
    }
    break;
  }

  if (!res) {
    throw new MentorConfigError(
      "AI Mentor đã dùng hết hạn mức miễn phí của Gemini API trên tất cả API key đang có. Vui lòng thử lại sau ít phút, hoặc thêm GEMINI_KEYS mới trong .env."
    );
  }

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

function fetchGeminiGenerate(model: string, apiKey: string, params: { system?: string; messages: MentorChatMessage[]; maxTokens?: number }, disableThinking: boolean) {
  return fetch(`${GEMINI_API_BASE}/${model}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      ...(params.system ? { systemInstruction: { parts: [{ text: params.system }] } } : {}),
      contents: toGeminiContents(params.messages),
      generationConfig: buildGenerationConfig(params.maxTokens ?? 512, disableThinking),
    }),
    signal: AbortSignal.timeout(20000),
  });
}

/** Non-streamed call on the cheap/fast background-task model tier. */
export async function completeMentorTask(params: { system?: string; messages: MentorChatMessage[]; maxTokens?: number }): Promise<string> {
  const pool = requireKeyPool();
  const model = process.env.MENTOR_BACKGROUND_MODEL || DEFAULT_MODEL;

  let res: Response | undefined;

  for (let attempt = 0; attempt < pool.size; attempt++) {
    const apiKey = pool.next();
    if (!apiKey) break;

    res = await fetchGeminiGenerate(model, apiKey, params, true);

    if (res.status === 429) {
      pool.markCooldown(apiKey, parseRetryDelayMs(await res.text().catch(() => "")));
      continue;
    }

    if (res.status === 503 && model !== FALLBACK_MODEL) {
      res = await fetchGeminiGenerate(FALLBACK_MODEL, apiKey, params, false);
    }
    break;
  }

  if (!res) {
    throw new MentorConfigError(
      "AI Mentor đã dùng hết hạn mức miễn phí của Gemini API trên tất cả API key đang có. Vui lòng thử lại sau ít phút, hoặc thêm GEMINI_KEYS mới trong .env."
    );
  }

  if (!res.ok) {
    await throwForBadResponse(res);
  }

  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  return data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
}
