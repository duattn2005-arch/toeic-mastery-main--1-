import "server-only";
import { db } from "@/lib/db";
import { WEAK_THRESHOLD } from "./skill-mastery";
import { RECENT_EXCLUSION_DAYS, shuffle } from "./mentor-test-generator";
import { TEST_PARTS } from "@/lib/constants/toeic";
import type { Prisma } from "@/generated/prisma/client";
import type { MentorLevel, SkillDimensionType, TestPart } from "@/generated/prisma/enums";

/**
 * Beginner->Intermediate->Advanced level gate (see docs/ai-mentor-
 * architecture.md section 10) — layered on top of the existing per-
 * dimension SkillMastery/SkillUnlock engine (skill-mastery.ts) rather than
 * replacing it. A LEVEL_GATE MentorTest (mentor-test-generator.ts's sibling
 * here) is the only thing that can move `Profile.mentorLevel` forward.
 *
 * Cấp A (Advanced) is out of scope here — no further gate is generated once
 * a learner reaches INTERMEDIATE; that's a separate, not-yet-specced flow.
 */

/** A level that still has a "next" gate to clear. */
export type GateableLevel = "BEGINNER" | "INTERMEDIATE";

export interface CoreLabel {
  dimensionType: SkillDimensionType;
  dimensionKey: string;
}

const MIN_SAMPLE_PER_LABEL: Record<GateableLevel, number> = { BEGINNER: 10, INTERMEDIATE: 15 };
const MIN_TOTAL_ATTEMPTED: Record<GateableLevel, number> = { BEGINNER: 100, INTERMEDIATE: 200 };
const GATE_TARGET_LEVEL: Record<GateableLevel, MentorLevel> = { BEGINNER: "INTERMEDIATE", INTERMEDIATE: "ADVANCED" };
const GATE_PASS_THRESHOLD = 0.8;
const GATE_RESTART_THRESHOLD = 0.5;
const REMEDIATE_MAX_LABELS = 3;
const GATE_QUESTIONS_PER_LABEL = 3;

/**
 * Core labels a level's Gate Test/eligibility bar is measured against —
 * decided in docs/ai-mentor-architecture.md mục 10.6 điểm 3: Beginner's are
 * every seeded GrammarTopic; Intermediate's are every TestPart PLUS the
 * same GrammarTopic set. (The spec's "Part 5 - Mệnh đề quan hệ" style
 * Part×Topic cross isn't trackable yet — SkillMastery has no composite
 * PART+GRAMMAR_TOPIC dimension — so Intermediate widens Beginner's per-topic
 * bar to per-topic AND per-part instead of narrowing to a cross. Revisit if
 * a real PART+GRAMMAR_TOPIC dimension gets added later.)
 */
export async function getCoreLabels(level: GateableLevel): Promise<CoreLabel[]> {
  const topics = await db.grammarTopic.findMany({ select: { slug: true }, orderBy: { orderIndex: "asc" } });
  const grammarLabels: CoreLabel[] = topics.map((t) => ({ dimensionType: "GRAMMAR_TOPIC" as const, dimensionKey: t.slug }));
  if (level === "BEGINNER") return grammarLabels;
  const partLabels: CoreLabel[] = TEST_PARTS.map((p) => ({ dimensionType: "PART" as const, dimensionKey: p }));
  return [...partLabels, ...grammarLabels];
}

export interface LevelGateEligibility {
  eligible: boolean;
  totalAttempted: number;
  totalRequired: number;
  /** Core labels still short of the per-label sample bar — empty when
   * `eligible` is true (both conditions must hold). */
  labelsBelow: { dimensionType: SkillDimensionType; dimensionKey: string; attemptedCount: number; required: number }[];
}

/**
 * "Đủ điều kiện mới tạo" cho Gate Test: đã luyện đủ tổng số câu VÀ đủ mẫu ở
 * từng nhãn cốt lõi của cấp hiện tại — xem mục 10.1/10.2 trong doc kiến
 * trúc. Dùng SkillMastery (rollup từ mọi Attempt/MentorTest đã làm), không
 * phải chỉ riêng trong một bài Gate Test.
 */
