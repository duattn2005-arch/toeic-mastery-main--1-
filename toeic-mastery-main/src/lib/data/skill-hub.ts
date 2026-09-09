import "server-only";
import { db } from "@/lib/db";
import { getPartAccuracies } from "@/lib/data/skill-stats";
import { LISTENING_PARTS, READING_PARTS, PART_META } from "@/lib/constants/toeic";
import type { TestPart } from "@/generated/prisma/enums";

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

  return parts.map((part) => ({
    part,
    meta: PART_META[part],
    accuracy: accuracyByPart.get(part)?.accuracy ?? 0,
    attempted: accuracyByPart.get(part)?.attempted ?? 0,
    testCount: countByPart.get(part) ?? 0,
  }));
}

export async function getPartTests(part: TestPart) {
  return db.test.findMany({
    where: { status: "PUBLISHED", sections: { some: { part } } },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { attempts: true } } },
  });
}
