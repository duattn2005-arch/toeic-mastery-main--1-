import "server-only";
import { db } from "@/lib/db";
import type { SkillDimensionType, Difficulty } from "@/generated/prisma/enums";

/** Weight on the newest data point — recent attempts move the score faster
 * than old ones, so mastery reflects "how the learner is doing lately", not
 * a flat lifetime average that a good day 3 months ago can no longer move. */
const EWMA_ALPHA = 0.3;

/**
 * Upserts one SkillMastery row. Called once per (user, dimension, outcome) —
 * see recordAttemptOutcomes below for the usual caller. Not exported for
 * direct route use; routes should go through recordAttemptOutcomes or
 * recordMentorTestOutcomes so every write stays attributable to a real
 * scored event.
 */
async function recordSkillOutcome(userId: string, dimensionType: SkillDimensionType, dimensionKey: string, isCorrect: boolean): Promise<void> {
  const existing = await db.skillMastery.findUnique({
    where: { userId_dimensionType_dimensionKey: { userId, dimensionType, dimensionKey } },
    select: { masteryScore: true },
  });

  const outcome = isCorrect ? 1 : 0;
  const nextScore = existing ? existing.masteryScore * (1 - EWMA_ALPHA) + outcome * EWMA_ALPHA : outcome;

  await db.skillMastery.upsert({
    where: { userId_dimensionType_dimensionKey: { userId, dimensionType, dimensionKey } },
    create: {
      userId,
      dimensionType,
      dimensionKey,
      attemptedCount: 1,
      correctCount: isCorrect ? 1 : 0,
      masteryScore: nextScore,
      lastPracticedAt: new Date(),
    },
    update: {
      attemptedCount: { increment: 1 },
      ...(isCorrect ? { correctCount: { increment: 1 } } : {}),
      masteryScore: nextScore,
      lastPracticedAt: new Date(),
    },
  });
}

/**
 * Rolls every scored answer in a submitted Attempt into SkillMastery — one
 * PART outcome and, when the question has one, one GRAMMAR_TOPIC outcome.
 * Fire-and-forget from the attempt submit route; failures here must never
 * fail the attempt submission itself.
 */
export async function recordAttemptOutcomes(userId: string, attemptId: string): Promise<void> {
  const answers = await db.attemptAnswer.findMany({
    where: { attemptId, isCorrect: { not: null } },
    select: { isCorrect: true, question: { select: { part: true, grammarTopicSlug: true } } },
  });

  for (const answer of answers) {
    const isCorrect = answer.isCorrect === true;
    await recordSkillOutcome(userId, "PART", answer.question.part, isCorrect);
    if (answer.question.grammarTopicSlug) {
      await recordSkillOutcome(userId, "GRAMMAR_TOPIC", answer.question.grammarTopicSlug, isCorrect);
    }
  }
}

/** Same as recordAttemptOutcomes but for a completed MentorTest — used to
 * fold "did the learner pass their targeted mini-test" back into the same
 * mastery scores that chose the test's dimension in the first place. */
export async function recordMentorTestOutcomes(userId: string, mentorTestId: string): Promise<void> {
  const questions = await db.mentorTestQuestion.findMany({
    where: { mentorTestId, isCorrect: { not: null } },
    select: { isCorrect: true, question: { select: { part: true, grammarTopicSlug: true } } },
  });

  for (const q of questions) {
    const isCorrect = q.isCorrect === true;
    await recordSkillOutcome(userId, "PART", q.question.part, isCorrect);
    if (q.question.grammarTopicSlug) {
      await recordSkillOutcome(userId, "GRAMMAR_TOPIC", q.question.grammarTopicSlug, isCorrect);
    }
  }
}

export interface WeakDimension {
  dimensionType: SkillDimensionType;
  dimensionKey: string;
  masteryScore: number;
  attemptedCount: number;
}

const MIN_SAMPLE_SIZE = 5;
/** Below this mastery score counts as "weak"/"Hổng" — reused as-is by
 * level-gate.ts's REMEDIATE/RESTART classification so the two features
 * never disagree on what "weak enough to matter" means. */
export const WEAK_THRESHOLD = 0.6;

/** Weakest-first dimensions with a real sample size — the same bar
 * recommendation.ts already uses, kept consistent so the rule-based
 * fallback and the AI-backed mentor never disagree on what counts as
 * "weak enough to matter". Pass `dimensionType` to scope to just PART or
 * just GRAMMAR_TOPIC (e.g. learning-path-generator.ts needs both
 * separately, not one mixed top-N list). */
export async function getWeakestDimensions(userId: string, limit = 5, dimensionType?: SkillDimensionType): Promise<WeakDimension[]> {
  const rows = await db.skillMastery.findMany({
    where: {
      userId,
      attemptedCount: { gte: MIN_SAMPLE_SIZE },
      masteryScore: { lt: WEAK_THRESHOLD },
      ...(dimensionType ? { dimensionType } : {}),
    },
    orderBy: { masteryScore: "asc" },
    take: limit,
    select: { dimensionType: true, dimensionKey: true, masteryScore: true, attemptedCount: true },
  });
  return rows;
}

// ---------------------------------------------------------------------------
// Progressive-difficulty gate (Module 3: "vượt qua test mới mở khóa phần
// khó hơn"). Three fixed tiers — clearing EASY unlocks MEDIUM, clearing
// MEDIUM unlocks HARD. Deliberately simple (no per-part custom ladders) for
// a first version; see docs/ai-mentor-architecture.md.
// ---------------------------------------------------------------------------

const DIFFICULTY_LADDER: Difficulty[] = ["EASY", "MEDIUM", "HARD"];

/** Called after a MentorTest is graded PASSED — records that the learner
 * has cleared `clearedDifficulty` for this dimension. Idempotent. */
export async function unlockNextDifficulty(
  userId: string,
  dimensionType: SkillDimensionType,
  dimensionKey: string,
  clearedDifficulty: Difficulty
): Promise<void> {
  await db.skillUnlock.upsert({
    where: { userId_dimensionType_dimensionKey_difficulty: { userId, dimensionType, dimensionKey, difficulty: clearedDifficulty } },
    create: { userId, dimensionType, dimensionKey, difficulty: clearedDifficulty },
    update: {},
  });
}

/** The hardest difficulty this learner is currently allowed to see for a
 * dimension — EASY until they've cleared it, then MEDIUM, then HARD. */
export async function getUnlockedDifficulty(userId: string, dimensionType: SkillDimensionType, dimensionKey: string): Promise<Difficulty> {
  const cleared = await db.skillUnlock.findMany({
    where: { userId, dimensionType, dimensionKey },
    select: { difficulty: true },
  });
  const clearedSet = new Set(cleared.map((c) => c.difficulty));

  let unlocked: Difficulty = DIFFICULTY_LADDER[0];
  for (const tier of DIFFICULTY_LADDER) {
    unlocked = tier;
    if (!clearedSet.has(tier)) break;
  }
  return unlocked;
}
