import type { Metadata } from "next";
import { TrendingUp, Users, Wallet } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getReferralOverview } from "@/lib/data/referrals";
import { StatCard } from "@/components/shared/stat-card";
import { ReferralLinkCard } from "@/components/account/referral-link-card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Giới thiệu bạn bè" };

export default async function AccountReferralsPage() {
  const profile = await requireUser();
  const overview = await getReferralOverview(profile);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Giới thiệu bạn bè</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chia sẻ link giới thiệu để nhận hoa hồng mỗi khi bạn bè nâng cấp Pro.
        </p>
      </div>

      <ReferralLinkCard referralLink={overview.referralLink} referralCode={overview.referralCode} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard icon={Users} label="Lượt giới thiệu thành công" value={overview.successfulReferralCount} />
        <StatCard
          icon={TrendingUp}
          label="Bậc hoa hồng hiện tại"
          value={overview.isPayingReferrer ? `${overview.currentTier.label} · ${overview.currentTier.ratePercent}%` : "5%"}
          hint={overview.isPayingReferrer ? undefined : "Nâng cấp Pro để mở khoá bậc hoa hồng cao hơn"}
          accent="info"
        />
        <StatCard
          icon={Wallet}
          label="Tổng hoa hồng đã ghi nhận"
          value={`${overview.totals.totalEarned.toLocaleString("vi-VN")}₫`}
          accent="success"
        />
      </div>

      {overview.isPayingReferrer && overview.nextTier && (
        <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground shadow-soft">
          Giới thiệu thêm{" "}
          <strong className="text-foreground">
            {overview.nextTier.minReferrals - overview.successfulReferralCount}
          </strong>{" "}
          người nâng cấp thành công để đạt {overview.nextTier.label} ({overview.nextTier.ratePercent}%).
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Học viên</th>
              <th className="px-4 py-3 font-medium">Ngày được giới thiệu</th>
              <th className="px-4 py-3 font-medium">Gói</th>
              <th className="px-4 py-3 font-medium">Hoa hồng từ người này</th>
            </tr>
          </thead>
          <tbody>
            {overview.referredUsers.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{u.fullName || "—"}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {u.referredAt ? u.referredAt.toLocaleDateString("vi-VN") : "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={u.plan === "PRO" ? "default" : "secondary"}>
                    {u.plan === "PRO" ? "Pro" : "Miễn phí"}
                  </Badge>
                </td>
                <td className="px-4 py-3 font-medium">{u.totalCommissionFromThem.toLocaleString("vi-VN")}₫</td>
              </tr>
            ))}
            {overview.referredUsers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  Bạn chưa giới thiệu ai. Hãy chia sẻ link ở trên!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
