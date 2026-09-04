import "server-only";
import { db } from "@/lib/db";
import type { Profile } from "@/generated/prisma/client";

export interface ReferralDiscountState {
  eligible: boolean;
}

/** Mirrors getNewMemberOfferState's anti-replay rule (new-member-offer.ts):
 * a Free account that was ever referred gets one shot at this discount,
 * lost the moment any Payment row exists for them (even a cancelled or
 * abandoned one) — so declaring, then cancelling, then re-declaring can't
 * be used to re-roll a fresh discount. No time window unlike the
 * new-member offer: the referral relationship itself is already
 * time-bounded (60-day attribution window, resolved once in auth.ts). */
export async function getReferralDiscountState(
  profile: Pick<Profile, "id" | "plan" | "referredByProfileId">
): Promise<ReferralDiscountState> {
  if (profile.plan !== "FREE" || !profile.referredByProfileId) return { eligible: false };

  const existingPayment = await db.payment.findFirst({ where: { userId: profile.id }, select: { id: true } });
  if (existingPayment) return { eligible: false };

  return { eligible: true };
}
