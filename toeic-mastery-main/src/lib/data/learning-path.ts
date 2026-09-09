import "server-only";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import type { TestPart, LearningDayStatus, LearningItemType, LearningItemStatus } from "@/generated/prisma/enums";

export interface LearningPathDaySummary {
  dayId: string;
  dayNumber: number;
  scheduledDate: string;
  focusParts: TestPart[];
  status: LearningDayStatus;
  itemsDone: number;
  itemsTotal: number;
}

export interface LearningPathOverview {
  pathId: string;
  targetScore: number;
  examDate: string | null;
  rationale: string | null;
  totalDays: number;
  daysCompleted: number;
  currentDay: LearningPathDaySummary | null;
  weeks: { label: string; days: LearningPathDaySummary[] }[];
}

/** The learner's current ACTIVE path (see docs/ai-mentor-architecture.md
 * §7 for how upcoming days keep getting re-planned) — null when onboarding
 * hasn't produced one yet. Days are chunked into 7-day "weeks" purely for
 * display; that has no bearing on the underlying schedule. */
export async function getLearningPathOverview(userId: string): Promise<LearningPathOverview | null> {
  const path = await db.learningPath.findFirst({
    where: { userId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    include: {
      days: {
        orderBy: { dayNumber: "asc" },
        include: { items: { select: { status: true } } },
      },
    },
  });
  if (!path) return null;

  const days: LearningPathDaySummary[] = path.days.map((day) => ({
    dayId: day.id,
    dayNumber: day.dayNumber,
    scheduledDate: day.scheduledDate.toISOString().slice(0, 10),
    focusParts: day.focusParts,
    status: day.status,
    itemsDone: day.items.filter((i) => i.status === "DONE").length,
    itemsTotal: day.items.length,
  }));

  const daysCompleted = days.filter((d) => d.status === "COMPLETED").length;
  const currentDay = days.find((d) => d.status === "UNLOCKED" || d.status === "IN_PROGRESS") ?? null;

  const weeks: { label: string; days: LearningPathDaySummary[] }[] = [];
  for (let i = 0; i < days.length; i += 7) {
    const chunk = days.slice(i, i + 7);
    weeks.push({
      label: `Tuần ${Math.floor(i / 7) + 1} · Ngày ${chunk[0].dayNumber}-${chunk[chunk.length - 1].dayNumber}`,
      days: chunk,
    });
  }

  return {
    pathId: path.id,
    targetScore: path.targetScore,
    examDate: path.examDate ? path.examDate.toISOString().slice(0, 10) : null,
    rationale: path.rationale,
    totalDays: days.length,
    daysCompleted,
    currentDay,
    weeks,
  };
}

export interface LearningPathItemDetail {
  id: string;
  itemType: LearningItemType;
  status: LearningItemStatus;
  orderIndex: number;
  /** Human title override for this specific item, when the generator
   * picked one specific piece of content (currently only GRAMMAR_LESSON,
   * via refId — see learning-path-generator.ts) — null falls back to the
   * item type's generic label in the UI. */
  refTitle: string | null;
  /** Deep link to that specific content, when refTitle is set — null falls
   * back to the item type's generic section link. Grammar lessons don't
   * have their own route (only /grammar/[topicSlug] does — one lesson per
   * topic today), so this resolves to the lesson's *topic* slug. */
  refHref: string | null;
}

export interface LearningPathDayDetail {
  dayId: string;
  dayNumber: number;
  scheduledDate: string;
  focusParts: TestPart[];
  status: LearningDayStatus;
  summary: string | null;
  items: LearningPathItemDetail[];
}

/** 404s for a day number outside the current path rather than exposing an
 * empty shell — callers (the day page) separately redirect away for a
 * still-LOCKED day, since that's a valid day that just isn't ready yet. */
export async function getLearningPathDayDetail(userId: string, dayNumber: number): Promise<LearningPathDayDetail> {
  const day = await db.learningPathDay.findFirst({
    where: { dayNumber, path: { userId, status: "ACTIVE" } },
    include: { items: { orderBy: { orderIndex: "asc" } } },
  });
  if (!day) notFound();

  const grammarLessonIds = day.items.filter((i) => i.itemType === "GRAMMAR_LESSON" && i.refId).map((i) => i.refId as string);
  const lessons =
    grammarLessonIds.length > 0
      ? await db.grammarLesson.findMany({
          where: { id: { in: grammarLessonIds } },
          select: { id: true, title: true, topic: { select: { slug: true } } },
        })
      : [];
  const lessonById = new Map(lessons.map((l) => [l.id, { title: l.title, topicSlug: l.topic.slug }]));

  return {
    dayId: day.id,
    dayNumber: day.dayNumber,
    scheduledDate: day.scheduledDate.toISOString().slice(0, 10),
    focusParts: day.focusParts,
    status: day.status,
    summary: day.summary,
    items: day.items.map((i) => {
      const lesson = i.refId ? lessonById.get(i.refId) : undefined;
      return {
        id: i.id,
        itemType: i.itemType,
        status: i.status,
        orderIndex: i.orderIndex,
        refTitle: lesson?.title ?? null,
        refHref: lesson ? `/grammar/${lesson.topicSlug}` : null,
      };
    }),
  };
}
