"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { buildPaymentUrl } from "@/lib/services/vnpay";
import { grantProDays } from "@/lib/services/pro-grant";
import { getNewMemberOfferState } from "@/lib/services/new-member-offer";
import { getReferralDiscountState } from "@/lib/services/referral-discount";
import { PRO_PLANS, discountedPriceVnd, referralDiscountedPriceVnd, type ProPlanKey } from "@/lib/constants/billing";

export interface ActionResult {
  error?: string;
  redirectUrl?: string;
  orderId?: string;
  /** The amount actually recorded on the Payment row — always read this for
   * display instead of re-deriving from PRO_PLANS, since it may be the
   * discounted new-member price. */
  amount?: number;
}

/** Redeems an admin-generated single-use code (see admin-payments.ts's
 * generateActivationCodeAction) — an alternative to the bank-transfer flow
 * for giveaways, partners, or a learner who paid through another channel.
 * The conditional `updateMany` (not findUnique-then-update) closes the race
 * where two requests redeem the same code at nearly the same instant. */
export async function redeemActivationCodeAction(rawCode: string): Promise<ActionResult> {
  const profile = await requireUser();
  const code = rawCode.trim().toUpperCase();
  if (!code) return { error: "Vui lòng nhập mã kích hoạt" };

  const record = await db.activationCode.findUnique({ where: { code } });
  if (!record) return { error: "Mã kích hoạt không hợp lệ" };

  const claim = await db.activationCode.updateMany({
    where: { code, usedByUserId: null },
    data: { usedByUserId: profile.id, usedAt: new Date() },
  });
  if (claim.count === 0) return { error: "Mã kích hoạt này đã được sử dụng" };

  await grantProDays(profile.id, record.planDurationDays);
  revalidatePath("/pricing");
  return {};
}

/**
 * Bank-transfer path — no VNPay merchant account exists yet, so this is the
 * real upgrade mechanism for now: creates a PENDING Payment row an admin
 * reviews and approves manually (see /admin/payments). The pricing page
 * shows a per-order VietQR code (built from these same PRO_PLANS constants)
 * so the transfer note lets an admin match it back to this exact order.
 */
export async function declareBankTransferAction(planKey: ProPlanKey): Promise<ActionResult> {
  const profile = await requireUser();
  const plan = PRO_PLANS[planKey];
  if (!plan) return { error: "Gói không hợp lệ" };

  // Recomputed server-side, never trusted from the client — this is what
  // actually gets charged, so eligibility must be re-checked at the moment
  // of declaring, not assumed from whatever the pricing page rendered. If
  // both the welcome and referral discounts apply, they don't stack — take
  // whichever price is lower (mirrors late-attribution always paying the
  // flat 5% rather than a stacked rate).
  const [newMemberOffer, referralDiscount] = await Promise.all([
    getNewMemberOfferState(profile),
    getReferralDiscountState(profile),
  ]);
  const candidatePrices: number[] = [plan.amountVnd];
  if (newMemberOffer.eligible) candidatePrices.push(discountedPriceVnd(planKey));
  if (referralDiscount.eligible) candidatePrices.push(referralDiscountedPriceVnd(planKey));
  const amount = Math.min(...candidatePrices);

  const orderId = `TOEIC${Date.now()}${randomUUID().slice(0, 6)}`.toUpperCase();

  await db.payment.create({
    data: {
      userId: profile.id,
      orderId,
      amount,
      planDurationDays: plan.durationDays,
      status: "PENDING",
    },
  });

  revalidatePath("/pricing");
  return { orderId, amount };
}

/** Dormant until a real VNPay merchant account exists — kept working and
 * tested, just not currently wired into the pricing page's UI. */
export async function createUpgradeCheckoutAction(planKey: ProPlanKey): Promise<ActionResult> {
  const profile = await requireUser();
  const plan = PRO_PLANS[planKey];
  if (!plan) return { error: "Gói không hợp lệ" };

  const orderId = `TOEIC${Date.now()}${randomUUID().slice(0, 8)}`;

  await db.payment.create({
    data: {
      userId: profile.id,
      orderId,
      amount: plan.amountVnd,
      planDurationDays: plan.durationDays,
      status: "PENDING",
    },
  });

  const headerList = await headers();
  const ipAddr = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  let redirectUrl: string;
  try {
    redirectUrl = buildPaymentUrl({
      orderId,
      amountVnd: plan.amountVnd,
      orderInfo: `Nang cap TOEIC Mastery Pro - ${plan.label}`,
      ipAddr,
      returnUrl: `${siteUrl}/upgrade/return`,
    });
  } catch {
    return { error: "Cổng thanh toán chưa được cấu hình. Vui lòng thử lại sau." };
  }

  return { redirectUrl };
}