export async function isEligibleForLevelGate(userId: string, level: GateableLevel): Promise<LevelGateEligibility> {
  const labels = await getCoreLabels(level);
  const minSample = MIN_SAMPLE_PER_LABEL[level];
  const minTotal = MIN_TOTAL_ATTEMPTED[level];

  const rows = await db.skillMastery.findMany({
    where: { userId, OR: labels.map((l) => ({ dimensionType: l.dimensionType, dimensionKey: l.dimensionKey })) },
    select: { dimensionType: true, dimensionKey: true, attemptedCount: true },
  });
  const byKey = new Map(rows.map((r) => [`${r.dimensionType}:${r.dimensionKey}`, r.attemptedCount]));

  const labelsBelow = labels
    .map((l) => ({ ...l, attemptedCount: byKey.get(`${l.dimensionType}:${l.dimensionKey}`) ?? 0, required: minSample }))
    .filter((l) => l.attemptedCount < minSample);

  // Every question has exactly one PART (only Part 5/6 ones also roll into a
  // GRAMMAR_TOPIC row for the same question), so summing PART rows alone —
  // not every core-label row — is the real "how many questions practiced at
  // this level" count, whichever level's core-label set is being checked.
  const totalAttempted = rows.filter((r) => r.dimensionType === "PART").reduce((sum, r) => sum + r.attemptedCount, 0);

  return { eligible: labelsBelow.length === 0 && totalAttempted >= minTotal, totalAttempted, totalRequired: minTotal, labelsBelow };
}

export class LevelGateNotEligibleError extends Error {
  constructor(public readonly eligibility: LevelGateEligibility) {
    super("Chưa đủ điều kiện làm Gate Test — cần luyện thêm trước.");
  }
}

export class LevelGateUnavailableError extends Error {}

/**
 * Curates a Gate Test from the admin-vetted Question bank, spread across
 * every core label of the current level (see getCoreLabels) — never one
 * fixed pre-made Test, same reasoning as generatePlacementTest. Re-checks
 * eligibility itself (not just trusting the caller) so no other code path
 * can create one for a learner who hasn't earned it yet.
 */
export async function generateLevelGateTest(params: {
  userId: string;
  currentLevel: GateableLevel;
  conversationId?: string;
}): Promise<{ mentorTestId: string; questionCount: number; targetLevel: MentorLevel }> {
  const eligibility = await isEligibleForLevelGate(params.userId, params.currentLevel);
  if (!eligibility.eligible) throw new LevelGateNotEligibleError(eligibility);

  const targetLevel = GATE_TARGET_LEVEL[params.currentLevel];
  const labels = await getCoreLabels(params.currentLevel);

  const recentlySeenCutoff = new Date(Date.now() - RECENT_EXCLUSION_DAYS * 24 * 60 * 60 * 1000);
  const recentlySeen = await db.attemptAnswer.findMany({
    where: { attempt: { userId: params.userId }, answeredAt: { gte: recentlySeenCutoff } },
    select: { questionId: true },
  });
  const excludeIds = recentlySeen.map((r) => r.questionId);
  const excludeFilter = excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {};

  const selectedIds: string[] = [];
  const seen = new Set<string>();
  for (const label of labels) {
    const where: Prisma.QuestionWhereInput = {
      status: "PUBLISHED",
      ...excludeFilter,
      ...(label.dimensionType === "PART" ? { part: label.dimensionKey as TestPart } : { grammarTopicSlug: label.dimensionKey }),
    };
    const candidates = await db.question.findMany({ where, select: { id: true }, take: GATE_QUESTIONS_PER_LABEL * 3 });
    const picked = shuffle(candidates).slice(0, Math.min(GATE_QUESTIONS_PER_LABEL, candidates.length));
    for (const q of picked) {
      if (!seen.has(q.id)) {
        seen.add(q.id);
        selectedIds.push(q.id);
      }
    }
  }

  if (selectedIds.length === 0) {
    throw new LevelGateUnavailableError("Ngân hàng câu hỏi hiện chưa đủ nội dung để tạo Gate Test cho cấp độ này.");
  }

  const mentorTest = await db.mentorTest.create({
    data: {
      userId: params.userId,
      conversationId: params.conversationId,
      dimensionType: "LEVEL_GATE",
      dimensionKey: targetLevel,
      difficulty: "MEDIUM",
      passThreshold: GATE_PASS_THRESHOLD,
      questions: { create: selectedIds.map((id, index) => ({ questionId: id, orderIndex: index })) },
    },
    select: { id: true },
  });

  return { mentorTestId: mentorTest.id, questionCount: selectedIds.length, targetLevel };
}

export type LevelGateBranch = "ADVANCE" | "REMEDIATE" | "RESTART";

export interface LevelGateLabelScore extends CoreLabel {
  correct: number;
  total: number;
  score: number;
}

export interface LevelGateResult {
  branch: LevelGateBranch;
  overallScore: number;
  labelScores: LevelGateLabelScore[];
  /** REMEDIATE only — top 1-3 weakest labels to học bù trước khi thi lại. */
  weakLabels: LevelGateLabelScore[];
  /** RESTART only — every "Hổng" (score < WEAK_THRESHOLD) label. */
  hongLabels: LevelGateLabelScore[];
}

