"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentProfile } from "@/lib/auth";
import { computeNextReview, type ReviewRating } from "@/lib/services/spaced-repetition";
import { touchStudyStreak } from "@/lib/services/study-streak";

export interface ActionResult {
  error?: string;
}

const LEARNED_AT_REPETITIONS = 3;

export async function startLearningWordsAction(vocabularyWordIds: string[]): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Vui lòng đăng nhập" };

  // Outside a $transaction — each word is an independent upsert, and topics
  // with many words (band-tier topics run up to 18) risk the default 5s
  // interactive-transaction timeout (P2028) over a slower connection; same
  // fix already applied elsewhere for the same reason.
  await Promise.all(
    vocabularyWordIds.map((vocabularyWordId) =>
      db.userVocabulary.upsert({
        where: { userId_vocabularyWordId: { userId: profile.id, vocabularyWordId } },
        create: { userId: profile.id, vocabularyWordId, nextReviewDate: new Date() },
        update: {},
      })
    )
  );

  revalidatePath("/vocabulary");
  return {};
}

/** Shared by the graded review flow and the flashcard/quiz/matching games —
 * one SRS update, one place. `existing` must already belong to `profile`. */
async function applyReview(
  existing: { id: string; repetitions: number; intervalDays: number; easeFactor: number },
  rating: ReviewRating
) {
  const result = computeNextReview(
    { repetitions: existing.repetitions, intervalDays: existing.intervalDays, easeFactor: existing.easeFactor },
    rating
  );

  await db.$transaction([
    db.userVocabulary.update({
      where: { id: existing.id },
      data: {
        repetitions: result.repetitions,
        intervalDays: result.intervalDays,
        easeFactor: result.easeFactor,
        nextReviewDate: result.nextReviewDate,
        lastReviewedAt: new Date(),
        isLearned: result.repetitions >= LEARNED_AT_REPETITIONS,
      },
    }),
    db.vocabularyReview.create({
      data: {
        userVocabularyId: existing.id,
        rating,
        previousInterval: existing.intervalDays,
        newInterval: result.intervalDays,
        previousEase: existing.easeFactor,
        newEase: result.easeFactor,
      },
    }),
  ]);
}

export async function reviewVocabularyAction(userVocabularyId: string, rating: ReviewRating): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Vui lòng đăng nhập" };

  const current = await db.userVocabulary.findUnique({ where: { id: userVocabularyId } });
  if (!current || current.userId !== profile.id) return { error: "Không tìm thấy từ vựng" };

  await applyReview(current, rating);

  revalidatePath("/vocabulary/review");
  revalidatePath("/dashboard");
  return {};
}

/**
 * Same SRS update as the graded review, but keyed by `vocabularyWordId` (what
 * the study-game components actually know about a word) and auto-starts
 * tracking if this is the first time the word's been practiced anywhere —
 * so playing a game with a not-yet-tracked word still counts, exactly like
 * `startLearningWordsAction` + a review would. This is what makes "Từ vựng
 * đã học" (and the XP derived from it) move when playing games, not just
 * when using the dedicated /vocabulary/review flow.
 */
export async function practiceVocabularyWordAction(vocabularyWordId: string, rating: ReviewRating): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Vui lòng đăng nhập" };

  const existing = await db.userVocabulary.upsert({
    where: { userId_vocabularyWordId: { userId: profile.id, vocabularyWordId } },
    create: { userId: profile.id, vocabularyWordId, nextReviewDate: new Date() },
    update: {},
  });

  await applyReview(existing, rating);

  revalidatePath("/dashboard");
  return {};
}

/** Logs time spent in a flashcard/quiz/matching game or graded review
 * session so it counts toward "Tổng giờ học" and the activity heatmap, same
 * as exam/practice time. Called once when a session ends (not incrementally
 * — these sessions are short, so there's no mid-session sync to keep current). */
export async function logStudySessionAction(durationSec: number): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Vui lòng đăng nhập" };
  if (durationSec <= 0) return {};

  await db.studySession.create({
    data: { userId: profile.id, activityType: "VOCABULARY", durationSec, endedAt: new Date() },
  });
  await touchStudyStreak(profile);

  revalidatePath("/dashboard");
  return {};
}
