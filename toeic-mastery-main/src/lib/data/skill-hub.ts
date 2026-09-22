import "server-only";
import { db } from "@/lib/db";
import { getPartAccuracies } from "@/lib/data/skill-stats";
import { LISTENING_PARTS, READING_PARTS, PART_META } from "@/lib/constants/toeic";
import type { TestPart } from "@/generated/prisma/enums";

/** Same "real sample size" bar used across the AI Mentor engine
 * (skill-mastery.ts's getWeakestDimensions, recommendation.ts) — below
 * this, accuracy is too noisy to reorder by. */
const MIN_SAMPLE_SIZE = 5;

export async function getSkillHubData(userId: string, skill: "LISTENING" | "READING") {
  const parts = skill === "LISTENING" ? LISTENING_PARTS : READING_PARTS;
  const accuracies = await getPartAccuracies(userId);
  const accuracyByPart = new Map(accuracies.map((a) => [a.part, a]));

  const testCounts = await db.testSection.groupBy({
    by: ["part"],
    where: { part: { in: parts }, test: { status: "PUBLISHED" } },
    _count: { _all: true },
  });
  const countByPart = new Map(testCounts.map((c) => [c.part, c._count._all]));

  const rows = parts.map((part, originalIndex) => ({
    part,
    meta: PART_META[part],
    accuracy: accuracyByPart.get(part)?.accuracy ?? 0,
    attempted: accuracyByPart.get(part)?.attempted ?? 0,
    testCount: countByPart.get(part) ?? 0,
    originalIndex,
  }));

  /**
   * "Dynamic UI routing" (docs/ai-mentor-architecture.md mục 12.2 điểm 4) —
   * reorder, never hide: a Part with a real sample size and low accuracy
   * floats to the top so the learner lands on their weakest area first,
   * without losing the ability to practice any other Part. Parts without
   * enough data yet keep the original Part1→Part7 order at the bottom.
   */
  rows.sort((a, b) => {
    const aWeak = a.attempted >= MIN_SAMPLE_SIZE;
    const bWeak = b.attempted >= MIN_SAMPLE_SIZE;
    if (aWeak && bWeak) return a.accuracy - b.accuracy || a.originalIndex - b.originalIndex;
    if (aWeak !== bWeak) return aWeak ? -1 : 1;
    return a.originalIndex - b.originalIndex;
  });

  return rows.map((row) => ({ part: row.part, meta: row.meta, accuracy: row.accuracy, attempted: row.attempted, testCount: row.testCount }));
}

export async function getPartTests(part: TestPart) {
  return db.test.findMany({
    where: { status: "PUBLISHED", sections: { some: { part } } },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { attempts: true } } },
  });
}
