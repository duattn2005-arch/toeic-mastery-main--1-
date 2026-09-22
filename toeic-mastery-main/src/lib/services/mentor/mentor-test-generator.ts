import "server-only";
import { db } from "@/lib/db";
import { getUnlockedDifficulty } from "./skill-mastery";
import { TEST_PARTS, PART_META } from "@/lib/constants/toeic";
import type { Prisma } from "@/generated/prisma/client";
import type { SkillDimensionType, Difficulty, TestPart } from "@/generated/prisma/enums";

const DEFAULT_QUESTION_COUNT = 5;
/** Also reused by level-gate.ts so a Gate Test never resurfaces a question
 * the learner just answered in normal practice. */
export const RECENT_EXCLUSION_DAYS = 14;

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

/** Parts whose questions share a group stimulus (audio/passage) — sampled
 * whole-passage-at-a-time so a learner never sees a group missing the
 * audio/reading context the rest of its questions depend on. */
const GROUPED_PARTS: TestPart[] = ["PART3", "PART4", "PART6", "PART7"];

export class PlacementTestUnavailableError extends Error {}

/**
 * Builds a short (~50-question), all-Parts composite MentorTest for a
 * learner with no score baseline yet — sampled fresh from whatever is
 * currently PUBLISHED across the whole question bank (proportional to each
 * Part's real weight in a full test, via PART_META.questionCount) rather
 * than one fixed pre-made Test, so it reflects newly-added content
 * automatically without ever needing regeneration by hand.
 *
 * Only ever call this from the moment a user actually starts the test (see
 * POST /api/mentor/placement-test) — never while the mentor is merely
 * suggesting one in chat. Creating this row is deliberately the only thing
 * that counts against the free-tier daily placement-test cap, so a learner
 * who's just asking questions about it must never be charged for it.
 */
export async function generatePlacementTest(params: { userId: string; conversationId?: string }): Promise<{
  mentorTestId: string;
  questionCount: number;
}> {
  const recentlySeenCutoff = new Date(Date.now() - RECENT_EXCLUSION_DAYS * 24 * 60 * 60 * 1000);
  const recentlySeen = await db.attemptAnswer.findMany({
    where: { attempt: { userId: params.userId }, answeredAt: { gte: recentlySeenCutoff } },
    select: { questionId: true },
  });
  const excludeIds = recentlySeen.map((r) => r.questionId);
  const excludeFilter = excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {};

  const selectedIds: string[] = [];

  for (const part of TEST_PARTS) {
    // ~25% of the real full-test weight per Part (200 questions → ~50 total).
    const target = Math.max(1, Math.round(PART_META[part].questionCount * 0.25));

    if (GROUPED_PARTS.includes(part)) {
      const passages = await db.passage.findMany({
        where: { part, questions: { some: { status: "PUBLISHED", ...excludeFilter } } },
        select: {
          questions: {
            where: { status: "PUBLISHED", ...excludeFilter },
            orderBy: { orderIndex: "asc" },
            select: { id: true },
          },
        },
      });

      let count = 0;
      for (const passage of shuffle(passages)) {
        if (count >= target || passage.questions.length === 0) continue;
        selectedIds.push(...passage.questions.map((q) => q.id));
        count += passage.questions.length;
      }
    } else {
      const candidates = await db.question.findMany({
        where: { part, status: "PUBLISHED", passageId: null, ...excludeFilter },
        select: { id: true },
        take: target * 3,
      });
      selectedIds.push(...shuffle(candidates).slice(0, Math.min(target, candidates.length)).map((q) => q.id));
    }
  }

  if (selectedIds.length === 0) {
    throw new PlacementTestUnavailableError("Ngân hàng câu hỏi hiện chưa đủ nội dung để tạo bài kiểm tra đầu vào.");
  }

  const mentorTest = await db.mentorTest.create({
    data: {
      userId: params.userId,
      conversationId: params.conversationId,
      dimensionType: "PLACEMENT",
      dimensionKey: "ALL",
      difficulty: "MEDIUM",
      // No pass/fail bar — a placement test's job is to measure the
      // learner's actual level, not to gate content behind a score.
      passThreshold: 0,
      questions: { create: selectedIds.map((id, index) => ({ questionId: id, orderIndex: index })) },
    },
    select: { id: true },
  });

  return { mentorTestId: mentorTest.id, questionCount: selectedIds.length };
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
