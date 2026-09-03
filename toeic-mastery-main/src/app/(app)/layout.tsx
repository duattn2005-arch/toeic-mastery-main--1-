import { requireUser } from "@/lib/auth";
import { getVocabularyReminder } from "@/lib/data/vocabulary";
import { getNewMemberOfferState } from "@/lib/services/new-member-offer";
import { getSiteThemeId } from "@/lib/data/site-theme";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireUser();
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
