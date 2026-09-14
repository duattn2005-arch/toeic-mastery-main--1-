import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthedProfileOrNull } from "@/lib/auth";
import { ScoreCalculator } from "@/lib/services/score-calculator";
import { LISTENING_PARTS } from "@/lib/constants/toeic";
import { MAX_STUDY_SYNC_GAP_SEC } from "@/lib/constants/study";
import { toDateOnlyUTC } from "@/lib/utils";
import { recordAttemptOutcomes } from "@/lib/services/mentor/skill-mastery";
import { flagWeakVocabFromAttempt } from "@/lib/services/mentor/vocab-ledger";
import { generateLearningPath } from "@/lib/services/mentor/learning-path-generator";
import { replanUpcomingDays } from "@/lib/services/mentor/learning-path-replanner";
import type { TestPart } from "@/generated/prisma/enums";

export async function POST(_request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const profile = await getAuthedProfileOrNull();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { attemptId } = await params;

  const attempt = await db.attempt.findUnique({ where: { id: attemptId }, include: { test: true } });
  if (!attempt || attempt.userId !== profile.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (attempt.status !== "IN_PROGRESS") {
    return NextResponse.json({ attemptId }, { status: 200 });
  }

  const [questions, existingAnswers] = await Promise.all([
    // Scoped to attempt.parts (empty = the whole test) — same reasoning as
    // getExamData: a Listening-only/Reading-only/hand-picked-Parts attempt
    // never showed the rest of the test's questions, so scoring against all
    // of them here would count every one of those as "skipped" and wrongly
    // try to compute a full listening+reading score off a partial set.
    db.question.findMany({
      where: { testId: attempt.testId, ...(attempt.parts.length > 0 ? { part: { in: attempt.parts } } : {}) },
      select: { id: true, part: true, correctLabel: true },
    }),
    db.attemptAnswer.findMany({ where: { attemptId }, select: { questionId: true, selectedLabel: true, isFlagged: true } }),
  ]);

  const answerByQuestion = new Map(existingAnswers.map((a) => [a.questionId, a]));

  let correctCount = 0;
  let wrongCount = 0;
  let skippedCount = 0;
  let listeningCorrect = 0;
  let listeningTotal = 0;
  let readingCorrect = 0;
  let readingTotal = 0;

  const isListening = (part: TestPart) => (LISTENING_PARTS as string[]).includes(part);

  const upserts = questions.map((q) => {
    const existing = answerByQuestion.get(q.id);
    const selectedLabel = existing?.selectedLabel ?? null;
    const isCorrect = selectedLabel !== null && selectedLabel === q.correctLabel;

    if (isListening(q.part)) {
      listeningTotal += 1;
      if (isCorrect) listeningCorrect += 1;
    } else {
      readingTotal += 1;
      if (isCorrect) readingCorrect += 1;
    }

    if (selectedLabel === null) skippedCount += 1;
    else if (isCorrect) correctCount += 1;
    else wrongCount += 1;

    return db.attemptAnswer.upsert({
      where: { attemptId_questionId: { attemptId, questionId: q.id } },
      create: { attemptId, questionId: q.id, selectedLabel, isFlagged: existing?.isFlagged ?? false, isCorrect, answeredAt: selectedLabel ? new Date() : null },
      update: { isCorrect },
    });
  });

  // Run outside the transaction below: each upsert is independently
  // idempotent (keyed by attemptId_questionId), and a full test can have
  // 100+ of them — batching that many round-trips inside one Prisma
  // transaction reliably blows the default 5s transaction timeout (P2028),
  // which is what left real attempts stuck IN_PROGRESS forever. Running
  // them concurrently and only wrapping the final status-changing writes
  // in a transaction keeps that transaction to a handful of fast queries.
  await Promise.all(upserts);

  const isFullyScoreable = attempt.test.isFullTest && listeningTotal === 100 && readingTotal === 100;

  let listeningScore: number | null = null;
  let readingScore: number | null = null;
  let totalScore: number | null = null;

  if (isFullyScoreable) {
    const calculator = await ScoreCalculator.load();
    const result = calculator.calculate(listeningCorrect, readingCorrect);
    listeningScore = result.listening;
    readingScore = result.reading;
    totalScore = result.total;
  }

  const today = toDateOnlyUTC(new Date());
  const lastStudy = profile.lastStudyDate ? toDateOnlyUTC(new Date(profile.lastStudyDate)) : null;

  let nextStreak = profile.streakCount;
  if (!lastStudy || lastStudy.getTime() !== today.getTime()) {
    const oneDayMs = 86_400_000;
    const isConsecutive = lastStudy && today.getTime() - lastStudy.getTime() === oneDayMs;
    nextStreak = isConsecutive ? profile.streakCount + 1 : 1;
  }

  // Real wall-clock delta since the last sync checkpoint, same accounting as
  // the periodic sync route — see MAX_STUDY_SYNC_GAP_SEC for why this isn't
  // derived from allowedDurationSec - remainingSec (that's capped and drops
  // any time spent past the nominal duration, e.g. an overrun PRACTICE run).
  const finalGapSec = Math.min(
    Math.max(0, Math.round((Date.now() - attempt.lastSyncedAt.getTime()) / 1000)),
    MAX_STUDY_SYNC_GAP_SEC
  );

  // AI Mentor onboarding (Module 1): this attempt counts as the learner's
  // placement test if they were waiting on one and it produced a real
  // score. Flips them straight to READY — no separate "confirm placement"
  // step — and a personalized LearningPath is generated right after.
  const completesOnboarding = totalScore !== null && profile.onboardingStatus === "PLACEMENT_PENDING" && profile.targetScore !== null;

  await db.$transaction([
    db.attempt.update({
      where: { id: attemptId },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        remainingSec: 0,
        correctCount,
        wrongCount,
        skippedCount,
        listeningScore,
        readingScore,
        totalScore,
      },
    }),
    db.studySession.updateMany({
      where: { attemptId },
      data: { durationSec: { increment: finalGapSec }, endedAt: new Date() },
    }),
    ...(totalScore !== null
      ? [
          db.scoreHistory.create({
            data: { userId: profile.id, attemptId, listeningScore: listeningScore!, readingScore: readingScore!, totalScore },
          }),
        ]
      : []),
    db.profile.update({
      where: { id: profile.id },
      data: {
        lastStudyDate: today,
        streakCount: nextStreak,
        longestStreak: Math.max(profile.longestStreak, nextStreak),
        ...(totalScore !== null ? { currentScore: totalScore } : {}),
        ...(completesOnboarding ? { onboardingStatus: "READY" as const, onboardingCompletedAt: new Date() } : {}),
      },
    }),
  ]);

  // Fire-and-forget: AI Mentor's skill rollup, weak-vocab enrollment, and
  // path upkeep. Must never block or fail the submit response itself.
  // replanUpcomingDays is chained after recordAttemptOutcomes (not run in
  // parallel with it) so it reads SkillMastery only once this attempt's
  // outcomes are actually reflected in it — otherwise it could race ahead
  // on stale data. Skipped when this attempt just completed onboarding:
  // generateLearningPath below already builds upcoming days from the
  // freshest data, so replanning them again immediately is redundant.
  void recordAttemptOutcomes(profile.id, attemptId)
    .then(() => (completesOnboarding ? undefined : replanUpcomingDays(profile.id)))
    .catch((err) => console.error("recordAttemptOutcomes/replanUpcomingDays failed", err));
  void flagWeakVocabFromAttempt(profile.id, attemptId).catch((err) => console.error("flagWeakVocabFromAttempt failed", err));
  if (completesOnboarding) {
    void generateLearningPath({ userId: profile.id, targetScore: profile.targetScore!, examDate: profile.examDate })
      .catch((err) => console.error("generateLearningPath failed", err));
  }

  return NextResponse.json({ attemptId });
}
