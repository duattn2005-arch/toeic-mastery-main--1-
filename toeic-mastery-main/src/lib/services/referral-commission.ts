import "server-only";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import type { Payment, Profile } from "@/generated/prisma/client";
import {
  COMMISSION_CONFIRM_DAYS,
  LATE_ATTRIBUTION_RATE_PERCENT,
  NON_PAYING_REFERRER_RATE_PERCENT,
  resolveCommissionTier,
} from "@/lib/constants/referral";

function normalizeAccountNumber(value: string): string {
  return value.replace(/\s+/g, "").toLowerCase();
}

/** Two independent, deliberately blunt anti-abuse checks: same bank account
 * (self-referral for the cash) or a device fingerprint the referrer has
 * also logged in from (same person, two accounts). Either one still
 * records the Commission row (for audit trail) but as CANCELLED, and only
 * flags the referrer's account rather than blocking it — see the plan's
 * "hiển thị/flag trước, enforce sau" philosophy, same as device limits. */
async function detectFraud(referrer: Profile, referred: Profile): Promise<string | null> {
  const [referrerBank, referredBank, referrerDevices, referredDevices] = await Promise.all([
    db.bankAccount.findUnique({ where: { userId: referrer.id }, select: { accountNumber: true } }),
    db.bankAccount.findUnique({ where: { userId: referred.id }, select: { accountNumber: true } }),
    db.device.findMany({ where: { userId: referrer.id, deletedAt: null }, select: { fingerprintHash: true } }),
    db.device.findMany({ where: { userId: referred.id, deletedAt: null }, select: { fingerprintHash: true } }),
  ]);

  if (
    referrerBank &&
    referredBank &&
    normalizeAccountNumber(referrerBank.accountNumber) === normalizeAccountNumber(referredBank.accountNumber)
  ) {
    return "Trùng số tài khoản ngân hàng với người được giới thiệu";
  }

  const referrerHashes = new Set(referrerDevices.map((d) => d.fingerprintHash));
  if (referredDevices.some((d) => referrerHashes.has(d.fingerprintHash))) {
    return "Trùng thiết bị đăng nhập với người được giới thiệu";
  }

  return null;
}

/**
 * Records the referral commission for a Payment that just turned SUCCESS.
 * Call this right next to grantProDays at the two places a Payment can
 * succeed (VNPay IPN, admin manual approval) — kept as a separate step
 * rather than folded into grantProDays, since that helper is shared with
 * activation-code redemption, which has no Payment/amount to base a
 * commission on.
 *
 * Commissions on every successful payment (not just the first), per the
 * "mọi lần thanh toán" decision — but successfulReferralCount (used for
 * tier lookup) counts unique referred *people*, incremented only the first
 * time a given referred user ever earns a non-cancelled commission.
 */
export async function recordReferralCommission(payment: Payment): Promise<void> {
  const referred = await db.profile.findUnique({ where: { id: payment.userId } });
  if (!referred) return;

  // Tracked regardless of referral status: also gates assigning a referrer
  // retroactively to someone who has already paid once (see auth.ts).
  if (!referred.firstProPaymentAt) {
    await db.profile.update({
      where: { id: referred.id },
      data: { firstProPaymentAt: payment.paidAt ?? new Date() },
    });
  }

  if (!referred.referredByProfileId) return;

  const referrer = await db.profile.findUnique({ where: { id: referred.referredByProfileId } });
  if (!referrer) return;

  const fraudNote = await detectFraud(referrer, referred);

  const ratePercent = fraudNote
    ? 0
    : referred.isLateAttribution
      ? LATE_ATTRIBUTION_RATE_PERCENT
      : !referrer.firstProPaymentAt
        ? NON_PAYING_REFERRER_RATE_PERCENT
        : resolveCommissionTier(referrer.successfulReferralCount).ratePercent;

  const tier =
    !fraudNote && !referred.isLateAttribution && referrer.firstProPaymentAt
      ? resolveCommissionTier(referrer.successfulReferralCount).tier
      : null;

  const amount = Math.round((payment.amount * ratePercent) / 100);
  const paidAt = payment.paidAt ?? new Date();
  const confirmAt = new Date(paidAt.getTime() + COMMISSION_CONFIRM_DAYS * 24 * 60 * 60 * 1000);

  const hasPriorCommission = await db.commission.findFirst({
    where: { referredId: referred.id, status: { not: "CANCELLED" } },
    select: { id: true },
  });
  const isFirstSuccessfulReferral = !fraudNote && !hasPriorCommission;

  try {
    await db.$transaction(async (tx) => {
      await tx.commission.create({
        data: {
          referrerId: referrer.id,
          referredId: referred.id,
          paymentId: payment.id,
          amount,
          ratePercent,
          tier,
          isLateAttribution: referred.isLateAttribution,
          status: fraudNote ? "CANCELLED" : "PENDING",
          fraudNote,
          confirmAt,
          cancelledAt: fraudNote ? new Date() : null,
        },
      });

      if (fraudNote) {
        await tx.profile.update({
          where: { id: referrer.id },
          data: { isFlaggedFraud: true, fraudNote },
        });
      }

      if (isFirstSuccessfulReferral) {
        await tx.profile.update({
          where: { id: referrer.id },
          data: { successfulReferralCount: { increment: 1 } },
        });
      }
    });
  } catch (err) {
    // paymentId is @unique — a retried IPN call for an already-processed
    // payment hits this and should no-op rather than crash the webhook.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return;
    throw err;
  }
}