/**
 * 3-nhánh evaluateLevelGate — mục 10.2 điểm 1 đã chốt: ngưỡng cố định trên
 * chính bài Gate Test này (không so với một kỳ TOEIC đầy đủ). Nhận đúng
 * danh sách câu đã chấm của MentorTest (part + grammarTopicSlug + isCorrect
 * per question, giống cách submit route đã tính cho nhánh PLACEMENT).
 *
 * Không lọc nhiễu thời gian (đã chốt ở mục 10.2 điểm 2) — cột
 * AttemptAnswer.timeSpentSec tồn tại trong schema nhưng CHƯA có route nào
 * ghi giá trị thật vào (grep xác nhận 2026-09-22), nên áp bộ lọc lúc này sẽ
 * loại bỏ toàn bộ dữ liệu chứ không phải "nhiễu". Bỏ qua bước lọc cho tới
 * khi có một luồng ghi timeSpentSec thật.
 */
export function evaluateLevelGate(
  graded: { part: TestPart; grammarTopicSlug: string | null; isCorrect: boolean }[]
): LevelGateResult {
  const totalCount = graded.length;
  const correctCount = graded.filter((g) => g.isCorrect).length;
  const overallScore = totalCount > 0 ? correctCount / totalCount : 0;

  const byLabel = new Map<string, LevelGateLabelScore>();
  const bump = (dimensionType: SkillDimensionType, dimensionKey: string, isCorrect: boolean) => {
    const key = `${dimensionType}:${dimensionKey}`;
    const entry = byLabel.get(key) ?? { dimensionType, dimensionKey, correct: 0, total: 0, score: 0 };
    entry.total += 1;
    if (isCorrect) entry.correct += 1;
    entry.score = entry.correct / entry.total;
    byLabel.set(key, entry);
  };
  for (const g of graded) {
    bump("PART", g.part, g.isCorrect);
    if (g.grammarTopicSlug) bump("GRAMMAR_TOPIC", g.grammarTopicSlug, g.isCorrect);
  }

  const labelScores = [...byLabel.values()];
  const weakSorted = labelScores.filter((l) => l.score < WEAK_THRESHOLD).sort((a, b) => a.score - b.score);

  // "≥80% và không nhãn nào Hổng" -> lên cấp. Nếu đạt ≥80% tổng nhưng vẫn
  // còn nhãn Hổng, spec gốc không nói rõ — xử lý như REMEDIATE (không lên
  // cấp khi còn lỗ hổng rõ rệt, nhưng cũng không nặng tay bắt học lại từ
  // đầu như RESTART).
  let branch: LevelGateBranch;
  if (overallScore >= GATE_PASS_THRESHOLD && weakSorted.length === 0) branch = "ADVANCE";
  else if (overallScore >= GATE_RESTART_THRESHOLD) branch = "REMEDIATE";
  else branch = "RESTART";

  return {
    branch,
    overallScore,
    labelScores,
    weakLabels: branch === "REMEDIATE" ? weakSorted.slice(0, REMEDIATE_MAX_LABELS) : [],
    hongLabels: branch === "RESTART" ? weakSorted : [],
  };
}

/**
 * ADVANCE side-effect: bumps mentorLevel and appends a short "hồ sơ bàn
 * giao" to MentorMemory so the next level's chat context already knows
 * what score got them here and what's still a little weak — same
 * read-then-upsert pattern memory-summarizer.ts already uses for this
 * table (MentorMemory is a best-effort rolling digest, not a strict ledger,
 * so this isn't wrapped in a transaction with the mentorLevel write).
 */
export async function recordLevelAdvance(params: {
  userId: string;
  fromLevel: MentorLevel;
  toLevel: MentorLevel;
  overallScore: number;
  labelScores: LevelGateLabelScore[];
}): Promise<void> {
  await db.profile.update({ where: { id: params.userId }, data: { mentorLevel: params.toLevel } });

  const stillWeak = [...params.labelScores].filter((l) => l.score < WEAK_THRESHOLD).sort((a, b) => a.score - b.score).slice(0, 3);
  const weakText =
    stillWeak.length > 0
      ? `Còn hơi yếu ở: ${stillWeak.map((l) => `${l.dimensionKey} (${Math.round(l.score * 100)}%)`).join(", ")}.`
      : "Không còn nhãn nào yếu rõ rệt lúc vượt cấp.";
  const handoffLine = `[Bàn giao ${params.fromLevel}→${params.toLevel}, ${new Date().toISOString().slice(0, 10)}] Đạt ${Math.round(
    params.overallScore * 100
  )}% ở Gate Test. ${weakText}`;

  const existing = await db.mentorMemory.findUnique({ where: { userId: params.userId }, select: { summary: true } });
  const summary = existing?.summary ? `${existing.summary}\n${handoffLine}` : handoffLine;

  await db.mentorMemory.upsert({
    where: { userId: params.userId },
    create: { userId: params.userId, summary },
    update: { summary },
  });
}
