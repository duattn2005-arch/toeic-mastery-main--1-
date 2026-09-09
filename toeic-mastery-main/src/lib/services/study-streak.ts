import "server-only";
import { db } from "@/lib/db";
import { toDateOnlyUTC } from "@/lib/utils";
import type { Profile } from "@/generated/prisma/client";

/**
 * Marks that the user studied today and rolls the daily streak forward — the
 * same day/consecutive-day accounting the exam-submit route already applies,
 * but callable from any study action (vocabulary review/games, dictionary
 * lookups, grammar lessons), not just finishing a test. Without this, a user
 * who only studies vocabulary/dictionary/grammar for days never advances
 * their streak, even though they were clearly studying.
 *
 * No-ops if today is already recorded, so it's safe to call from every
 * study action without double-counting same-day activity.
 */
export async function touchStudyStreak(profile: Pick<Profile, "id" | "lastStudyDate" | "streakCount" | "longestStreak">) {
  const today = toDateOnlyUTC(new Date());
  const lastStudy = profile.lastStudyDate ? toDateOnlyUTC(new Date(profile.lastStudyDate)) : null;

  if (lastStudy && lastStudy.getTime() === today.getTime()) return;

  const oneDayMs = 86_400_000;
  const isConsecutive = lastStudy !== null && today.getTime() - lastStudy.getTime() === oneDayMs;
  const nextStreak = isConsecutive ? profile.streakCount + 1 : 1;

  await db.profile.update({
    where: { id: profile.id },
    data: {
      lastStudyDate: today,
      streakCount: nextStreak,
      longestStreak: Math.max(profile.longestStreak, nextStreak),
    },
  });
}
