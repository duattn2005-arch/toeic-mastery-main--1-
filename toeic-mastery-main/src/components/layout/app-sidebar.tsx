"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, Headphones, Settings, ShieldCheck, Target, User } from "lucide-react";

import { cn } from "@/lib/utils";
import { MAIN_NAV } from "@/lib/constants/nav";

export interface SidebarProfile {
  fullName: string | null;
  email: string;
  avatarUrl: string | null;
  role: "STUDENT" | "ADMIN";
  streakCount: number;
  targetScore: number | null;
  currentScore: number | null;
  plan: "FREE" | "PRO";
  proExpiresAt: Date | null;
}

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar({ profile }: { profile: SidebarProfile }) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-sidebar text-sidebar-foreground lg:flex">
      <Link href="/dashboard" className="flex items-center gap-2.5 px-6 py-6">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Headphones className="size-5" />
        </span>
        <span className="text-base font-semibold tracking-tight text-white">TOEIC Mastery</span>
      </Link>

      <nav data-tour="dashboard-sidebar-nav" className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
        {MAIN_NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-active-bg text-sidebar-active"
                  : "text-sidebar-muted-foreground hover:bg-sidebar-active-bg/60 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="size-[18px] shrink-0" />
              {item.label}
            </Link>
          );
        })}

        {profile.role === "ADMIN" && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              isActive(pathname, "/admin")
                ? "bg-sidebar-active-bg text-sidebar-active"
                : "text-sidebar-muted-foreground hover:bg-sidebar-active-bg/60 hover:text-sidebar-foreground"
            )}
          >
            <ShieldCheck className="size-[18px] shrink-0" />
            Quản trị
          </Link>
        )}
      </nav>

      <div className="flex flex-col gap-3 px-3 pb-4">
        <div className="rounded-2xl border border-sidebar-border bg-white/[0.03] p-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-sidebar-foreground">
              <Flame className="size-4 text-warning" /> Streak
            </span>
            <span className="font-semibold text-white">{profile.streakCount} ngày</span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-sidebar-foreground">
              <Target className="size-4 text-info" /> Mục tiêu
            </span>
            <span className="font-semibold text-white">
              {profile.currentScore ?? "—"} / {profile.targetScore ?? "?"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-sidebar-border p-2">
          <Link
            href="/account/profile"
            className="flex flex-1 items-center gap-2.5 rounded-xl px-1.5 py-1 hover:bg-sidebar-active-bg/60"
          >
            <span className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-sidebar-active-bg text-sidebar-foreground">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarUrl} alt="" className="size-full object-cover" />
              ) : (
                <User className="size-4" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium text-white">{profile.fullName || "Học viên"}</span>
              <span className="block truncate text-[11px] text-sidebar-muted-foreground">{profile.email}</span>
            </span>
          </Link>
          <Link
            href="/settings"
            className="flex size-8 shrink-0 items-center justify-center rounded-xl text-sidebar-muted-foreground hover:bg-sidebar-active-bg/60 hover:text-white"
            aria-label="Cài đặt"
          >
            <Settings className="size-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
