import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { randomUUID, createHash } from "node:crypto";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { Prisma, type Profile } from "@/generated/prisma/client";
import type { AttributionSource } from "@/generated/prisma/enums";
import { parseDeviceFromUserAgent } from "@/lib/utils/device";

const REFERRAL_COOKIE = "toeic_ref";
/** Throttles the fingerprint-fallback DB lookup below to ~once per this
 * window per visitor, instead of on every single request from users who
 * have no referral cookie and never will (the overwhelming majority). */
const REFERRAL_CHECKED_COOKIE = "toeic_ref_checked";
const REFERRAL_CHECK_THROTTLE_SEC = 18 * 60 * 60;
const REFERRAL_ATTRIBUTION_WINDOW_DAYS = 60;
/** Signups that click a referral link within this grace period of creating
 * their account count as normal attribution; anything later is "late" and
 * always earns the referrer the flat 5% rate (see referral-commission.ts). */
const LATE_ATTRIBUTION_GRACE_MS = 60 * 60 * 1000;

function generateReferralCode(): string {
  return randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
}

/** Lazily backfills `referralCode` instead of a NOT NULL migration — every
 * profile gets one the first time it's loaded post-migration. Retries on a
 * collision with another freshly-generated code (astronomically rare at 8
 * base32-ish chars, but cheap to guard). */
async function ensureReferralCode(profile: Profile): Promise<Profile> {
  if (profile.referralCode) return profile;

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await db.profile.update({
        where: { id: profile.id },
        data: { referralCode: generateReferralCode() },
      });
    } catch (err) {
      if (!(err instanceof Prisma.PrismaClientKnownRequestError) || err.code !== "P2002") throw err;
    }
  }
  return profile;
}

/**
 * Resolves who referred this user, first-touch: the `toeic_ref` cookie set
 * by Proxy wins; if it's missing (blocked cookies, cross-device), fall back
 * to the most recent ReferralClick from the same IP+UA fingerprint within
 * the attribution window. Runs at most once per profile — short-circuits
 * forever once `referredByProfileId` is set, and never runs at all for a
 * user who has already paid once (see `firstProPaymentAt`).
 */
