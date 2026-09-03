import type { OverallStats } from "@/lib/data/skill-stats";

export interface XpLevel {
  name: string;
  minXp: number;
}

/** TOEIC-flavored progression tiers. Thresholds are tuned so an active
 * learner reaches Scholar within their first few weeks. */
export const XP_LEVELS: XpLevel[] = [
  { name: "Rookie", minXp: 0 },
  { name: "Scholar", minXp: 500 },
  { name: "Achiever", minXp: 1500 },
  { name: "Expert", minXp: 3500 },
  { name: "Master", minXp: 7000 },
];

/** Per-unit XP weights — shared source of truth for both the aggregate
 * lifetime total (computeXp) and any per-action award (e.g. "+N XP" shown
 * right after submitting one specific test). */
export const XP_WEIGHTS = {
  perCorrectAnswer: 3,
  perCompletedAttempt: 25,
  perVocabularyLearned: 4,
  perStreakDay: 5,
  perStudyMinute: 1,
} as const;

/** XP earned from one specific submitted attempt — correct answers plus the
 * flat completion bonus, using the same weights as the lifetime total. */
export function computeAttemptXp(correctCount: number): number {
  return correctCount * XP_WEIGHTS.perCorrectAnswer + XP_WEIGHTS.perCompletedAttempt;
}

export interface XpProgress {
  xp: number;
  level: XpLevel;
  nextLevel: XpLevel | null;
  /** 0-100, progress toward nextLevel (100 if already at the top tier). */
  percentToNext: number;
  xpToNext: number | null;
}

/**
 * Derived XP — not a stored field. Computed from stats the app already
 * tracks (correct answers, completed tests, vocabulary learned, streak,
 * study time), so leveling up reflects real study activity with no new
 * database writes or admin surface to maintain.
 */
export function computeXp(stats: OverallStats, streakCount: number): number {
  return (
    stats.correctCount * XP_WEIGHTS.perCorrectAnswer +
    stats.attemptsCompleted * XP_WEIGHTS.perCompletedAttempt +
    stats.vocabularyLearned * XP_WEIGHTS.perVocabularyLearned +
    streakCount * XP_WEIGHTS.perStreakDay +
    Math.floor(stats.totalStudySeconds / 60) * XP_WEIGHTS.perStudyMinute
  );
}

export function getXpProgress(xp: number): XpProgress {
  let level = XP_LEVELS[0];
  let nextLevel: XpLevel | null = null;
  for (let i = 0; i < XP_LEVELS.length; i++) {
    if (xp >= XP_LEVELS[i].minXp) {
      level = XP_LEVELS[i];
      nextLevel = XP_LEVELS[i + 1] ?? null;
    }
  }

  if (!nextLevel) {
    return { xp, level, nextLevel: null, percentToNext: 100, xpToNext: null };
  }

  const span = nextLevel.minXp - level.minXp;
  const progressed = xp - level.minXp;
  return {
    xp,
    level,
    nextLevel,
    percentToNext: Math.min(100, Math.round((progressed / span) * 100)),
    xpToNext: nextLevel.minXp - xp,
  };
}
