import "server-only";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getOverallStats } from "@/lib/data/skill-stats";
import { computeXp, getXpProgress } from "@/lib/services/xp";
import type { StudyItem } from "@/lib/services/study-game";

const PATH_SLUG = "toeic-20-day";
const STEPS_PER_DAY = 3;

export interface PathDaySummary {
  dayNumber: number;
  tierLabel: string;
  wordCount: number;
  topicNames: string[];
  stepsCompleted: number;
  stars: number;
  isCompleted: boolean;
  isUnlocked: boolean;
}

/** Everything the /vocabulary/path overview page needs in one call: the
 * day list (with per-day lock/progress state derived from sequential
 * completion) grouped by tier, which day is "today"'s target, and the same
 * XP/rank the dashboard shows — this path doesn't have its own separate XP
 * pool, it's just another view onto the account's real XP. */
export async function getVocabularyPathOverview(userId: string) {
  const path = await db.vocabularyPath.findUnique({
    where: { slug: PATH_SLUG },
    include: {
      days: {
        orderBy: { dayNumber: "asc" },
        include: {
          words: { include: { word: { select: { topicId: true, topic: { select: { name: true } } } } } },
          progress: { where: { userId } },
        },
      },
    },
  });
  if (!path) notFound();

  let previousCompleted = true;
  const days: PathDaySummary[] = path.days.map((day) => {
    const progress = day.progress[0];
    const stepsCompleted = progress?.stepsCompleted ?? 0;
    const isCompleted = stepsCompleted >= STEPS_PER_DAY;
    const isUnlocked = previousCompleted;
    previousCompleted = isCompleted;

    const topicNames = [...new Set(day.words.map((w) => w.word.topic.name))];

    return {
      dayNumber: day.dayNumber,
      tierLabel: day.tierLabel,
      wordCount: day.words.length,
      topicNames,
      stepsCompleted,
      stars: progress?.stars ?? 0,
      isCompleted,
      isUnlocked,
    };
  });

  const totalWords = days.reduce((sum, d) => sum + d.wordCount, 0);
  const daysCompleted = days.filter((d) => d.isCompleted).length;
  const currentDay = days.find((d) => d.isUnlocked && !d.isCompleted) ?? days[days.length - 1];

  const [profile, overallStats] = await Promise.all([
    db.profile.findUniqueOrThrow({ where: { id: userId }, select: { streakCount: true } }),
    getOverallStats(userId),
  ]);
  const xp = computeXp(overallStats, profile.streakCount);
  const xpProgress = getXpProgress(xp);

  const tiers = new Map<string, PathDaySummary[]>();
  for (const day of days) {
    const bucket = tiers.get(day.tierLabel);
    if (bucket) bucket.push(day);
    else tiers.set(day.tierLabel, [day]);
  }

  return {
    title: path.title,
    description: path.description,
    totalDays: days.length,
    totalWords,
    daysCompleted,
    currentDay,
    tiers: [...tiers.entries()].map(([label, dayList]) => ({ label, days: dayList })),
    xpProgress,
  };
}

export interface PathDayDetail {
  dayId: string;
  dayNumber: number;
  tierLabel: string;
  totalDays: number;
  isUnlocked: boolean;
  stepsCompleted: number;
  stars: number;
  items: StudyItem[];
  /** Lowercased terms among this day's words currently in Đã lưu (i.e.
   * rated "chưa nhớ"/wrong somewhere) — drives the "Ôn từ sai" option on
   * the day-complete screen. */
  starredTerms: string[];
}

/** A single day's detail for the runner page — 404s for an out-of-range day
 * number rather than exposing an empty/locked shell.
 *
 * Runs its independent lookups via Promise.all instead of one big
 * `path -> all 20 days + progress -> day's words -> starred words` chain:
 * that used to be 3 fully sequential round trips (the first fetching every
 * day's progress row just to read one boolean), which is exactly the kind
 * of thing that turns "a bit slow" into "several seconds" once each round
 * trip alone costs real latency (as it does from this dev machine to the
 * remote Supabase instance). */
export async function getPathDayDetail(dayNumber: number, userId: string): Promise<PathDayDetail> {
  const path = await db.vocabularyPath.findUnique({ where: { slug: PATH_SLUG }, select: { id: true } });
  if (!path) notFound();

  const [currentDay, totalDays, previousDayProgress, currentDayProgress] = await Promise.all([
    db.vocabularyPathDay.findUnique({
      where: { pathId_dayNumber: { pathId: path.id, dayNumber } },
      include: { words: { orderBy: { orderIndex: "asc" }, include: { word: true } } },
    }),
    db.vocabularyPathDay.count({ where: { pathId: path.id } }),
    dayNumber > 1
      ? db.userVocabularyPathDayProgress.findFirst({
          where: { userId, day: { pathId: path.id, dayNumber: dayNumber - 1 } },
          select: { stepsCompleted: true },
        })
      : Promise.resolve(null),
    db.userVocabularyPathDayProgress.findFirst({
      where: { userId, day: { pathId: path.id, dayNumber } },
      select: { stepsCompleted: true, stars: true },
    }),
  ]);
  if (!currentDay) notFound();

  const isUnlocked = dayNumber === 1 || (previousDayProgress?.stepsCompleted ?? 0) >= STEPS_PER_DAY;

  const dayWordTerms = currentDay.words.map((w) => w.word.word.toLowerCase());
  const starredMatches = await db.savedWord.findMany({
    where: { userId, word: { in: dayWordTerms } },
    select: { word: true },
  });

  return {
    dayId: currentDay.id,
    dayNumber,
    tierLabel: currentDay.tierLabel,
    totalDays,
    isUnlocked,
    stepsCompleted: currentDayProgress?.stepsCompleted ?? 0,
    stars: currentDayProgress?.stars ?? 0,
    items: currentDay.words.map((w) => ({
      id: w.word.id,
      term: w.word.word,
      ipa: w.word.ipa,
      partOfSpeech: w.word.partOfSpeech,
      meaningVi: w.word.meaningVi,
      exampleEn: w.word.exampleEn,
      audioUrl: w.word.audioUrlUs ?? w.word.audioUrlUk,
    })),
    starredTerms: starredMatches.map((s) => s.word),
  };
}
