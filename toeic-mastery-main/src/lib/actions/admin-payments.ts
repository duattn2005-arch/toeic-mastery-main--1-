"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { grantProDays } from "@/lib/services/pro-grant";
import { recordReferralCommission } from "@/lib/services/referral-commission";

export interface ActionResult {
  error?: string;
  code?: string;
}

export async function generateActivationCodeAction(planDurationDays: number): Promise<ActionResult> {
  await requireAdmin();
  if (!Number.isInteger(planDurationDays) || planDurationDays <= 0) {
    return { error: "Số ngày không hợp lệ" };
  }

  const code = `PRO-${randomUUID().slice(0, 8).toUpperCase()}`;
  await db.activationCode.create({ data: { code, planDurationDays } });

  revalidatePath("/admin/payments");
  return { code };
}

export async function approvePaymentAction(paymentId: string): Promise<ActionResult> {
  await requireAdmin();

  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return { error: "Không tìm thấy giao dịch" };
  if (payment.status !== "PENDING") return { error: "Giao dịch này đã được xử lý" };

  const updatedPayment = await db.payment.update({
    where: { id: paymentId },
    data: { status: "SUCCESS", paidAt: new Date() },
  });
  await grantProDays(payment.userId, payment.planDurationDays);
  await recordReferralCommission(updatedPayment);

  revalidatePath("/admin/payments");
  return {};
}

export async function rejectPaymentAction(paymentId: string): Promise<ActionResult> {
  await requireAdmin();

  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return { error: "Không tìm thấy giao dịch" };
  if (payment.status !== "PENDING") return { error: "Giao dịch này đã được xử lý" };

  await db.payment.update({ where: { id: paymentId }, data: { status: "FAILED" } });

  revalidatePath("/admin/payments");
  return {};
}

/** Reverses a completed payment: refunds don't un-grant Pro days already
 * consumed, but they do void any commission the referrer hasn't been paid
 * out yet — a PAID commission stays paid (money already left the
 * business), matching how the withdrawal flow locks in a payout. */
export async function markPaymentRefundedAction(paymentId: string): Promise<ActionResult> {
  await requireAdmin();

  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return { error: "Không tìm thấy giao dịch" };
  if (payment.status !== "SUCCESS") return { error: "Chỉ có thể hoàn tiền giao dịch đã thành công" };

  await db.$transaction([
    db.payment.update({ where: { id: paymentId }, data: { status: "REFUNDED", refundedAt: new Date() } }),
    db.commission.updateMany({
      where: { paymentId, status: { in: ["PENDING", "WITHDRAWABLE"] } },
      data: { status: "CANCELLED", cancelledAt: new Date(), fraudNote: "Giao dịch gốc đã bị hoàn tiền" },
    }),
  ]);

  revalidatePath("/admin/payments");
  revalidatePath("/admin/withdrawals");
  return {};
}
