import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  Layers,
  Users,
  Wallet,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";

const ADMIN_NAV = [
  { label: "Tổng quan", href: "/admin", icon: LayoutDashboard },
  { label: "Đề thi", href: "/admin/tests", icon: ClipboardList },
  { label: "Câu hỏi", href: "/admin/questions", icon: BookOpen },
  { label: "Từ vựng", href: "/admin/vocabulary", icon: Layers },
  { label: "Người dùng", href: "/admin/users", icon: Users },
  { label: "Thanh toán", href: "/admin/payments", icon: CreditCard },
  { label: "Rút tiền", href: "/admin/withdrawals", icon: Wallet },
  { label: "Thống kê", href: "/admin/analytics", icon: BarChart3 },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-svh bg-background">
      <div className="flex min-h-svh">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card px-3 py-6 lg:flex">
          <Link href="/dashboard" className="mb-6 px-3 text-xs font-medium text-muted-foreground hover:text-foreground">
            ← Về ứng dụng
          </Link>
          <p className="mb-3 px-3 text-xs font-semibold text-muted-foreground">QUẢN TRỊ</p>
          <nav className="flex flex-col gap-1">
            {ADMIN_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/80 hover:bg-muted"
              >
                <item.icon className="size-[18px]" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 px-4 py-6 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
