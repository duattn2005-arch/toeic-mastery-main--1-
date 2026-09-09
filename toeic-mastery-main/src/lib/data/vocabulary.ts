import "server-only";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { toDateOnlyUTC } from "@/lib/utils";
import type { StudyItem } from "@/lib/services/study-game";

export async function getVocabularyTopics() {
  return db.vocabularyTopic.findMany({
    orderBy: { orderIndex: "asc" },
    include: { _count: { select: { words: true } } },
  });
}

export async function getVocabularyOverview(userId: string) {
  const [topics, learnedCount, dueCount, totalUser] = await Promise.all([
    db.vocabularyTopic.count(),
    db.userVocabulary.count({ where: { userId, isLearned: true } }),
    db.userVocabulary.count({ where: { userId, nextReviewDate: { lte: new Date() } } }),
    db.userVocabulary.count({ where: { userId } }),
  ]);
  return { topicsCount: topics, learnedCount, dueCount, totalTracked: totalUser };
}

export async function getTopicWithWords(slug: string, userId: string) {
  const topic = await db.vocabularyTopic.findUnique({
    where: { slug },
    include: { words: { orderBy: { word: "asc" } } },
  });
  if (!topic) notFound();

  const tracked = await db.userVocabulary.findMany({
    where: { userId, vocabularyWordId: { in: topic.words.map((w) => w.id) } },
    select: { vocabularyWordId: true, isLearned: true },
  });
  const trackedMap = new Map(tracked.map((t) => [t.vocabularyWordId, t.isLearned]));

  return {
    topic,
    words: topic.words.map((w) => ({ ...w, isTracked: trackedMap.has(w.id), isLearned: trackedMap.get(w.id) ?? false })),
  };
}

/** Study/game items for one topic — every word, regardless of tracking
 * state (the flashcard/quiz/matching games are lightweight practice, not
 * the graded SRS review, so they don't require "starting to learn" first).
 * `userId` is optional (generateMetadata calls this without one, just for
 * the topic name) — when given, also returns which of these words are
 * currently in Đã lưu, feeding StudyGameLauncher's "review again" overview. */
export async function getTopicStudyItems(
  slug: string,
  userId?: string
): Promise<{ topicName: string; items: StudyItem[]; starredTerms: string[] }> {
  const topic = await db.vocabularyTopic.findUnique({
    where: { slug },
    include: { words: { orderBy: { word: "asc" } } },
  });
  if (!topic) notFound();

  const starredMatches = userId
    ? await db.savedWord.findMany({
        where: { userId, word: { in: topic.words.map((w) => w.word.toLowerCase()) } },
        select: { word: true },
      })
    : [];

  return {
    topicName: topic.name,
    items: topic.words.map((w) => ({
      id: w.id,
      term: w.word,
      ipa: w.ipa,
      partOfSpeech: w.partOfSpeech,
      meaningVi: w.meaningVi,
      exampleEn: w.exampleEn,
      audioUrl: w.audioUrlUs ?? w.audioUrlUk,
    })),
    starredTerms: starredMatches.map((s) => s.word),
  };
}

export async function getDueReviewQueue(userId: string, limit = 30) {
  return db.userVocabulary.findMany({
    where: { userId, nextReviewDate: { lte: new Date() } },
    include: { vocabularyWord: true },
    orderBy: { nextReviewDate: "asc" },
    take: limit,
  });
}

export interface VocabularyReminder {
  dueTodayCount: number;
  dueTomorrowCount: number;
}

/** Powers both the dashboard reminder card and the notification bell — same
 * `nextReviewDate` (date-only column) that drives /vocabulary/review.
 * Anchored at UTC midnight, not `setHours(0,0,0,0)`: naively zeroing local
 * hours on a `@db.Date` column reads back as the previous calendar day for
 * any positive UTC offset (all of Vietnam), see toDateOnlyUTC(). */
export async function getVocabularyReminder(userId: string): Promise<VocabularyReminder> {
  const todayStart = toDateOnlyUTC(new Date());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);
  const dayAfterStart = new Date(todayStart);
  dayAfterStart.setUTCDate(dayAfterStart.getUTCDate() + 2);

  const [dueTodayCount, dueTomorrowCount] = await Promise.all([
    db.userVocabulary.count({ where: { userId, nextReviewDate: { lt: tomorrowStart } } }),
    db.userVocabulary.count({ where: { userId, nextReviewDate: { gte: tomorrowStart, lt: dayAfterStart } } }),
  ]);

  return { dueTodayCount, dueTomorrowCount };
}
