import type { Metadata } from "next";
import { requireSuperAdmin } from "@/lib/auth";
import { getReferralLeaderboard } from "@/lib/data/referrals";

export const metadata: Metadata = { title: "Bảng xếp hạng giới thiệu" };

export default async function AdminReferralLeaderboardPage() {
  await requireSuperAdmin();
  const leaderboard = await getReferralLeaderboard();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bảng xếp hạng giới thiệu</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ai đang lan truyền link giới thiệu mạnh nhất — xếp theo số lần bấm "Sao chép" link, sau
          đó đến số người xem thực (fingerprint khác nhau) từng click qua link của họ. Lưu ý: bấm
          Sao chép chỉ ghi nhận việc đã lấy link, không đảm bảo họ đã thực sự dán đi đâu — không
          website nào theo dõi được clipboard sau khi rời trang. Trang này chỉ chủ tài khoản mới
          xem được.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Người dùng</th>
              <th className="px-4 py-3 font-medium">Số lần bấm Sao chép</th>
              <th className="px-4 py-3 font-medium">Người xem thực</th>
              <th className="px-4 py-3 font-medium">Tổng lượt click</th>
              <th className="px-4 py-3 font-medium">Giới thiệu thành công</th>
              <th className="px-4 py-3 font-medium">Hoa hồng đã ghi nhận</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((u, i) => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{u.fullName || "—"}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </td>
                <td className="px-4 py-3 font-medium">{u.copyCount}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.uniqueVisitors}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.totalClicks}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.successfulReferralCount}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {u.totalCommissionEarned.toLocaleString("vi-VN")}₫
                </td>
              </tr>
            ))}
            {leaderboard.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Chưa có lượt click hay giới thiệu nào được ghi nhận.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
