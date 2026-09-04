import { REFERRAL_DISCOUNT_PERCENT } from "@/lib/constants/referral";

/** Kept out of billing.ts (a "use server" file) since Next.js only allows
 * async function exports there — plain objects/types aren't allowed. */
export const PRO_PLANS = {
  ONE_MONTH: { durationDays: 30, amountVnd: 199_000, label: "1 tháng" },
  THREE_MONTHS: { durationDays: 90, amountVnd: 399_000, label: "3 tháng", recommended: true },
  SIX_MONTHS: { durationDays: 180, amountVnd: 599_000, label: "6 tháng" },
} as const;

export type ProPlanKey = keyof typeof PRO_PLANS;

/** Real, server-enforced welcome discount for brand-new Free accounts (see
 * src/lib/services/new-member-offer.ts) — not a cosmetic banner. Rounded to
 * the nearest 1,000đ to land on the same "ends in 9,000" style as PRO_PLANS. */
export const NEW_MEMBER_OFFER_PERCENT = 25;
export const NEW_MEMBER_OFFER_WINDOW_DAYS = 3;

export function discountedPriceVnd(planKey: ProPlanKey): number {
  const plan = PRO_PLANS[planKey];
  return Math.round((plan.amountVnd * (100 - NEW_MEMBER_OFFER_PERCENT)) / 100 / 1000) * 1000;
}

/** Discount for a Free account referred by an affiliate — see
 * REFERRAL_DISCOUNT_PERCENT / getReferralDiscountState. Not stacked with
 * the new-member offer above; declareBankTransferAction takes whichever of
 * the two discounted prices is lower. */
export function referralDiscountedPriceVnd(planKey: ProPlanKey): number {
  const plan = PRO_PLANS[planKey];
  return Math.round((plan.amountVnd * (100 - REFERRAL_DISCOUNT_PERCENT)) / 100 / 1000) * 1000;
}

/** % cheaper than paying the 1-month price every 30 days for the same
 * duration — e.g. 3 months at 399k vs 3×199k=597k is a 33% saving. */
export function planSavingsPercent(planKey: ProPlanKey): number {
  const plan = PRO_PLANS[planKey];
  const baseline = PRO_PLANS.ONE_MONTH.amountVnd * (plan.durationDays / 30);
  return Math.round((1 - plan.amountVnd / baseline) * 100);
}

export function planPricePerDay(planKey: ProPlanKey): number {
  const plan = PRO_PLANS[planKey];
  return Math.round(plan.amountVnd / plan.durationDays);
}

/** No VNPay merchant account yet — upgrades are confirmed manually against
 * this personal bank account until real payment-gateway credentials exist
 * (the VNPay integration in src/lib/services/vnpay.ts is still there, ready
 * to switch back on once a merchant account is set up). */
export const BANK_TRANSFER_INFO = {
  bankCode: "MB", // VietQR short code for MB Bank
  bankName: "MB Bank (Ngân hàng Quân đội)",
  accountNumber: "6368603082005",
  accountName: "NGUYEN BICH HOA",
} as const;

/** VietQR's public, no-auth image API — generates an official, correctly
 * formatted VietQR code for any NAPAS-member bank given just the bank code
 * + account number. Embedding the amount + a per-order note here (instead
 * of a single static QR image) means each pending payment gets its own QR,
 * which makes matching an incoming transfer to the right order much easier
 * for manual admin review. */
export function buildVietQrImageUrl(amountVnd: number, note: string): string {
  const params = new URLSearchParams({
    amount: String(amountVnd),
    addInfo: note,
    accountName: BANK_TRANSFER_INFO.accountName,
  });
  return `https://img.vietqr.io/image/${BANK_TRANSFER_INFO.bankCode}-${BANK_TRANSFER_INFO.accountNumber}-compact2.png?${params.toString()}`;
}
