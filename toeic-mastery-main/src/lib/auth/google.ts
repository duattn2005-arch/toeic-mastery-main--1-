import { createRemoteJWKSet, jwtVerify } from "jose";

/** Hand-rolled Google Sign-In (authorization code flow) — replaces
 * Supabase's `signInWithOAuth`/`exchangeCodeForSession`. No SDK: two plain
 * HTTPS calls (redirect URL + token exchange) plus standard JWKS
 * verification of the returned `id_token` via `jose`. */

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set. Copy .env.example to .env and configure it.`);
  return value;
}

export function buildGoogleAuthUrl(state: string): string {
  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set("client_id", requireEnv("GOOGLE_CLIENT_ID"));
  url.searchParams.set("redirect_uri", requireEnv("GOOGLE_REDIRECT_URI"));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  // Always show the account chooser — never silently reuse whichever
  // Google session happens to already be open in the browser.
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

export interface GoogleProfile {
  /** Stable Google account id — see Profile.googleId. */
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  picture: string | null;
}

// Cached across invocations — createRemoteJWKSet keeps its own internal
// cache of Google's public keys and only refetches when a `kid` it hasn't
// seen shows up (Google rotates these infrequently).
const googleJwks = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));

export async function exchangeGoogleCode(code: string): Promise<GoogleProfile> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: requireEnv("GOOGLE_CLIENT_ID"),
      client_secret: requireEnv("GOOGLE_CLIENT_SECRET"),
      redirect_uri: requireEnv("GOOGLE_REDIRECT_URI"),
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    throw new Error(`Google token exchange failed (${response.status}): ${await response.text()}`);
  }

  const body = (await response.json()) as { id_token?: string };
  if (!body.id_token) throw new Error("Google token response had no id_token");

  // Verifying the id_token's signature (against Google's own published
  // keys) + issuer + audience is what actually proves this identity came
  // from Google for *this* app — not just that some token was returned.
  const { payload } = await jwtVerify(body.id_token, googleJwks, {
    issuer: GOOGLE_ISSUERS,
    audience: requireEnv("GOOGLE_CLIENT_ID"),
  });

  if (typeof payload.sub !== "string" || typeof payload.email !== "string") {
    throw new Error("Google id_token missing sub/email");
  }

  return {
    sub: payload.sub,
    email: payload.email,
    emailVerified: payload.email_verified === true,
    name: typeof payload.name === "string" ? payload.name : null,
    picture: typeof payload.picture === "string" ? payload.picture : null,
  };
}
