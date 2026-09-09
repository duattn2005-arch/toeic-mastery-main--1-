import "server-only";
import { db } from "@/lib/db";
import { getUnlockedDifficulty } from "./skill-mastery";
import type { Prisma } from "@/generated/prisma/client";
import type { SkillDimensionType, Difficulty, TestPart } from "@/generated/prisma/enums";

const DEFAULT_QUESTION_COUNT = 5;
const RECENT_EXCLUSION_DAYS = 14;

export class UnsupportedMentorTestDimensionError extends Error {}

/**
 * Curates a MentorTest from the existing, admin-vetted Question bank —
 * never generates new question content (see the design note at the top of
 * the AI Mentor section in schema.prisma). VOCAB_TOPIC is out of scope
 * here: weak vocabulary already has its own dedicated SRS review queue
 * (user_vocabulary), not a Question-bank test.
 */
export async function generateMentorTest(params: {
  userId: string;
  dimensionType: SkillDimensionType;
  dimensionKey: string;
  conversationId?: string;
  /** Overrides the auto-resolved difficulty — e.g. a diagnostic/placement
   * use case that isn't gated by SkillUnlock. Leave unset for the normal
   * "test what the learner is currently allowed to see" path. */
  difficulty?: Difficulty;
  count?: number;
}): Promise<{ mentorTestId: string; questionCount: number; difficulty: Difficulty }> {
  if (params.dimensionType === "VOCAB_TOPIC") {
    throw new UnsupportedMentorTestDimensionError(
      "VOCAB_TOPIC không tạo MentorTest từ ngân hàng câu hỏi — từ vựng yếu đã có hàng đợi ôn tập SRS riêng (user_vocabulary)."
    );
  }

  const count = params.count ?? DEFAULT_QUESTION_COUNT;
  const difficulty = params.difficulty ?? (await getUnlockedDifficulty(params.userId, params.dimensionType, params.dimensionKey));
  const recentlySeenCutoff = new Date(Date.now() - RECENT_EXCLUSION_DAYS * 24 * 60 * 60 * 1000);

  const recentlySeen = await db.attemptAnswer.findMany({
    where: { attempt: { userId: params.userId }, answeredAt: { gte: recentlySeenCutoff } },
    select: { questionId: true },
  });
  const excludeIds = recentlySeen.map((r) => r.questionId);

  const where: Prisma.QuestionWhereInput = {
    status: "PUBLISHED",
    difficulty,
    ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
    ...(params.dimensionType === "PART" ? { part: params.dimensionKey as TestPart } : {}),
    ...(params.dimensionType === "GRAMMAR_TOPIC" ? { grammarTopicSlug: params.dimensionKey } : {}),
  };

  // Oversample then shuffle in JS rather than ORDER BY random() in SQL —
  // cheap at this table size and keeps question selection out of the DB
  // layer, where it'd be easy to accidentally make it deterministic again.
  let candidates = await db.question.findMany({ where, select: { id: true }, take: count * 3 });
  if (candidates.length === 0) {
    // Falls back to "any difficulty" rather than failing outright — a
    // brand-new dimension with only a handful of seeded questions at one
    // difficulty shouldn't leave the learner with no mini-test at all.
    candidates = await db.question.findMany({ where: { ...where, difficulty: undefined }, select: { id: true }, take: count * 3 });
  }
  if (candidates.length === 0) {
    throw new Error(`Không tìm thấy câu hỏi PUBLISHED phù hợp cho ${params.dimensionType}=${params.dimensionKey}.`);
  }

  const selected = shuffle(candidates).slice(0, Math.min(count, candidates.length));

  const mentorTest = await db.mentorTest.create({
    data: {
      userId: params.userId,
      conversationId: params.conversationId,
      dimensionType: params.dimensionType,
      dimensionKey: params.dimensionKey,
      difficulty,
      questions: { create: selected.map((q, index) => ({ questionId: q.id, orderIndex: index })) },
    },
    select: { id: true },
  });

  return { mentorTestId: mentorTest.id, questionCount: selected.length, difficulty };
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
