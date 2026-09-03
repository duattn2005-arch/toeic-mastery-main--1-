import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { SettingsForm } from "@/components/settings/settings-form";

export const metadata: Metadata = { title: "Cài đặt" };

export default async function SettingsPage() {
  const profile = await requireUser();
  const settings = await db.userSettings.findUnique({ where: { userId: profile.id } });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cài đặt</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tùy chỉnh trải nghiệm học tập của bạn.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card px-6 shadow-soft">
        <SettingsForm
          initial={{
            theme: settings?.theme ?? "LIGHT",
            language: (settings?.language as "vi" | "en") ?? "vi",
            audioAutoplay: settings?.audioAutoplay ?? true,
            defaultPlaybackSpeed: settings?.defaultPlaybackSpeed ?? 1,
            dictionaryPopupEnabled: settings?.dictionaryPopupEnabled ?? true,
            dailyReminderEnabled: settings?.dailyReminderEnabled ?? false,
            dailyReminderTime: settings?.dailyReminderTime ?? "20:00",
          }}
        />
      </div>
    </div>
  );
}
