"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser, isPro } from "@/lib/auth";

/** Free-tier daily caps ("Mini Test: Giới hạn" / "Full Mock Test: Giới hạn"
 * in the pricing table) — Pro is unlimited. Counts today's Attempt rows
 * rather than a separate counter table. */
const FREE_FULL_TESTS_PER_DAY = 1;
const FREE_MINI_TESTS_PER_DAY = 3;

export async function startAttemptAction(testId: string, mode: "PRACTICE" | "EXAM" = "EXAM") {
  const profile = await requireUser();

  const existing = await db.attempt.findFirst({
    where: { userId: profile.id, testId, status: "IN_PROGRESS" },
  });
  if (existing) redirect(`/exam/${existing.id}`);

  const test = await db.test.findUniqueOrThrow({ where: { id: testId } });

  if (!isPro(profile)) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const attemptsToday = await db.attempt.count({
      where: {
        userId: profile.id,
        createdAt: { gte: startOfToday },
        test: { isFullTest: test.isFullTest },
      },
    });
    const cap = test.isFullTest ? FREE_FULL_TESTS_PER_DAY : FREE_MINI_TESTS_PER_DAY;
    if (attemptsToday >= cap) {
      redirect(`/practice/${testId}?limitReached=1`);
    }
  }

  const attempt = await db.attempt.create({
    data: {
      userId: profile.id,
      testId,
      mode,
      allowedDurationSec: test.durationMinutes * 60,
      remainingSec: test.durationMinutes * 60,
    },
  });

  await db.studySession.create({
    data: {
      userId: profile.id,
      activityType: mode === "EXAM" ? "EXAM" : "PRACTICE",
      attemptId: attempt.id,
      metadata: { testId },
    },
  });

  redirect(`/exam/${attempt.id}`);
}
