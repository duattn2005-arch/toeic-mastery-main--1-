import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { WithdrawalActions } from "@/components/admin/withdrawal-actions";
import { CancelCommissionButton } from "@/components/admin/cancel-commission-button";

export const metadata: Metadata = { title: "Quản lý rút tiền" };

const WITHDRAWAL_STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  PENDING: "secondary",
  APPROVED: "default",
  PAID: "default",
  REJECTED: "destructive",
};

const COMMISSION_STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  PENDING: "secondary",
  WITHDRAWABLE: "default",
  PAID: "default",
  CANCELLED: "destructive",
};

export default async function AdminWithdrawalsPage() {
  const [withdrawals, flaggedCommissions] = await Promise.all([
    db.withdrawal.findMany({
      orderBy: { requestedAt: "desc" },
      take: 100,
      include: { user: { select: { email: true, fullName: true } } },
    }),
    db.commission.findMany({
      where: { OR: [{ referrer: { isFlaggedFraud: true } }, { fraudNote: { not: null } }] },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        referrer: { select: { email: true, fullName: true, isFlaggedFraud: true, fraudNote: true } },
        referred: { select: { email: true, fullName: true } },
      },
    }),
  ]);

  const pendingCount = withdrawals.filter((w) => w.status === "PENDING").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Quản lý rút tiền</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {pendingCount > 0 ? `${pendingCount} yêu cầu đang chờ duyệt` : "Không có yêu cầu nào đang chờ"}
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Người dùng</th>
              <th className="px-4 py-3 font-medium">Số tiền</th>
              <th className="px-4 py-3 font-medium">Ngân hàng nhận</th>
              <th className="px-4 py-3 font-medium">Ngày yêu cầu</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.map((w) => (
              <tr key={w.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{w.user.fullName || "—"}</p>
                  <p className="text-xs text-muted-foreground">{w.user.email}</p>
                </td>
                <td className="px-4 py-3 font-medium">{w.amount.toLocaleString("vi-VN")}₫</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {w.bankName} · {w.accountNumber} · {w.accountHolder}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {w.requestedAt.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={WITHDRAWAL_STATUS_VARIANT[w.status]}>{w.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <WithdrawalActions withdrawalId={w.id} status={w.status} />
                </td>
              </tr>
            ))}
            {withdrawals.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Chưa có yêu cầu rút tiền nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Hoa hồng bị gắn cờ gian lận</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Tài khoản người giới thiệu bị đánh dấu vẫn đăng nhập và sử dụng bình thường — chỉ hoa hồng liên quan mới bị
          ảnh hưởng.
        </p>
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Người giới thiệu</th>
                <th className="px-4 py-3 font-medium">Người được giới thiệu</th>
                <th className="px-4 py-3 font-medium">Số tiền</th>
                <th className="px-4 py-3 font-medium">Ghi chú</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {flaggedCommissions.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{c.referrer.fullName || c.referrer.email}</p>
                    {c.referrer.isFlaggedFraud && <Badge variant="destructive">Đã đánh dấu</Badge>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.referred.fullName || c.referred.email}</td>
                  <td className="px-4 py-3 font-medium">{c.amount.toLocaleString("vi-VN")}₫</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{c.fraudNote || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={COMMISSION_STATUS_VARIANT[c.status]}>{c.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {(c.status === "PENDING" || c.status === "WITHDRAWABLE") && (
                      <CancelCommissionButton commissionId={c.id} />
                    )}
                  </td>
                </tr>
              ))}
              {flaggedCommissions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Không có hoa hồng nào bị gắn cờ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
