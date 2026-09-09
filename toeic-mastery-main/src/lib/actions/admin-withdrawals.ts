"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export interface ActionResult {
  error?: string;
}

export async function approveWithdrawalAction(withdrawalId: string): Promise<ActionResult> {
  await requireAdmin();

  const withdrawal = await db.withdrawal.findUnique({ where: { id: withdrawalId } });
  if (!withdrawal) return { error: "Không tìm thấy yêu cầu rút tiền" };
  if (withdrawal.status !== "PENDING") return { error: "Yêu cầu này đã được xử lý" };

  await db.withdrawal.update({ where: { id: withdrawalId }, data: { status: "APPROVED" } });

  revalidatePath("/admin/withdrawals");
  return {};
}

/** Marks the payout as actually sent — the only step that moves the linked
 * Commission rows to PAID, which is final (a later refund on the original
 * Payment no longer touches a commission once it's PAID). */
export async function markWithdrawalPaidAction(withdrawalId: string): Promise<ActionResult> {
  await requireAdmin();

  const withdrawal = await db.withdrawal.findUnique({ where: { id: withdrawalId } });
  if (!withdrawal) return { error: "Không tìm thấy yêu cầu rút tiền" };
  if (withdrawal.status !== "APPROVED") return { error: "Yêu cầu này chưa được duyệt" };

  await db.$transaction([
    db.withdrawal.update({ where: { id: withdrawalId }, data: { status: "PAID", processedAt: new Date() } }),
    db.commission.updateMany({ where: { withdrawalId }, data: { status: "PAID" } }),
  ]);

  revalidatePath("/admin/withdrawals");
  return {};
}

/** Detaches the linked commissions back to the withdrawable pool (they stay
 * WITHDRAWABLE, just no longer tied to this rejected request) so the
 * learner can immediately re-request instead of losing the balance. */
export async function rejectWithdrawalAction(withdrawalId: string, adminNote?: string): Promise<ActionResult> {
  await requireAdmin();

  const withdrawal = await db.withdrawal.findUnique({ where: { id: withdrawalId } });
  if (!withdrawal) return { error: "Không tìm thấy yêu cầu rút tiền" };
  if (withdrawal.status === "PAID") return { error: "Yêu cầu đã thanh toán, không thể từ chối" };

  await db.$transaction([
    db.commission.updateMany({ where: { withdrawalId }, data: { withdrawalId: null } }),
    db.withdrawal.update({
      where: { id: withdrawalId },
      data: { status: "REJECTED", processedAt: new Date(), adminNote: adminNote ?? null },
    }),
  ]);

  revalidatePath("/admin/withdrawals");
  return {};
}

/** Manual override for a Commission an admin has reviewed and decided to
 * void — separate from the automatic fraud-detection cancellation in
 * referral-commission.ts, for cases the heuristics miss. */
export async function cancelCommissionAction(commissionId: string, note: string): Promise<ActionResult> {
  await requireAdmin();

  const commission = await db.commission.findUnique({ where: { id: commissionId } });
  if (!commission) return { error: "Không tìm thấy hoa hồng" };
  if (commission.status === "PAID") return { error: "Hoa hồng đã thanh toán, không thể huỷ" };

  await db.commission.update({
    where: { id: commissionId },
    data: { status: "CANCELLED", cancelledAt: new Date(), fraudNote: note },
  });

  revalidatePath("/admin/withdrawals");
  return {};
}
