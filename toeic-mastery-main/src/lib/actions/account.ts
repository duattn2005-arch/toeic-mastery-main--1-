"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { bankAccountSchema, type BankAccountInput } from "@/lib/validations/account";

export interface ActionResult {
  error?: string;
}

/** Soft-delete only — the device stops showing in /account/devices and no
 * longer counts toward the on-screen limit, but the login itself is never
 * blocked (see the plan's "hiển thị/flag trước, enforce sau" decision). */
export async function deleteDeviceAction(deviceId: string): Promise<ActionResult> {
  const profile = await requireUser();

  const device = await db.device.findUnique({ where: { id: deviceId } });
  if (!device || device.userId !== profile.id) return { error: "Không tìm thấy thiết bị" };

  await db.device.update({ where: { id: deviceId }, data: { deletedAt: new Date() } });
  revalidatePath("/account/devices");
  return {};
}

export async function updateBankAccountAction(input: BankAccountInput): Promise<ActionResult> {
  const profile = await requireUser();

  const parsed = bankAccountSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  await db.bankAccount.upsert({
    where: { userId: profile.id },
    create: { userId: profile.id, ...parsed.data },
    update: parsed.data,
  });

  revalidatePath("/account/commissions");
  return {};
}

/**
 * Withdraws the entire currently-withdrawable balance in one request rather
 * than a partial amount — every WITHDRAWABLE commission at the moment of
 * the request gets attached to a single new Withdrawal row, which is what
 * markWithdrawalPaidAction later flips to PAID as a batch.
 */
export async function requestWithdrawalAction(): Promise<ActionResult> {
  const profile = await requireUser();

  const bankAccount = await db.bankAccount.findUnique({ where: { userId: profile.id } });
  if (!bankAccount) return { error: "Vui lòng thêm tài khoản ngân hàng trước khi yêu cầu rút tiền" };

  const withdrawableCommissions = await db.commission.findMany({
    where: { referrerId: profile.id, status: "WITHDRAWABLE" },
    select: { id: true, amount: true },
  });
  const amount = withdrawableCommissions.reduce((sum, c) => sum + c.amount, 0);
  if (amount <= 0) return { error: "Bạn chưa có hoa hồng nào có thể rút" };

  await db.$transaction(async (tx) => {
    const withdrawal = await tx.withdrawal.create({
      data: {
        userId: profile.id,
        amount,
        bankName: bankAccount.bankName,
        accountNumber: bankAccount.accountNumber,
        accountHolder: bankAccount.accountHolder,
      },
    });
    await tx.commission.updateMany({
      where: { id: { in: withdrawableCommissions.map((c) => c.id) } },
      data: { withdrawalId: withdrawal.id },
    });
  });

  revalidatePath("/account/commissions");
  return {};
}
