import "server-only";

/**
 * Thrown for problems an admin can actually fix — missing/invalid API key,
 * a wrong model name, a spent free quota. Route handlers (see
 * /api/mentor/messages) surface this error's own message to the user
 * instead of a generic "try again later" text, since telling them exactly
 * what's misconfigured is more useful than hiding it. Shared by every LLM
 * provider client (anthropic-client.ts, gemini-client.ts) so a single
 * `instanceof MentorConfigError` check at the route level works regardless
 * of which provider is active.
 */
export class MentorConfigError extends Error {}
