/** Kept out of referral-commission.ts (a plain service, but shared with UI
 * that renders tier thresholds) — same reasoning as billing.ts. */

/** Rate for a referrer who has never paid for Pro themselves, and for any
 * "late attribution" referral (signup-to-click gap > 1h, see auth.ts) —
 * always flat, never climbs with successfulReferralCount. */
export const NON_PAYING_REFERRER_RATE_PERCENT = 5;
export const LATE_ATTRIBUTION_RATE_PERCENT = 5;

export type CommissionTierId = "L1" | "L2" | "L3" | "L4" | "L5";

export interface CommissionTier {
  tier: CommissionTierId;
  /** Inclusive lower bound of successfulReferralCount for this tier. */
  minReferrals: number;
  ratePercent: number;
  label: string;
}

export const COMMISSION_TIERS: CommissionTier[] = [
  { tier: "L1", minReferrals: 0, ratePercent: 15, label: "Bậc 1" },
  { tier: "L2", minReferrals: 10, ratePercent: 20, label: "Bậc 2" },
  { tier: "L3", minReferrals: 100, ratePercent: 25, label: "Bậc 3" },
  { tier: "L4", minReferrals: 1000, ratePercent: 30, label: "Bậc 4" },
  { tier: "L5", minReferrals: 3000, ratePercent: 35, label: "Bậc 5" },
];

/** A paying referrer's tier is driven purely by `successfulReferralCount`
 * (number of distinct people they've converted, not number of payments —
 * see recordReferralCommission). Always resolves to at least L1. */
export function resolveCommissionTier(successfulReferralCount: number): CommissionTier {
  let current = COMMISSION_TIERS[0];
  for (const tier of COMMISSION_TIERS) {
    if (successfulReferralCount >= tier.minReferrals) current = tier;
  }
  return current;
}

export function nextCommissionTier(successfulReferralCount: number): CommissionTier | null {
  const current = resolveCommissionTier(successfulReferralCount);
  const index = COMMISSION_TIERS.findIndex((t) => t.tier === current.tier);
  return COMMISSION_TIERS[index + 1] ?? null;
}

/** PENDING -> WITHDRAWABLE after this many days (see /api/cron/confirm-commissions). */
export const COMMISSION_CONFIRM_DAYS = 10;

/** Welcome discount for a Free account that was referred by someone —
 * combined with the (larger) new-member-offer discount by taking whichever
 * price is lower, never stacked (see getReferralDiscountState). */
export const REFERRAL_DISCOUNT_PERCENT = 5;