async function resolveReferralAttribution(profile: Profile): Promise<Profile> {
  if (profile.referredByProfileId || profile.firstProPaymentAt) return profile;

  const cookieStore = await cookies();
  const refCode = cookieStore.get(REFERRAL_COOKIE)?.value;

  let referrerId: string | null = null;
  let source: AttributionSource | null = null;

  if (refCode) {
    const referrer = await db.profile.findUnique({ where: { referralCode: refCode }, select: { id: true } });
    if (referrer) {
      referrerId = referrer.id;
      source = "COOKIE";
    }
  }

  if (!referrerId && !cookieStore.get(REFERRAL_CHECKED_COOKIE)) {
    const headerList = await headers();
    const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "0.0.0.0";
    const userAgent = headerList.get("user-agent") ?? "";
    const fingerprintHash = createHash("sha256").update(`${ip}|${userAgent}`).digest("hex");
    const windowStart = new Date(Date.now() - REFERRAL_ATTRIBUTION_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const click = await db.referralClick.findFirst({
      where: { fingerprintHash, clickedAt: { gte: windowStart }, referrerProfileId: { not: profile.id } },
      orderBy: { clickedAt: "desc" },
      select: { referrerProfileId: true },
    });
    if (click) {
      referrerId = click.referrerProfileId;
      source = "FINGERPRINT";
    }

    try {
      cookieStore.set(REFERRAL_CHECKED_COOKIE, "1", {
        httpOnly: true,
        sameSite: "lax",
        secure: true,
        maxAge: REFERRAL_CHECK_THROTTLE_SEC,
        path: "/",
      });
    } catch {
      // Called from a Server Component render — safe to ignore, this cookie
      // is only a rate-limit optimization, not a correctness requirement.
    }
  }

  if (!referrerId || referrerId === profile.id) return profile;

  return db.profile.update({
    where: { id: profile.id },
    data: {
      referredByProfileId: referrerId,
      referredAt: new Date(),
      attributionSource: source!,
      isLateAttribution: Date.now() - profile.createdAt.getTime() > LATE_ATTRIBUTION_GRACE_MS,
    },
  });
}

const DEVICE_SYNCED_COOKIE = "toeic_device_synced";
const DEVICE_SYNC_THROTTLE_SEC = 6 * 60 * 60;

/**
 * Upserts a Device row for the current browser (display-only, see the
 * /account/devices page — this never blocks a login). Fingerprint is
 * User-Agent alone, not IP+UA like ReferralClick: a device should stay
 * recognized across IP changes (home wifi vs. mobile data), unlike a
 * referral click's short-lived same-session correlation. Throttled by a
 * cookie so a device already seen recently doesn't write on every request.
 */
async function syncCurrentDevice(profile: Profile): Promise<void> {
  const cookieStore = await cookies();
  if (cookieStore.get(DEVICE_SYNCED_COOKIE)) return;

  const headerList = await headers();
  const userAgent = headerList.get("user-agent");
  if (!userAgent) return;
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || headerList.get("x-real-ip") || null;

  const fingerprintHash = createHash("sha256").update(userAgent).digest("hex");
  const { type, label } = parseDeviceFromUserAgent(userAgent);

  await db.device.upsert({
    where: { userId_fingerprintHash: { userId: profile.id, fingerprintHash } },
    create: { userId: profile.id, type, label, fingerprintHash, lastIp: ip },
    update: { lastSeenAt: new Date(), lastIp: ip, deletedAt: null },
  });

  try {
    cookieStore.set(DEVICE_SYNCED_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      maxAge: DEVICE_SYNC_THROTTLE_SEC,
      path: "/",
    });
  } catch {
    // Called from a Server Component render — safe to ignore, just means we
    // sync this device a bit more often than the throttle window intends.
  }
}

/**
 * Cached per-request: the session cookie's identity + the matching Profile
 * row. `cache()` dedupes this across every server component that calls it
 * in one render.
 */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session) return null;

  // The Google OAuth callback (src/app/auth/callback/route.ts) creates the
  // Profile row on first sign-in. This lazy-create is defense-in-depth for
  // any session whose row somehow doesn't exist (e.g. it was deleted).
  const existing = await db.profile.findUnique({ where: { id: session.sub } });
  let profile =
    existing ??
    (await db.profile.create({
      data: { id: session.sub, email: session.email },
    }));

  profile = await ensureReferralCode(profile);
  profile = await resolveReferralAttribution(profile);
  await syncCurrentDevice(profile);
  return profile;
});

export async function requireUser(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireUser();
  if (profile.role !== "ADMIN") redirect("/dashboard");
  return profile;
}

/** The one account allowed to change a user's Học viên/Admin role — every
 * other admin can still see the admin section (requireAdmin still governs
 * page access) but the role control itself is view-only for them. Plain
 * email check by design: this is a single hardcoded owner account, not a
 * general permissions system. */
export const SUPER_ADMIN_EMAIL = "bichoa05@gmail.com";

export function isSuperAdmin(profile: Pick<Profile, "email">): boolean {
  return profile.email === SUPER_ADMIN_EMAIL;
}

/** True while the user's plan is PRO and (if set) hasn't lapsed yet — a
 * null `proExpiresAt` means a lifetime/admin-granted Pro with no expiry. */
export function isPro(profile: Pick<Profile, "plan" | "proExpiresAt">): boolean {
  return profile.plan === "PRO" && (!profile.proExpiresAt || profile.proExpiresAt > new Date());
}

export async function requirePro(): Promise<Profile> {
  const profile = await requireUser();
  if (!isPro(profile)) redirect("/pricing?upgrade=required");
  return profile;
}

/** For Route Handlers: no redirect, callers return a 401 JSON response. */
export async function getAuthedProfileOrNull(): Promise<Profile | null> {
  return getCurrentProfile();
}
