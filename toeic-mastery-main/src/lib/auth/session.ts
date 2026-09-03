import { SignJWT, jwtVerify } from "jose";

/**
 * Stateless, signed session cookie — replaces Supabase's JWT session.
 * Verification is pure (HMAC via `jose`, Web Crypto based) so it runs in
 * both the Node runtime (Server Components/Route Handlers, via
 * `getCurrentProfile()` in src/lib/auth.ts) and the Edge runtime
 * (src/proxy.ts, which cannot reach Postgres/Prisma directly).
 */

export const SESSION_COOKIE = "session";
const SESSION_MAX_AGE_SEC = 30 * 24 * 60 * 60; // 30 days
/** Re-sign and re-set the cookie once less than this much lifetime remains
 * — a sliding expiration, replacing Supabase's refresh-token rotation. */
export const SESSION_REFRESH_THRESHOLD_SEC = 7 * 24 * 60 * 60; // 7 days

export const sessionCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SEC,
};

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set. Copy .env.example to .env and configure it.");
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  /** Profile.id */
  sub: string;
  email: string;
  /** Unix seconds — used by the proxy to decide whether to slide-refresh. */
  exp: number;
}

export async function signSessionToken(payload: { sub: string; email: string }): Promise<string> {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SEC}s`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (typeof payload.sub !== "string" || typeof payload.email !== "string" || typeof payload.exp !== "number") {
      return null;
    }
    return { sub: payload.sub, email: payload.email, exp: payload.exp };
  } catch {
    // Expired, malformed, or signed with a different/old secret.
    return null;
  }
}
