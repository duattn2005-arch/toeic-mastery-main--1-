"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser, isPro } from "@/lib/auth";
import { TEST_PART_VALUES } from "@/lib/validations/admin";
import type { TestPart } from "@/generated/prisma/enums";

/** Free-tier daily caps ("Mini Test: Giới hạn" / "Full Mock Test: Giới hạn"
 * in the pricing table) — Pro is unlimited. Counts today's Attempt rows
 * rather than a separate counter table. */
const FREE_FULL_TESTS_PER_DAY = 1;
const FREE_MINI_TESTS_PER_DAY = 3;
/** Separate cap on starting Practice mode ("Luyện tập — xem đáp án ngay")
 * itself, independent of the Exam-mode full/mini caps above — a Free
 * account can still spend its exam attempts even after using up today's
 * practice-mode starts, and vice versa. */
const FREE_PRACTICE_STARTS_PER_DAY = 2;

/** Sorted (TEST_PART_VALUES order) + deduped, so two selections of the same
 * parts in a different click order still compare equal via Prisma's array
 * `equals` filter in the "resume this exact in-progress attempt" lookup
 * below, and so it renders in a stable order anywhere it's displayed. */
function normalizeParts(parts: TestPart[]): TestPart[] {
  const unique = Array.from(new Set(parts));
  return TEST_PART_VALUES.filter((p) => unique.includes(p));
}

export async function startAttemptAction(testId: string, mode: "PRACTICE" | "EXAM" = "EXAM", parts: TestPart[] = []) {
  const profile = await requireUser();
  const normalizedParts = normalizeParts(parts);

  const existing = await db.attempt.findFirst({
    where: { userId: profile.id, testId, status: "IN_PROGRESS", parts: { equals: normalizedParts } },
  });
  if (existing) redirect(`/exam/${existing.id}`);

  const test = await db.test.findUniqueOrThrow({ where: { id: testId } });

  // A Part-scoped attempt (Listening-only, Reading-only, or a hand-picked
  // set — see attempt-start-panel.tsx) covers less ground than "the whole
  // test", so its time budget is prorated by question count rather than
  // reusing the full test's duration outright.
  const totalQuestions = await db.question.count({ where: { testId } });
  const selectedQuestions =
    normalizedParts.length > 0 ? await db.question.count({ where: { testId, part: { in: normalizedParts } } }) : totalQuestions;
  const allowedDurationSec =
    normalizedParts.length > 0 && totalQuestions > 0
      ? Math.max(60, Math.round((test.durationMinutes * 60 * selectedQuestions) / totalQuestions))
      : test.durationMinutes * 60;

  if (!isPro(profile)) {
    // Re-checked here, not just hidden in the UI — a Free account could
    // otherwise submit this form directly against a Pro-only test.
    if (test.isPro) redirect(`/practice/${testId}?proRequired=1`);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    if (mode === "PRACTICE") {
      const practiceStartsToday = await db.attempt.count({
        where: { userId: profile.id, mode: "PRACTICE", createdAt: { gte: startOfToday } },
      });
      if (practiceStartsToday >= FREE_PRACTICE_STARTS_PER_DAY) {
        redirect(`/practice/${testId}?practiceLimitReached=1`);
      }
    } else {
      // A Part-scoped attempt always counts against the (more generous)
      // Mini cap, regardless of the underlying test's own isFullTest flag —
      // it takes a fraction of a full run's time/effort, same as any other
      // Mini test.
      const countsAsFullTest = normalizedParts.length === 0 && test.isFullTest;
      const attemptsToday = await db.attempt.count({
        where: {
          userId: profile.id,
          createdAt: { gte: startOfToday },
          ...(countsAsFullTest
            ? { parts: { isEmpty: true }, test: { isFullTest: true } }
            : { OR: [{ parts: { isEmpty: false } }, { test: { isFullTest: false } }] }),
        },
      });
      const cap = countsAsFullTest ? FREE_FULL_TESTS_PER_DAY : FREE_MINI_TESTS_PER_DAY;
      if (attemptsToday >= cap) {
        redirect(`/practice/${testId}?limitReached=1`);
      }
    }
  }

  const attempt = await db.attempt.create({
    data: {
      userId: profile.id,
      testId,
      mode,
      parts: normalizedParts,
      allowedDurationSec,
      remainingSec: allowedDurationSec,
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

/**
 * "Luyện tập lại câu sai" on an attempt's result page — starts a brand new
 * PRACTICE attempt scoped to just the questions the original attempt got
 * wrong or skipped (an AttemptAnswer's `isCorrect` is false for both, see
 * getAttemptResult), reusing the exact same real exam-taking UI
 * (exam-runner.tsx) as any other attempt rather than some separate mini
 * drill screen. No testId+parts combination can express "these specific
 * questions scattered across the test" — that's what Attempt.questionIds
 * is for (see its own doc comment on the schema).
 */
export async function startMistakeRetryAction(originalAttemptId: string) {
  const profile = await requireUser();

  const original = await db.attempt.findUnique({ where: { id: originalAttemptId } });
  if (!original || original.userId !== profile.id) redirect("/history");

  const [scopedQuestions, answers] = await Promise.all([
    db.question.findMany({
      where:
        original.questionIds.length > 0
          ? { id: { in: original.questionIds } }
          : { testId: original.testId, ...(original.parts.length > 0 ? { part: { in: original.parts } } : {}) },
      select: { id: true },
    }),
    db.attemptAnswer.findMany({ where: { attemptId: originalAttemptId }, select: { questionId: true, isCorrect: true } }),
  ]);
  const isCorrectByQuestion = new Map(answers.map((a) => [a.questionId, a.isCorrect]));
  const mistakeIds = scopedQuestions.map((q) => q.id).filter((id) => isCorrectByQuestion.get(id) !== true);

  if (mistakeIds.length === 0) redirect(`/history/${originalAttemptId}`);

  if (!isPro(profile)) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const practiceStartsToday = await db.attempt.count({
      where: { userId: profile.id, mode: "PRACTICE", createdAt: { gte: startOfToday } },
    });
    if (practiceStartsToday >= FREE_PRACTICE_STARTS_PER_DAY) {
      redirect(`/history/${originalAttemptId}?practiceLimitReached=1`);
    }
  }

  // Prorated the same way a Part-scoped attempt's duration is — a retry
  // covering a fraction of the original attempt's questions gets that same
  // fraction of its time budget, floored at 1 minute.
  const allowedDurationSec = Math.max(
    60,
    Math.round((original.allowedDurationSec * mistakeIds.length) / Math.max(1, scopedQuestions.length))
  );

  const attempt = await db.attempt.create({
    data: {
      userId: profile.id,
      testId: original.testId,
      mode: "PRACTICE",
      parts: [],
      questionIds: mistakeIds,
      allowedDurationSec,
      remainingSec: allowedDurationSec,
    },
  });

  await db.studySession.create({
    data: {
      userId: profile.id,
      activityType: "PRACTICE",
      attemptId: attempt.id,
      metadata: { testId: original.testId, retryOfAttemptId: originalAttemptId },
    },
  });

  redirect(`/exam/${attempt.id}`);
}
