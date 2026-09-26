/**
 * Shared secret between src/proxy.ts (Edge runtime, can't reach Prisma) and
 * POST /api/referrals/click (Node runtime, writes the DB) — proves a click
 * report actually came from our own middleware, not a forged POST from
 * anywhere on the internet. Unauthenticated writes here would let anyone
 * inflate a rival's click count, or worse, plant a fake ReferralClick that
 * hijacks a stranger's future signup attribution via fingerprint matching
 * (see resolveReferralAttribution in src/lib/auth.ts).
 *
 * Derived from AUTH_SECRET (SHA-256, namespaced) instead of its own env
 * var: AUTH_SECRET is already required for login to work at all (see
 * secretKey() in src/lib/auth/session.ts), so this needs zero extra server
 * configuration — no separate secret anyone has to remember to set on the
 * server. Uses the global Web Crypto `crypto.subtle` rather than
 * node:crypto so the exact same code runs unchanged in the Edge runtime.
 */
export async function internalTrackSecret(): Promise<string> {
  const authSecret = process.env.AUTH_SECRET ?? "";
  const data = new TextEncoder().encode(`referral-click-track:${authSecret}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
