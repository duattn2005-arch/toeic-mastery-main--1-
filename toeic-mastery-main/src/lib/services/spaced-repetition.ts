export type ReviewRating = "AGAIN" | "HARD" | "GOOD" | "EASY";

export interface SrsState {
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
}

export interface SrsResult extends SrsState {
  nextReviewDate: Date;
}

/**
 * Fixed spaced-repetition buckets (replaces the earlier ease-factor-driven
 * SM-2 growth): "Học lại" (AGAIN) resurfaces today, "Khó" (HARD) after 1 day,
 * "Dễ" (GOOD) after 2 days, "Đã thuộc" (EASY) after 4 days — same rule used
 * whether the signal comes from a self-rated flashcard or a derived quiz
 * outcome (see quiz-mode.tsx's wrong-attempt -> rating mapping).
 */
const INTERVAL_DAYS_BY_RATING: Record<ReviewRating, number> = {
  AGAIN: 0,
  HARD: 1,
  GOOD: 2,
  EASY: 4,
};

export function computeNextReview(state: SrsState, rating: ReviewRating, now: Date = new Date()): SrsResult {
  const nextInterval = INTERVAL_DAYS_BY_RATING[rating];
  const nextRepetitions = rating === "AGAIN" ? 0 : state.repetitions + 1;

  const nextReviewDate = new Date(now);
  nextReviewDate.setDate(nextReviewDate.getDate() + nextInterval);

  return {
    repetitions: nextRepetitions,
    intervalDays: nextInterval,
    easeFactor: state.easeFactor,
    nextReviewDate,
  };
}

export function initialSrsState(): SrsState {
  return { repetitions: 0, intervalDays: 0, easeFactor: 2.5 };
}
