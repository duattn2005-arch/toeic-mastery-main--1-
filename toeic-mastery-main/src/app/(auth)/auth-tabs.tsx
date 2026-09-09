"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/login", label: "Đăng Nhập" },
  { href: "/register", label: "Đăng Ký" },
];

/** Segmented-control style tab bar switching between /login and /register —
 * doubles as the card's heading (no separate "Đăng nhập" title beneath it). */
export function AuthTabs() {
  const pathname = usePathname();

  return (
    <div className="flex rounded-full bg-muted p-1">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex-1 rounded-full py-2.5 text-center text-sm font-semibold transition-colors",
              active ? "bg-card text-pink-600 shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
