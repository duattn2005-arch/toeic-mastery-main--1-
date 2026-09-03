"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Bell, CreditCard, Lightbulb, ScrollText, Smartphone, User, Users } from "lucide-react";

import { cn } from "@/lib/utils";

interface AccountNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const ACCOUNT_NAV_GROUPS: { title: string; items: AccountNavItem[] }[] = [
  {
    title: "TÀI KHOẢN",
    items: [
      { label: "Hồ sơ", href: "/account/profile", icon: User },
      { label: "Thiết bị", href: "/account/devices", icon: Smartphone },
      { label: "Thông báo", href: "/account/notifications", icon: Bell },
    ],
  },
  {
    title: "CHIA SẺ WEBSITE",
    items: [
      { label: "Thống kê giới thiệu", href: "/account/referrals", icon: Users },
      { label: "Hoa hồng", href: "/account/commissions", icon: CreditCard },
      { label: "Chính sách chia sẻ", href: "/account/referrals/policy", icon: ScrollText },
      { label: "Ý tưởng chia sẻ", href: "/account/referrals/ideas", icon: Lightbulb },
    ],
  },
];

export function AccountSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full shrink-0 lg:w-60">
      <nav className="flex flex-col gap-5">
        {ACCOUNT_NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-3 text-xs font-semibold text-muted-foreground">{group.title}</p>
            <div className="flex flex-col gap-1">
              {group.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active ? "bg-accent text-accent-foreground" : "text-foreground/80 hover:bg-muted"
                    )}
                  >
                    <item.icon className="size-[18px] shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
