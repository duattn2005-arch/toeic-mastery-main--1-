import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { exchangeGoogleCode } from "@/lib/auth/google";
import { SESSION_COOKIE, sessionCookieOptions, signSessionToken } from "@/lib/auth/session";

const STATE_COOKIE = "oauth_state";
const NEXT_COOKIE = "oauth_next";

export async function GET(request: Request) {
  // Not request.url's origin: behind Nginx/a WAF, Next.js's Route Handler
  // URL reflects the app's own bind address (http://localhost:3000), not
  // the public host — redirecting there would send the browser nowhere
  // useful. NEXT_PUBLIC_SITE_URL is the one source of truth for "what
  // domain are we actually serving on."
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const cookieStore = await cookies();
  const storedState = cookieStore.get(STATE_COOKIE)?.value;
  const next = cookieStore.get(NEXT_COOKIE)?.value ?? "/dashboard";
  cookieStore.delete(STATE_COOKIE);
  cookieStore.delete(NEXT_COOKIE);

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  let google;
  try {
    google = await exchangeGoogleCode(code);
  } catch {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }
  if (!google.emailVerified) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  // Find-or-create by email: an account that previously existed under
  // password auth (pre-migration) auto-links here if the emails match — see
  // the plan's decision on dropping password auth entirely. `googleId` is
  // backfilled on every sign-in so it's always in sync even if it was null.
  const profile =
    (await db.profile.findUnique({ where: { email: google.email } })) ??
    (await db.profile.create({
      data: { email: google.email, googleId: google.sub, fullName: google.name, avatarUrl: google.picture },
    }));

  if (profile.googleId !== google.sub) {
    await db.profile.update({ where: { id: profile.id }, data: { googleId: google.sub } });
  }

  const token = await signSessionToken({ sub: profile.id, email: profile.email });
  cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions);

  return NextResponse.redirect(`${origin}${next}`);
}
