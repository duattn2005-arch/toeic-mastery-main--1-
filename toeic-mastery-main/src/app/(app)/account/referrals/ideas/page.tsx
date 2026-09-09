import type { Metadata } from "next";
import { MessageCircle, Send, Share2, Users2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { buildReferralLink } from "@/lib/data/referrals";
import { ReferralLinkCard } from "@/components/account/referral-link-card";

export const metadata: Metadata = { title: "Ý tưởng chia sẻ" };

const IDEAS = [
  {
    icon: Share2,
    title: "Đăng lên trang cá nhân hoặc nhóm học TOEIC",
    description:
      "Chia sẻ hành trình luyện thi của bạn kèm link giới thiệu trong các hội nhóm luyện thi TOEIC, IELTS trên Facebook.",
  },
  {
    icon: MessageCircle,
    title: "Gửi trực tiếp cho bạn bè, đồng nghiệp",
    description: "Nhắn tin cho bạn bè, đồng nghiệp đang ôn thi TOEIC — lời giới thiệu cá nhân thường hiệu quả nhất.",
  },
  {
    icon: Send,
    title: "Chia sẻ trong nhóm Zalo, Telegram lớp học",
    description: "Gửi link vào nhóm lớp học, nhóm ôn thi chung — nhiều người cùng cần tài liệu và đề luyện thi.",
  },
  {
    icon: Users2,
    title: "Giới thiệu cho gia sư, trung tâm ngoại ngữ",
    description: "Nếu bạn đang học với gia sư hoặc trung tâm, giới thiệu TOEIC Mastery như một công cụ luyện tập thêm.",
  },
];

export default async function ReferralIdeasPage() {
  const profile = await requireUser();
  const referralLink = buildReferralLink(profile.referralCode);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ý tưởng chia sẻ</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Một vài gợi ý để link giới thiệu của bạn đến được đúng người đang cần.
        </p>
      </div>

      <ReferralLinkCard referralLink={referralLink} referralCode={profile.referralCode} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {IDEAS.map((idea) => (
          <div key={idea.title} className="flex gap-3 rounded-2xl border border-border bg-card p-5 shadow-soft">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <idea.icon className="size-4" />
            </span>
            <div>
              <p className="text-sm font-medium">{idea.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{idea.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
