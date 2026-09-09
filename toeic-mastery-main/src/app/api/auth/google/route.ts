import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { buildGoogleAuthUrl } from "@/lib/auth/google";

const STATE_COOKIE = "oauth_state";
const NEXT_COOKIE = "oauth_next";
const OAUTH_COOKIE_MAX_AGE_SEC = 10 * 60;

/** Starts the Google sign-in flow: mints a CSRF `state`, stashes it (and
 * where to land afterward) in short-lived cookies, redirects to Google. The
 * button in google-auth-button.tsx just links here instead of calling any
 * SDK directly. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const next = searchParams.get("next");
  const state = randomBytes(16).toString("hex");

  const response = NextResponse.redirect(buildGoogleAuthUrl(state));
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: OAUTH_COOKIE_MAX_AGE_SEC,
  });
  // Only ever a same-site relative path (validated again on the way back in
  // the callback) — never trust this into a redirect without that check.
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    response.cookies.set(NEXT_COOKIE, next, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: OAUTH_COOKIE_MAX_AGE_SEC,
    });
  }
  return response;
}
