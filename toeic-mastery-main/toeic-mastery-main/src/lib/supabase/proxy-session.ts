import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password"];
const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

/** First-touch attribution cookie: whichever referral link a visitor
 * clicks first is kept for 60 days, even if they later click a different
 * one — see §4 of the affiliate plan. Never overwritten once set. */
const REFERRAL_COOKIE = "toeic_ref";
const REFERRAL_COOKIE_MAX_AGE_SEC = 60 * 24 * 60 * 60;

function isPublicAsset(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/auth/callback") ||
    pathname === "/favicon.ico" ||
    /\.(svg|png|jpg|jpeg|gif|webp|mp3|ico)$/.test(pathname)
  );
}

/** Applied on whichever response object actually gets returned (`next()` or
 * a redirect) — Proxy may swap `response` out from under us while refreshing
 * the Supabase session cookie, so the referral cookie can't just be set once
 * on an intermediate object. */
function withReferralCookie(response: NextResponse, code: string | null) {
  if (code) {
    response.cookies.set(REFERRAL_COOKIE, code, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      maxAge: REFERRAL_COOKIE_MAX_AGE_SEC,
      path: "/",
    });
  }
  return response;
}

/** Fire-and-forget log of the click for the fallback fingerprint-matching
 * path (see getCurrentProfile in src/lib/auth.ts) — reads IP/UA off the
 * original incoming request, not a Vercel-internal fetch, so the recorded
 * address is the visitor's, not the proxy's. */
function trackReferralClick(request: NextRequest, event: NextFetchEvent, code: string) {
  const secret = process.env.INTERNAL_TRACK_SECRET;
  if (!secret) return;

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "0.0.0.0";
  const userAgent = request.headers.get("user-agent") ?? "";

  event.waitUntil(
    fetch(new URL("/api/referrals/click", request.url), {
      method: "POST",
      headers: { "content-type": "application/json", "x-internal-secret": secret },
      body: JSON.stringify({ code, ip, userAgent, path: request.nextUrl.pathname }),
    }).catch(() => {})
  );
}

/**
 * Refreshes the Supabase session cookie on every request and redirects
 * unauthenticated users away from protected routes. Role checks for /admin
 * still happen server-side in the admin layout — this is coarse gating only.
 */
export async function updateSession(request: NextRequest, event: NextFetchEvent) {
  let response = NextResponse.next({ request });

  if (isPublicAsset(request.nextUrl.pathname)) {
    return response;
  }

  const refParam = request.nextUrl.searchParams.get("ref");
  const hasReferralCookie = request.cookies.has(REFERRAL_COOKIE);
  const referralCodeToPersist = refParam && !hasReferralCookie ? refParam : null;
  if (refParam) {
    trackReferralClick(request, event, refParam);
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // API routes manage their own authorization (401 JSON, or intentionally
  // public like /api/dictionary) — redirecting a fetch() call to an HTML
  // login page would break every client-side call. The session cookie
  // refresh above still runs so `getAuthedProfileOrNull()` sees a fresh
  // session inside the route handler.
  if (pathname.startsWith("/api/")) {
    return withReferralCookie(response, referralCodeToPersist);
  }

  const isPublic = PUBLIC_ROUTES.includes(pathname);
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return withReferralCookie(NextResponse.redirect(url), referralCodeToPersist);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return withReferralCookie(NextResponse.redirect(url), referralCodeToPersist);
  }

  return withReferralCookie(response, referralCodeToPersist);
}
