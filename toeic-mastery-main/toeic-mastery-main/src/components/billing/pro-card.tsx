"use client";

import * as React from "react";
import { Check, Copy, Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { declareBankTransferAction } from "@/lib/actions/billing";
import { ActivationCodeForm } from "@/components/billing/activation-code-form";
import {
  PRO_PLANS,
  BANK_TRANSFER_INFO,
  buildVietQrImageUrl,
  planSavingsPercent,
  planPricePerDay,
  discountedPriceVnd,
  NEW_MEMBER_OFFER_PERCENT,
  type ProPlanKey,
} from "@/lib/constants/billing";
import type { NewMemberOfferState } from "@/lib/services/new-member-offer"; // type-only: server-only module, erased at build time

const PRO_BENEFITS = [
  "Không giới hạn Mock Test, Tra từ bôi đen & Chữa câu tức thì",
  "Mở khóa toàn bộ Từ đồng nghĩa & Ví dụ chuyên sâu",
  "Tùy chỉnh Quick Study trượt 5 – 60 phút",
  "Tự tạo đề test từ câu sai & từ đã lưu",
  "Xuất bản in PDF từ vựng (chọn từ + dòng Notes)",
  "Lộ trình cấp tốc 14–30 ngày & Study Plan theo ngày thi",
  "Mở khóa Live theme chuyển động + Upload background",
  "100% Không quảng cáo & Hỗ trợ ưu tiên",
];

function CopyableRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border/60 py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard.writeText(value);
          toast.success("Đã sao chép");
        }}
        className="flex items-center gap-1.5 font-medium hover:text-primary"
      >
        {value}
        <Copy className="size-3.5" />
      </button>
    </div>
  );
}

export function ProCard({ offer }: { offer: NewMemberOfferState }) {
  const [planKey, setPlanKey] = React.useState<ProPlanKey>("THREE_MONTHS");
  const [pending, startTransition] = React.useTransition();
  const [order, setOrder] = React.useState<{ orderId: string; planKey: ProPlanKey; amount: number } | null>(null);

  const plan = PRO_PLANS[planKey];
  const displayPrice = offer.eligible ? discountedPriceVnd(planKey) : plan.amountVnd;

  function handleUpgrade() {
    startTransition(async () => {
      const result = await declareBankTransferAction(planKey);
      if (result.error || !result.orderId || result.amount === undefined) {
        toast.error(result.error ?? "Không tạo được yêu cầu, vui lòng thử lại");
        return;
      }
      setOrder({ orderId: result.orderId, planKey, amount: result.amount });
    });
  }

  return (
    <div className="flex flex-col rounded-3xl border-2 border-primary/40 bg-card p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-lg font-semibold">
          <Crown className="size-5 text-primary" /> PRO Plan
        </span>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">PHỔ BIẾN NHẤT</span>
      </div>

      {order ? (
        <div className="mt-5 flex flex-col items-center gap-4 text-center">
          <p className="text-sm font-medium">
            Quét mã để chuyển khoản <span className="text-primary">{order.amount.toLocaleString("vi-VN")}₫</span> (
            {PRO_PLANS[order.planKey].label})
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={buildVietQrImageUrl(order.amount, order.orderId)}
            alt="VietQR chuyển khoản"
            className="h-56 w-56 rounded-xl border border-border"
          />
          <div className="w-full text-left">
            <CopyableRow label="Ngân hàng" value={BANK_TRANSFER_INFO.bankName} />
            <CopyableRow label="Số tài khoản" value={BANK_TRANSFER_INFO.accountNumber} />
            <CopyableRow label="Chủ tài khoản" value={BANK_TRANSFER_INFO.accountName} />
            <CopyableRow label="Nội dung chuyển khoản" value={order.orderId} />
          </div>
          <p className="rounded-lg bg-warning/10 p-3 text-xs text-warning">
            Nhập đúng nội dung <strong>{order.orderId}</strong> khi chuyển khoản để admin xác nhận đúng đơn. Pro sẽ được kích hoạt trong vài giờ sau khi
            admin duyệt.
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => setOrder(null)}>
            Chọn gói khác
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {(Object.keys(PRO_PLANS) as ProPlanKey[]).map((key) => {
              const p = PRO_PLANS[key];
              const active = key === planKey;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPlanKey(key)}
                  className={cn(
                    "relative rounded-xl border p-2.5 text-center text-xs font-medium transition-colors",
                    active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  {"recommended" in p && p.recommended && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-semibold text-primary-foreground">
                      Khuyên dùng
                    </span>
                  )}
                  {p.label}
                </button>
              );
            })}
          </div>

          <div className="mt-5 text-center">
            {offer.eligible ? (
              <div className="flex items-center justify-center gap-2">
                <span className="text-base text-muted-foreground line-through">{plan.amountVnd.toLocaleString("vi-VN")}đ</span>
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                  -{NEW_MEMBER_OFFER_PERCENT}%
                </span>
              </div>
            ) : null}
            <p className="text-3xl font-bold">{displayPrice.toLocaleString("vi-VN")}đ</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Tiết kiệm {planSavingsPercent(planKey)}% • ~{planPricePerDay(planKey).toLocaleString("vi-VN")}đ/ngày
            </p>
            {offer.eligible && (
              <p className="mt-1 text-xs font-medium text-primary">🎁 Ưu đãi chào mừng thành viên mới — chỉ áp dụng lần đầu nâng cấp</p>
            )}
          </div>

          <ul className="mt-5 flex flex-col gap-2 text-sm">
            {PRO_BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>

          <Button type="button" size="lg" className="mt-6" disabled={pending} onClick={handleUpgrade}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            NÂNG CẤP PRO NGAY
          </Button>

          <div className="mt-4 border-t border-border pt-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Đã có mã kích hoạt?</p>
            <ActivationCodeForm />
          </div>
        </>
      )}
    </div>
  );
}
