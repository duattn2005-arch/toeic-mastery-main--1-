"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser, isPro } from "@/lib/auth";
import { touchStudyStreak } from "@/lib/services/study-streak";
import { buildQuickStudySession, type QuickStudyItem } from "@/lib/data/quick-study";

export interface ActionResult {
  error?: string;
}

const FREE_QUICK_STUDY_MINUTES = 7;
const MIN_PRO_QUICK_STUDY_MINUTES = 5;
const MAX_PRO_QUICK_STUDY_MINUTES = 60;

/** Free is pinned at 7 minutes regardless of what the client sends — the
 * slider on the setup screen is disabled for Free, but the real limit has
 * to be enforced here too, not just hidden in the UI. */
export async function startQuickStudySessionAction(
  requestedMinutes: number
): Promise<{ items: QuickStudyItem[]; durationSec: number } | { error: string }> {
  const profile = await requireUser();
  const pro = isPro(profile);

  const minutes = pro ? Math.min(MAX_PRO_QUICK_STUDY_MINUTES, Math.max(MIN_PRO_QUICK_STUDY_MINUTES, Math.round(requestedMinutes))) : FREE_QUICK_STUDY_MINUTES;

  const items = await buildQuickStudySession(profile.id, minutes);
  return { items, durationSec: minutes * 60 };
}

/** Logs the session's elapsed time toward "Tổng giờ học" — same pattern as
 * logStudySessionAction for vocabulary games, just tagged PRACTICE since a
 * quick-study session mixes questions and vocabulary rather than being
 * vocab-only. */
export async function completeQuickStudySessionAction(durationSec: number): Promise<ActionResult> {
  const profile = await requireUser();
  if (durationSec <= 0) return {};

  await db.studySession.create({
    data: { userId: profile.id, activityType: "PRACTICE", durationSec, endedAt: new Date() },
  });
  await touchStudyStreak(profile);

  revalidatePath("/dashboard");
  return {};
}
