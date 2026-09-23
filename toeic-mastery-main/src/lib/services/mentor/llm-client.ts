import "server-only";
import * as anthropic from "./anthropic-client";
import * as gemini from "./gemini-client";

export { MentorConfigError } from "./mentor-errors";
export type { MentorChatMessage, MentorUsage } from "./anthropic-client";

/**
 * Single entry point every mentor route/service calls instead of importing
 * a provider client directly — swapping providers (or letting an admin
 * pick one via env, with zero code changes) only has to happen here.
 *
 * MENTOR_LLM_PROVIDER picks explicitly ("anthropic" | "gemini"). Left
 * unset, auto-detects from whichever API key is actually present, Gemini
 * first — Gemini is free to start (no card, get a key at
 * https://aistudio.google.com/apikey), Anthropic's API has no free tier
 * (unlike claude.ai's chat UI, it's prepaid-credits-only). If neither key
 * is set, this still resolves to "gemini" so the resulting
 * MentorConfigError points the admin at the free option first.
 */
function resolveProvider(): "anthropic" | "gemini" {
  const explicit = process.env.MENTOR_LLM_PROVIDER?.toLowerCase();
  if (explicit === "anthropic" || explicit === "gemini") return explicit;

  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return "gemini";
}

export function streamMentorReply(params: { system: string; messages: anthropic.MentorChatMessage[]; maxTokens?: number }) {
  return resolveProvider() === "gemini" ? gemini.streamMentorReply(params) : anthropic.streamMentorReply(params);
}

export function completeMentorTask(params: { system?: string; messages: anthropic.MentorChatMessage[]; maxTokens?: number; timeoutMs?: number }) {
  return resolveProvider() === "gemini" ? gemini.completeMentorTask(params) : anthropic.completeMentorTask(params);
}

/** The chat-tier model id actually in effect right now — for recording on
 * MentorMessage.modelId (see /api/mentor/messages) so that field reflects
 * whichever provider is really active instead of a hardcoded guess. */
export function getActiveChatModelId(): string {
  return resolveProvider() === "gemini"
    ? process.env.MENTOR_CHAT_MODEL || gemini.DEFAULT_MODEL
    : process.env.MENTOR_CHAT_MODEL || anthropic.DEFAULT_CHAT_MODEL;
}
