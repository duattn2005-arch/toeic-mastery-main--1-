import "server-only";
import { db } from "@/lib/db";

/**
 * Picks up to `count` distinct GrammarLesson ids for a learner's upcoming
 * path days — prioritizing lessons under weak GRAMMAR_TOPIC dimensions
 * (SkillMastery), falling back to a topic-order rotation once weak-topic
 * lessons run out (or there's no weak-topic signal yet). `excludeIds`
 * keeps a learner from seeing the same lesson assigned on two different
 * days of the same path.
 */
export async function pickGrammarLessonIds(params: { count: number; weakTopicSlugs: string[]; excludeIds: string[] }): Promise<string[]> {
  if (params.count <= 0) return [];

  const excludeIds = [...params.excludeIds];
  const picked: string[] = [];

  if (params.weakTopicSlugs.length > 0) {
    const weakLessons = await db.grammarLesson.findMany({
      where: { topic: { slug: { in: params.weakTopicSlugs } }, id: { notIn: excludeIds } },
      orderBy: { topic: { orderIndex: "asc" } },
      take: params.count,
      select: { id: true },
    });
    picked.push(...weakLessons.map((l) => l.id));
    excludeIds.push(...picked);
  }

  if (picked.length < params.count) {
    const fallback = await db.grammarLesson.findMany({
      where: { id: { notIn: excludeIds } },
      orderBy: [{ topic: { orderIndex: "asc" } }, { slug: "asc" }],
      take: params.count - picked.length,
      select: { id: true },
    });
    picked.push(...fallback.map((l) => l.id));
  }

  return picked;
}

/** Every GrammarLesson id already assigned somewhere in this path — the
 * exclude set that keeps a re-plan or a fresh generation from repeating a
 * lesson the learner has already been pointed at. */
export async function getUsedGrammarLessonIds(pathId: string): Promise<string[]> {
  const used = await db.learningPathItem.findMany({
    where: { day: { pathId }, itemType: "GRAMMAR_LESSON", refId: { not: null } },
    select: { refId: true },
  });
  return used.map((u) => u.refId).filter((id): id is string => id !== null);
}
