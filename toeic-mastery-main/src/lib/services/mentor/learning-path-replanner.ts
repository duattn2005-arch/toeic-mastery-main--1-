import "server-only";
import { db } from "@/lib/db";
import { TEST_PARTS } from "@/lib/constants/toeic";
import { getWeakestDimensions } from "./skill-mastery";
import { pickGrammarLessonIds, getUsedGrammarLessonIds } from "./grammar-lesson-picker";
import { generateLearningPath, buildDayItems, isMiniTestDay, needsGrammarLesson } from "./learning-path-generator";
import type { TestPart } from "@/generated/prisma/enums";

/** Only re-plan the next few not-yet-reached days — far-future days will
 * get their own turn as they enter this window, and there's no point
 * committing to exactly what day 25 looks like today. */
const REPLAN_LOOKAHEAD_DAYS = 7;

/**
 * This is what makes a LearningPath "sống" (alive) rather than a plan
 * frozen at onboarding: SkillMastery keeps shifting every time the learner
 * practices, so the days they haven't reached yet should keep reflecting
 * *today's* weakest areas, not whatever was weakest when the path was
 * first generated. Days already COMPLETED, IN_PROGRESS, or UNLOCKED are
 * never touched — only genuinely future, still-LOCKED days get
 * re-composed, so nothing changes under a learner who's already looking
 * at (or has finished) a day.
 */
export async function replanUpcomingDays(userId: string): Promise<{ pathId: string; daysUpdated: number } | null> {
  const path = await db.learningPath.findFirst({
    where: { userId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (!path) return null;

  const lockedUpcomingDays = await db.learningPathDay.findMany({
    where: { pathId: path.id, status: "LOCKED" },
    orderBy: { dayNumber: "asc" },
    take: REPLAN_LOOKAHEAD_DAYS,
    select: { id: true, dayNumber: true },
  });
  if (lockedUpcomingDays.length === 0) return { pathId: path.id, daysUpdated: 0 };

  const [weakPartDims, weakGrammarDims] = await Promise.all([
    getWeakestDimensions(userId, 7, "PART"),
    getWeakestDimensions(userId, 5, "GRAMMAR_TOPIC"),
  ]);
  const weakParts = weakPartDims.map((d) => d.dimensionKey as TestPart);
  // No real signal yet (still early days / not enough attempts) — leave
  // the original even rotation from generateLearningPath alone rather than
  // "re-planning" toward nothing.
  if (weakParts.length === 0) return { pathId: path.id, daysUpdated: 0 };

  const rotation = [...weakParts, ...TEST_PARTS.filter((p) => !weakParts.includes(p))];
  let cursor = 0;

  // Compute every day's new focus first — picking grammar lesson ids needs
  // to know up front how many of these days actually need one.
  const dayPlans = lockedUpcomingDays.map((day) => {
    const partCount = isMiniTestDay(day.dayNumber) ? 1 : 2;
    const focusParts = new Set<TestPart>();
    for (let i = 0; i < partCount; i++) {
      focusParts.add(rotation[cursor % rotation.length]);
      cursor += 1;
    }
    return { day, focusParts: [...focusParts] };
  });

  const grammarDayCount = dayPlans.filter((p) => needsGrammarLesson(p.focusParts)).length;
  const alreadyUsedLessonIds = await getUsedGrammarLessonIds(path.id);
  const grammarLessonIds = await pickGrammarLessonIds({
    count: grammarDayCount,
    weakTopicSlugs: weakGrammarDims.map((d) => d.dimensionKey),
    excludeIds: alreadyUsedLessonIds,
  });
  let grammarCursor = 0;

  for (const { day, focusParts } of dayPlans) {
    const grammarLessonId = needsGrammarLesson(focusParts) ? (grammarLessonIds[grammarCursor++] ?? null) : null;

    await db.$transaction([
      db.learningPathDay.update({ where: { id: day.id }, data: { focusParts } }),
      db.learningPathItem.deleteMany({ where: { dayId: day.id } }),
      db.learningPathItem.createMany({
        data: buildDayItems(focusParts, isMiniTestDay(day.dayNumber), grammarLessonId).map((item) => ({ ...item, dayId: day.id })),
      }),
    ]);
  }

  return { pathId: path.id, daysUpdated: lockedUpcomingDays.length };
}

/**
 * When every day in the ACTIVE path is COMPLETED, mark it COMPLETED and
 * start a fresh one (same target score/exam date) — "theo dõi mỗi ngày"
 * should keep producing a path, not leave the learner stranded once the
 * last day is done.
 */
export async function continuePathIfCompleted(userId: string): Promise<{ newPathId: string } | null> {
  const path = await db.learningPath.findFirst({
    where: { userId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: { id: true, targetScore: true, examDate: true, days: { select: { status: true } } },
  });
  if (!path || path.days.length === 0) return null;
  if (!path.days.every((d) => d.status === "COMPLETED")) return null;

  await db.learningPath.update({ where: { id: path.id }, data: { status: "COMPLETED" } });
  const result = await generateLearningPath({ userId, targetScore: path.targetScore, examDate: path.examDate });
  return { newPathId: result.pathId };
}

/**
 * Per-user unit of work, called both reactively (right when a day
 * completes — see learning-path-progress.ts) and from the daily cron
 * (/api/cron/mentor/replan-learning-paths) as a baseline sweep for every
 * learner regardless of whether they were active today.
 */
export async function refreshLearningPathForUser(userId: string): Promise<void> {
  const continued = await continuePathIfCompleted(userId);
  // A freshly generated path's upcoming days are already built from the
  // latest SkillMastery — replanning immediately after would be redundant.
  if (!continued) {
    await replanUpcomingDays(userId);
  }
}
