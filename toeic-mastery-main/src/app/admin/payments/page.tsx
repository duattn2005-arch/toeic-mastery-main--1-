import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { PaymentActions } from "@/components/admin/payment-actions";
import { RefundPaymentButton } from "@/components/admin/refund-payment-button";
import { GenerateActivationCodeForm } from "@/components/admin/generate-activation-code-form";

export const metadata: Metadata = { title: "Quản lý thanh toán" };

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  PENDING: "secondary",
  SUCCESS: "default",
  FAILED: "destructive",
  REFUNDED: "destructive",
};

export default async function AdminPaymentsPage() {
  const [payments, activationCodes] = await Promise.all([
    db.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { email: true, fullName: true } } },
    }),
    db.activationCode.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { usedBy: { select: { email: true } } },
    }),
  ]);

  const pendingCount = payments.filter((p) => p.status === "PENDING").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Quản lý thanh toán</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {pendingCount > 0 ? `${pendingCount} giao dịch đang chờ xác nhận chuyển khoản` : "Không có giao dịch nào đang chờ"}
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">MÃ KÍCH HOẠT</h2>
        <GenerateActivationCodeForm />
        {activationCodes.length > 0 && (
          <div className="mt-4 flex flex-col gap-1.5">
            {activationCodes.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 border-b border-border/60 py-1.5 text-xs last:border-0">
                <span className="font-mono">{c.code}</span>
                <span className="text-muted-foreground">{c.planDurationDays} ngày</span>
                {c.usedByUserId ? (
                  <Badge variant="secondary">Đã dùng · {c.usedBy?.email}</Badge>
                ) : (
                  <Badge variant="default">Chưa dùng</Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Người dùng</th>
              <th className="px-4 py-3 font-medium">Mã đơn</th>
              <th className="px-4 py-3 font-medium">Số tiền</th>
              <th className="px-4 py-3 font-medium">Gói</th>
              <th className="px-4 py-3 font-medium">Thời gian</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{p.user.fullName || "—"}</p>
                  <p className="text-xs text-muted-foreground">{p.user.email}</p>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.orderId}</td>
                <td className="px-4 py-3 font-medium">{p.amount.toLocaleString("vi-VN")}₫</td>
                <td className="px-4 py-3 text-muted-foreground">{p.planDurationDays} ngày</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {p.createdAt.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[p.status]}>{p.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  {p.status === "PENDING" && <PaymentActions paymentId={p.id} />}
                  {p.status === "SUCCESS" && (
                    <div className="flex justify-end">
                      <RefundPaymentButton paymentId={p.id} />
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Chưa có giao dịch nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
