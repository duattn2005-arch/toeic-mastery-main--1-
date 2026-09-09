import "server-only";
import { db } from "@/lib/db";
import { TEST_PARTS } from "@/lib/constants/toeic";
import type { TestPart } from "@/generated/prisma/enums";
import type { PartAccuracy } from "@/lib/services/recommendation";

/** Per-part accuracy across every submitted attempt, used by the dashboard
 * radar chart, /analytics, and the rule-based recommendation engine. */
export async function getPartAccuracies(userId: string): Promise<PartAccuracy[]> {
  const answers = await db.attemptAnswer.findMany({
    where: {
      attempt: { userId, status: "SUBMITTED" },
      isCorrect: { not: null },
    },
    select: { isCorrect: true, question: { select: { part: true } } },
  });

  const buckets = new Map<TestPart, { correct: number; total: number }>();
  for (const part of TEST_PARTS) buckets.set(part, { correct: 0, total: 0 });

  for (const answer of answers) {
    const bucket = buckets.get(answer.question.part)!;
    bucket.total += 1;
    if (answer.isCorrect) bucket.correct += 1;
  }

  return TEST_PARTS.map((part) => {
    const bucket = buckets.get(part)!;
    return {
      part,
      accuracy: bucket.total > 0 ? bucket.correct / bucket.total : 0,
      attempted: bucket.total,
    };
  });
}

export interface OverallStats {
  attemptsCompleted: number;
  questionsAnswered: number;
  correctCount: number;
  accuracy: number;
  totalStudySeconds: number;
  vocabularyLearned: number;
}

export async function getOverallStats(userId: string): Promise<OverallStats> {
  const [attemptAgg, vocabLearned, sessionAgg] = await Promise.all([
    db.attempt.aggregate({
      where: { userId, status: "SUBMITTED" },
      _count: { _all: true },
      _sum: { correctCount: true, wrongCount: true, skippedCount: true },
    }),
    // Counts words with at least one graded review (repetitions >= 1), not
    // strict SM-2 mastery (isLearned, repetitions >= 3) — that bar is high
    // enough that a single flashcard/quiz/matching session or review pass
    // never visibly moves this stat, which read as "broken" even though the
    // underlying review was recorded correctly.
    db.userVocabulary.count({ where: { userId, repetitions: { gte: 1 } } }),
    db.studySession.aggregate({ where: { userId }, _sum: { durationSec: true } }),
  ]);

  const correct = attemptAgg._sum.correctCount ?? 0;
  const wrong = attemptAgg._sum.wrongCount ?? 0;
  const skipped = attemptAgg._sum.skippedCount ?? 0;
  const answered = correct + wrong;
  const total = answered + skipped;

  return {
    attemptsCompleted: attemptAgg._count._all,
    questionsAnswered: total,
    correctCount: correct,
    accuracy: answered > 0 ? correct / answered : 0,
    totalStudySeconds: sessionAgg._sum.durationSec ?? 0,
    vocabularyLearned: vocabLearned,
  };
}
