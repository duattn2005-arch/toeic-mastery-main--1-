import "server-only";
import { db } from "@/lib/db";
import { refreshLearningPathForUser } from "./learning-path-replanner";

export class LearningPathItemNotFoundError extends Error {}

/**
 * Marks one LearningPathItem DONE and, once every item in its day is DONE,
 * completes the day and unlocks the next one. Called by the frontend after
 * any item finishes — a lesson read, a vocab review batch cleared, or (for
 * MINI_TEST items) only after /api/mentor/tests/[id]/submit reports
 * `passed: true`. A failed mini-test deliberately never calls this, so the
 * day — and whatever harder content the next day would unlock — stays
 * locked until the learner actually clears it.
 */
export async function completeLearningPathItem(userId: string, itemId: string): Promise<{ dayCompleted: boolean; nextDayUnlocked: boolean }> {
  const item = await db.learningPathItem.findUnique({
    where: { id: itemId },
    include: { day: { select: { id: true, dayNumber: true, pathId: true, path: { select: { userId: true } } } } },
  });
  if (!item || item.day.path.userId !== userId) {
    throw new LearningPathItemNotFoundError("LearningPathItem not found");
  }

  await db.learningPathItem.update({ where: { id: itemId }, data: { status: "DONE" } });

  const remaining = await db.learningPathItem.count({
    where: { dayId: item.day.id, id: { not: itemId }, status: { not: "DONE" } },
  });

  if (remaining > 0) {
    return { dayCompleted: false, nextDayUnlocked: false };
  }

  await db.learningPathDay.update({ where: { id: item.day.id }, data: { status: "COMPLETED", completedAt: new Date() } });

  // Re-derive the next few still-locked days from the freshest SkillMastery
  // right as a day wraps up — the daily cron is the baseline sweep, this
  // makes the adjustment feel immediate instead of waiting for it. Must
  // never fail or delay the day/unlock response itself.
  void refreshLearningPathForUser(userId).catch((err) => console.error("refreshLearningPathForUser failed", err));

  const nextDay = await db.learningPathDay.findFirst({
    where: { pathId: item.day.pathId, dayNumber: item.day.dayNumber + 1 },
    select: { id: true, status: true },
  });

  let nextDayUnlocked = false;
  if (nextDay && nextDay.status === "LOCKED") {
    await db.learningPathDay.update({ where: { id: nextDay.id }, data: { status: "UNLOCKED" } });
    nextDayUnlocked = true;
  }

  return { dayCompleted: true, nextDayUnlocked };
}
