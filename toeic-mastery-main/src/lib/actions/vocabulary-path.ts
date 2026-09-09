"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentProfile } from "@/lib/auth";

export interface ActionResult {
  error?: string;
}

const STEPS_PER_DAY = 3;

/** Advances a path day's progress after one of its 3 steps (Học/Luyện
 * tập/Kiểm tra) finishes. Idempotent against replays — steps only ever move
 * forward (`Math.max`), so redoing an earlier step after finishing later
 * ones can't un-complete the day. Stars (0-3) are set only by step 3 (the
 * quiz), scored from its accuracy. */
export async function completePathStepAction(
  dayId: string,
  step: 1 | 2 | 3,
  quizResult?: { correct: number; total: number }
): Promise<ActionResult & { stepsCompleted?: number; stars?: number }> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Vui lòng đăng nhập" };

  const existing = await db.userVocabularyPathDayProgress.findUnique({
    where: { userId_dayId: { userId: profile.id, dayId } },
  });

  const stepsCompleted = Math.max(existing?.stepsCompleted ?? 0, step);

  let stars = existing?.stars ?? 0;
  if (step === 3 && quizResult && quizResult.total > 0) {
    const percent = (quizResult.correct / quizResult.total) * 100;
    stars = percent >= 90 ? 3 : percent >= 60 ? 2 : 1;
  }

  const completedAt = stepsCompleted >= STEPS_PER_DAY ? (existing?.completedAt ?? new Date()) : null;

  await db.userVocabularyPathDayProgress.upsert({
    where: { userId_dayId: { userId: profile.id, dayId } },
    create: { userId: profile.id, dayId, stepsCompleted, stars, completedAt },
    update: { stepsCompleted, stars, completedAt },
  });

  revalidatePath("/vocabulary");
  return { stepsCompleted, stars };
}
