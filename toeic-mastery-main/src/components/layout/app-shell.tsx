"use client";

import * as React from "react";
import { AppSidebar, type SidebarProfile } from "@/components/layout/app-sidebar";
import { TopHeader } from "@/components/layout/top-header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { CommandPalette } from "@/components/layout/command-palette";
import { SiteThemeBackground } from "@/components/layout/site-theme-background";
import { WelcomeOfferModal } from "@/components/billing/welcome-offer-modal";
import { UpgradeNudgeModal } from "@/components/billing/upgrade-nudge-modal";
import { getSiteTheme } from "@/lib/constants/site-themes";
import type { VocabularyReminder } from "@/lib/data/vocabulary";

export function AppShell({
  profile,
  vocabularyReminder,
  newMemberOfferDeadline,
  siteThemeId,
  children,
}: {
  profile: SidebarProfile;
  vocabularyReminder: VocabularyReminder;
  /** ISO deadline when the current user is eligible for the welcome
   * discount, null otherwise — see getNewMemberOfferState. */
  newMemberOfferDeadline: string | null;
  /** Current site-wide Live theme id — see site-theme-gallery.tsx. */
  siteThemeId: string;
  children: React.ReactNode;
}) {
  const [searchOpen, setSearchOpen] = React.useState(false);
  const theme = getSiteTheme(siteThemeId);

  return (
    <div className={`min-h-svh ${theme.media === "gradient" ? "bg-background" : ""}`}>
      <SiteThemeBackground themeId={siteThemeId} />
      <AppSidebar profile={profile} />
      <div className="flex min-h-svh flex-col lg:pl-64">
        <TopHeader
          profile={profile}
          vocabularyReminder={vocabularyReminder}
          siteThemeId={siteThemeId}
          onOpenSearch={() => setSearchOpen(true)}
        />
        <main className="flex-1 px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-8">{children}</main>
      </div>
      <MobileBottomNav />
      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
      {newMemberOfferDeadline && <WelcomeOfferModal deadline={newMemberOfferDeadline} />}
      {profile.plan === "FREE" && <UpgradeNudgeModal hasWelcomeOffer={!!newMemberOfferDeadline} />}
    </div>
  );
}
