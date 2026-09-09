"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentProfile } from "@/lib/auth";
import { touchStudyStreak } from "@/lib/services/study-streak";

export interface ActionResult {
  error?: string;
}

/** A background tab left open on a grammar lesson shouldn't inflate "Tổng
 * giờ học" — cap what a single page visit can credit. */
const MAX_GRAMMAR_SESSION_CREDIT_SEC = 1800;

/** Logs time spent reading a grammar lesson (theory + practice quiz) so it
 * counts toward "Tổng giờ học", same as exam/practice/vocabulary time. Called
 * once when the topic page unmounts (navigated away from). */
export async function logGrammarStudySessionAction(durationSec: number): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Vui lòng đăng nhập" };
  if (durationSec <= 0) return {};

  await db.studySession.create({
    data: {
      userId: profile.id,
      activityType: "GRAMMAR",
      durationSec: Math.min(durationSec, MAX_GRAMMAR_SESSION_CREDIT_SEC),
      endedAt: new Date(),
    },
  });
  await touchStudyStreak(profile);

  revalidatePath("/dashboard");
  return {};
}
