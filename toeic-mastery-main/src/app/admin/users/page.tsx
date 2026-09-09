import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdmin, isSuperAdmin } from "@/lib/auth";
import { RoleSelect } from "@/components/admin/role-select";
import { PlanSelect } from "@/components/admin/plan-select";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Quản lý người dùng" };

export default async function AdminUsersPage() {
  const admin = await requireAdmin();
  const canEditRole = isSuperAdmin(admin);

  const users = await db.profile.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { _count: { select: { attempts: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Quản lý người dùng</h1>
        <p className="mt-1 text-sm text-muted-foreground">{users.length} người dùng</p>
        {!canEditRole && (
          <p className="mt-2 text-xs text-muted-foreground">
            Chỉ tài khoản quản trị cấp cao mới có thể thay đổi vai trò (Học viên/Admin) — bạn chỉ có thể xem.
          </p>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Người dùng</th>
              <th className="px-4 py-3 font-medium">Điểm hiện tại</th>
              <th className="px-4 py-3 font-medium">Đề đã làm</th>
              <th className="px-4 py-3 font-medium">Vai trò</th>
              <th className="px-4 py-3 font-medium">Gói</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{u.fullName || "—"}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{u.currentScore ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{u._count.attempts}</td>
                <td className="px-4 py-3">
                  {u.role === "ADMIN" && canEditRole ? (
                    <div className="flex items-center gap-2">
                      <Badge>Admin</Badge>
                      <RoleSelect userId={u.id} role={u.role} canEdit={canEditRole} />
                    </div>
                  ) : (
                    <RoleSelect userId={u.id} role={u.role} canEdit={canEditRole} />
                  )}
                </td>
                <td className="px-4 py-3">
                  <PlanSelect userId={u.id} plan={u.plan} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
