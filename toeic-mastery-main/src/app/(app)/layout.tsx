import { getCurrentProfile } from "@/lib/auth";
import { getVocabularyReminder } from "@/lib/data/vocabulary";
import { getNewMemberOfferState } from "@/lib/services/new-member-offer";
import { getSiteThemeId } from "@/lib/data/site-theme";
import { AppShell } from "@/components/layout/app-shell";
import { PublicAppShell } from "@/components/layout/public-app-shell";

/**
 * Every route here still requires login by default — pages enforce that
 * themselves via requireUser() (see src/lib/auth.ts), same as before. The
 * only thing that changed is this layout no longer redirects up front,
 * because a couple of routes (currently just /practice) now opt into a
 * public preview: a logged-out visitor sees the real page shell with a
 * "log in to continue" prompt in place of gated content, instead of being
 * bounced straight to /login. Every other page's own requireUser() call
 * still redirects exactly as before.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) {
    return <PublicAppShell>{children}</PublicAppShell>;
  }

  const [vocabularyReminder, newMemberOffer, siteThemeId] = await Promise.all([
    getVocabularyReminder(profile.id),
    getNewMemberOfferState(profile),
    getSiteThemeId(profile.id),
  ]);

  return (
    <AppShell
      profile={{
        fullName: profile.fullName,
        email: profile.email,
        avatarUrl: profile.avatarUrl,
        equippedShopItemId: profile.equippedShopItemId,
        role: profile.role,
        streakCount: profile.streakCount,
        targetScore: profile.targetScore,
        currentScore: profile.currentScore,
        plan: profile.plan,
        proExpiresAt: profile.proExpiresAt,
      }}
      vocabularyReminder={vocabularyReminder}
      newMemberOfferDeadline={newMemberOffer.deadline}
      siteThemeId={siteThemeId}
    >
      {children}
    </AppShell>
  );
}
