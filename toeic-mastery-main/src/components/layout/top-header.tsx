"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, Clock, Crown, LogOut, Menu, Search, Settings, User as UserIcon, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MAIN_NAV } from "@/lib/constants/nav";
import { signOutAction } from "@/app/(auth)/actions";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SoundPlayerPopover } from "@/components/layout/sound-player-popover";
import { SiteThemeGallery } from "@/components/layout/site-theme-gallery";
import type { SidebarProfile } from "@/components/layout/app-sidebar";
import type { VocabularyReminder } from "@/lib/data/vocabulary";

function ReminderBell({ reminder }: { reminder: VocabularyReminder }) {
  const total = reminder.dueTodayCount + reminder.dueTomorrowCount;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Nhắc nhở ôn tập"
        >
          <Bell className="size-[18px]" />
          {total > 0 && (
            <span className="notify-dot absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Nhắc ôn từ vựng</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {total === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">Không có từ nào cần ôn — bạn đang theo kịp lịch ôn tập!</p>
        ) : (
          <div className="flex flex-col gap-2 px-2 py-2 text-sm">
            {reminder.dueTodayCount > 0 && (
              <p>
                Hôm nay bạn có <strong>{reminder.dueTodayCount}</strong> từ cần ôn tập.
              </p>
            )}
            {reminder.dueTomorrowCount > 0 && (
              <p>
                Ngày mai bạn còn <strong>{reminder.dueTomorrowCount}</strong> từ cần ôn.
              </p>
            )}
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/vocabulary/review">Ôn tập ngay</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TopHeader({
  profile,
  vocabularyReminder,
  siteThemeId,
  onOpenSearch,
}: {
  profile: SidebarProfile;
  vocabularyReminder: VocabularyReminder;
  siteThemeId: string;
  onOpenSearch: () => void;
}) {
  // Trivial re-check of the same rule as src/lib/auth.ts's isPro() — that
  // file is server-only (Supabase server client + cache()), so it can't be
  // imported into this client component; duplicating a one-line boolean
  // check is cheaper than threading a computed prop through every caller.
  const isPro = profile.plan === "PRO" && (!profile.proExpiresAt || profile.proExpiresAt > new Date());

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Mở menu">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground [&_svg]:text-current">
          <SheetHeader className="px-6 py-6">
            <SheetTitle className="text-white">TOEIC Mastery</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 px-3">
            {MAIN_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-muted-foreground hover:bg-sidebar-active-bg/60 hover:text-white"
              >
                <item.icon className="size-[18px]" />
                {item.label}
              </Link>
            ))}
            {profile.role === "ADMIN" && (
              <Link
                href="/admin"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-muted-foreground hover:bg-sidebar-active-bg/60 hover:text-white"
              >
                Quản trị
              </Link>
            )}
          </nav>
        </SheetContent>
      </Sheet>

      <button
        type="button"
        onClick={onOpenSearch}
        className="flex flex-1 items-center gap-2 rounded-xl border border-input bg-muted/50 px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted sm:max-w-sm"
      >
        <Search className="size-4" />
        <span className="hidden sm:inline">Tìm đề thi, từ vựng, ngữ pháp...</span>
        <span className="sm:hidden">Tìm kiếm</span>
        <kbd className="ml-auto hidden rounded-md border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
          Ctrl K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <Button asChild data-tour="dashboard-quick-study" size="sm" className="glow-pulse-blue hidden bg-blue-500 text-white hover:bg-blue-400 sm:flex">
          <Link href="/quick-study">
            <Clock className="size-4" /> Quick Study
          </Link>
        </Button>
        {!isPro && (
          <Button
            asChild
            size="sm"
            className="hidden bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_0_16px_-2px_rgba(249,115,22,0.6)] hover:from-amber-400 hover:to-orange-400 sm:flex"
          >
            <Link href="/pricing">
              <Crown className="size-4" /> Nâng cấp
            </Link>
          </Button>
        )}
        <div data-tour="dashboard-icons" className="flex items-center gap-2">
          <ReminderBell reminder={vocabularyReminder} />
          <SoundPlayerPopover />
          <SiteThemeGallery currentThemeId={siteThemeId} isPro={isPro} />
          <ThemeToggle />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              data-tour="dashboard-avatar"
              className="flex size-9 items-center justify-center overflow-hidden rounded-full border border-border bg-muted"
              aria-label="Menu tài khoản"
            >
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarUrl} alt="" className="size-full object-cover" />
              ) : (
                <UserIcon className="size-4 text-muted-foreground" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="truncate">{profile.fullName || profile.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/account/profile">
                <UserIcon /> Hồ sơ
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/account/referrals">
                <Users /> Giới thiệu bạn bè
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings /> Cài đặt
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => signOutAction()}>
              <LogOut /> Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
