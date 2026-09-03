import type { Metadata } from "next";
import { Check, Crown } from "lucide-react";
import { requireUser, isPro } from "@/lib/auth";
import { getNewMemberOfferState } from "@/lib/services/new-member-offer";
import { Badge } from "@/components/ui/badge";
import { ProCard } from "@/components/billing/pro-card";

export const metadata: Metadata = { title: "Bảng giá" };

const FREE_BENEFITS = [
  "Học bài cơ bản & Mini/Mock Test giới hạn",
  "Tra từ bôi đen: 20 từ/ngày",
  "Chữa câu tức thì giới hạn/ngày",
  "Quick Study cố định 7 phút",
  "Quản lý từ vựng 3 trạng thái & Lịch ôn ngày 1–7",
  "Xem Ngân hàng lỗi sai cơ bản",
];

export default async function PricingPage() {
  const profile = await requireUser();
  const pro = isPro(profile);
  const offer = await getNewMemberOfferState(profile);

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Bảng giá</h1>
        <p className="mt-1 text-sm text-muted-foreground">Chọn gói phù hợp để học TOEIC hiệu quả hơn.</p>
        {pro ? (
          <Badge className="mt-3" variant="default">
            <Crown className="size-3.5" /> Bạn đang dùng gói Pro
            {profile.proExpiresAt && ` — hết hạn ${profile.proExpiresAt.toLocaleDateString("vi-VN")}`}
          </Badge>
        ) : (
          <Badge className="mt-3" variant="secondary">
            Bạn đang dùng gói Free
          </Badge>
        )}
      </div>

      <div className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-5 md:grid-cols-2">
        <div className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-soft">
          <span className="text-lg font-semibold">Miễn phí</span>
          <p className="mt-1 text-sm text-muted-foreground">Dành cho người mới bắt đầu trải nghiệm</p>
          <p className="mt-4 text-3xl font-bold">0đ</p>
          <ul className="mt-5 flex flex-col gap-2 text-sm">
            {FREE_BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-success" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
          {!pro && (
            <span className="mt-6 rounded-lg border border-border py-2.5 text-center text-sm font-medium text-muted-foreground">Gói hiện tại</span>
          )}
        </div>

        <ProCard offer={offer} />
      </div>
    </div>
  );
}
