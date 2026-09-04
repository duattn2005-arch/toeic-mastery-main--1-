import type { Metadata } from "next";
import { CheckCircle2, Clock, Wallet } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getCommissionsPageData } from "@/lib/data/referrals";
import { StatCard } from "@/components/shared/stat-card";
import { BankAccountForm } from "@/components/account/bank-account-form";
import { RequestWithdrawalButton } from "@/components/account/request-withdrawal-button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Hoa hồng" };

const WITHDRAWAL_STATUS_LABEL: Record<string, string> = {
  PENDING: "Đang chờ duyệt",
  APPROVED: "Đã duyệt",
  PAID: "Đã thanh toán",
  REJECTED: "Bị từ chối",
};
const WITHDRAWAL_STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  PENDING: "secondary",
  APPROVED: "default",
  PAID: "default",
  REJECTED: "destructive",
};

export default async function AccountCommissionsPage() {
  const profile = await requireUser();
  const { bankAccount, withdrawals, totals } = await getCommissionsPageData(profile);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hoa hồng giới thiệu</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hoa hồng chuyển từ &quot;Đang chờ&quot; sang &quot;Có thể rút&quot; sau 10 ngày kể từ ngày người được giới
          thiệu thanh toán.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Wallet} label="Tổng cộng" value={`${totals.totalEarned.toLocaleString("vi-VN")}₫`} />
        <StatCard icon={Clock} label="Đang chờ" value={`${totals.pending.toLocaleString("vi-VN")}₫`} accent="warning" />
        <StatCard
          icon={CheckCircle2}
          label="Có thể rút"
          value={`${totals.withdrawable.toLocaleString("vi-VN")}₫`}
          accent="success"
        />
        <StatCard icon={Wallet} label="Đã rút" value={`${totals.paid.toLocaleString("vi-VN")}₫`} accent="info" />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h2 className="mb-4 text-sm font-semibold">Thông tin ngân hàng nhận tiền</h2>
        <BankAccountForm
          userId={profile.id}
          defaultValues={{
            bankName: bankAccount?.bankName ?? "",
            accountNumber: bankAccount?.accountNumber ?? "",
            accountHolder: bankAccount?.accountHolder ?? "",
            qrImageUrl: bankAccount?.qrImageUrl ?? null,
          }}
        />
      </div>

      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium">Rút hoa hồng</p>
          <p className="text-xs text-muted-foreground">
            Yêu cầu rút toàn bộ số dư &quot;Có thể rút&quot; hiện tại — admin sẽ duyệt và chuyển khoản thủ công.
          </p>
        </div>
        <RequestWithdrawalButton
          disabled={totals.withdrawable <= 0 || !bankAccount}
          withdrawableAmount={totals.withdrawable}
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Ngày yêu cầu</th>
              <th className="px-4 py-3 font-medium">Số tiền</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium">Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.map((w) => (
              <tr key={w.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-muted-foreground">{w.requestedAt.toLocaleDateString("vi-VN")}</td>
                <td className="px-4 py-3 font-medium">{w.amount.toLocaleString("vi-VN")}₫</td>
                <td className="px-4 py-3">
                  <Badge variant={WITHDRAWAL_STATUS_VARIANT[w.status]}>{WITHDRAWAL_STATUS_LABEL[w.status]}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{w.adminNote || "—"}</td>
              </tr>
            ))}
            {withdrawals.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  Chưa có yêu cầu rút tiền nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
