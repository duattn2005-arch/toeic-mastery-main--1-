import "server-only";
import { db } from "@/lib/db";
import { RECENT_EXCLUSION_DAYS, shuffle } from "./mentor-test-generator";
import { TEST_PARTS } from "@/lib/constants/toeic";
import { buildAdvancedHandoffNotes } from "./advanced-readiness";
import type { Prisma } from "@/generated/prisma/client";
import type { MentorLevel, SkillDimensionType, TestPart } from "@/generated/prisma/enums";

/**
 * Beginner->Intermediate->Advanced level gate (see docs/ai-mentor-
 * architecture.md sections 10-11) — layered on top of the existing
 * per-dimension SkillMastery/SkillUnlock engine (skill-mastery.ts) rather
 * than replacing it. A LEVEL_GATE MentorTest (mentor-test-generator.ts's
 * sibling here) is the only thing that can move `Profile.mentorLevel`
 * forward.
 *
 * `GateableLevel` already includes INTERMEDIATE (→ ADVANCED), so the I→A
 * gate runs on the same engine as B→I. What's still missing for Cấp A is
 * content, not mechanism: getCoreLabels("INTERMEDIATE") doesn't yet return
 * any STRATEGIC_LABEL entries (see section 11.1), and `strategic_labels` has
 * no rows/Question tagging yet — see section 11 for the open decisions
 * before that gets wired up.
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
/** Exported for competency-heatmap.ts (mục 12) so the heatmap's Green/
 * Yellow/Red bands use the exact same cutoffs as the Gate Test itself,
 * instead of a second, potentially-drifting copy of these numbers. */
export const GATE_PASS_THRESHOLD = 0.8;
const GATE_RESTART_THRESHOLD = 0.5;
const REMEDIATE_MAX_LABELS = 3;
const GATE_QUESTIONS_PER_LABEL = 3;
/**
 * "Hổng" cutoff for a single label — sourced straight from the B/I PDF docs
 * (Cấp B mục 4's "Đạt ≥70% / Cận đạt 50-69% / Hổng <50%" table, and Cấp I
 * mục V's own "Không có nhãn nào < 50%" line), NOT skill-mastery.ts's
 * WEAK_THRESHOLD=0.6 — that constant is a different, unrelated bar used by
 * recommendation.ts/learning-path-generator.ts for "worth recommending
 * practice on", and changing it would ripple into those features too.
 * Level-gate/remediation logic uses this dedicated constant so the actual
 * B→I/I→A transition math matches the source docs' numbers exactly
 * (2026-09-22). Exported for competency-heatmap.ts (mục 12) — see
 * GATE_PASS_THRESHOLD's own export comment just above.
 */
export const HONG_LABEL_THRESHOLD = 0.5;
/** Cấp I mục V's "Đạt chuẩn lên A" table — Placement test ≥80% and Gate
 * Test I ≥80% (already GATE_PASS_THRESHOLD). Only re-checked for the I→A
 * transition; Cấp B's own table has no placement re-check. */
const ADVANCED_PLACEMENT_THRESHOLD = 0.8;
/** Both B and I docs' "từ vựng đã nhớ ≥70%" condition — re-checked for
 * every ADVANCE branch (B→I and I→A alike). */
const VOCAB_MASTERY_THRESHOLD = 0.7;
/** Extra "ôn tập tổng quát" questions a remediation test tops up with, spread
 * across core labels OTHER than the ones actually weak — so học bù never
 * feels like being locked into a single Part/topic forever (2026-09-22). */
const REMEDIATION_EXTRA_REVIEW_COUNT = 4;

/**
 * Beginner's core Parts — a Gate Test that decides "lên cấp I hay không"
 * must actually include listening (ảnh + audio hỏi-đáp) and not just
 * Part 5/6-flavored grammar topics, or it's grading readiness on content
 * the learner may never have practiced. Deliberately NOT all 7 — Cấp B is
 * foundation-only (photos, short Q&A, single-sentence grammar); Part 3/4/7
 * stay reserved for the fuller Intermediate→Advanced gate below
 * (2026-09-22 discussion).
 */
const BEGINNER_CORE_PARTS: TestPart[] = ["PART1", "PART2", "PART5"];

/**
 * Core labels a level's Gate Test/eligibility bar is measured against —
 * decided in docs/ai-mentor-architecture.md mục 10.6 điểm 3, refined
 * 2026-09-22: Beginner's are BEGINNER_CORE_PARTS + every seeded
 * GrammarTopic; Intermediate's (i.e. the gate up to Cấp A, the highest
 * level) are every TestPart PLUS the same GrammarTopic set — Cấp A is
 * meant to require full-part coverage, Cấp B only its foundation subset.
 * (The spec's "Part 5 - Mệnh đề quan hệ" style Part×Topic cross isn't
 * trackable yet — SkillMastery has no composite PART+GRAMMAR_TOPIC
 * dimension — so each level just widens its per-topic bar with a separate
 * per-part bar instead of narrowing to a cross. Revisit if a real
 * PART+GRAMMAR_TOPIC dimension gets added later.)
 *
 * Intermediate's set additionally includes every seeded StrategicLabel
 * (mục 11 — Cấp A's "nhãn chiến lược") on top of PART/GRAMMAR_TOPIC, per
 * mục 11.2 điểm 1's decision to keep the three label types as separate
 * buckets rather than one composite PART×STRATEGIC_LABEL key. Until
 * Question rows actually carry strategicLabelSlugs (a content-tagging task,
 * not code — see seed-data/strategic-labels.ts's own comment), this simply
 * adds core labels nothing can satisfy yet, same as any other under-seeded
 * label already surfaces as "labelsBelow" on the eligibility check.
 */
export async function getCoreLabels(level: GateableLevel): Promise<CoreLabel[]> {
  const topics = await db.grammarTopic.findMany({ select: { slug: true }, orderBy: { orderIndex: "asc" } });
  const grammarLabels: CoreLabel[] = topics.map((t) => ({ dimensionType: "GRAMMAR_TOPIC" as const, dimensionKey: t.slug }));
  const parts = level === "BEGINNER" ? BEGINNER_CORE_PARTS : TEST_PARTS;
  const partLabels: CoreLabel[] = parts.map((p) => ({ dimensionType: "PART" as const, dimensionKey: p }));
  if (level === "BEGINNER") return [...partLabels, ...grammarLabels];

  const strategicLabels = await db.strategicLabel.findMany({ select: { slug: true }, orderBy: { orderIndex: "asc" } });
  const strategicCoreLabels: CoreLabel[] = strategicLabels.map((s) => ({ dimensionType: "STRATEGIC_LABEL" as const, dimensionKey: s.slug }));
  return [...partLabels, ...grammarLabels, ...strategicCoreLabels];
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
  const excludeFilter = excludeIdsFilter(await recentlySeenIds(params.userId));
  const selectedIds = await pickQuestionsForLabels(labels, excludeFilter, GATE_QUESTIONS_PER_LABEL);

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

/** Shared by generateLevelGateTest/generateRemediationTest — never resurface
 * a question the learner answered in the last RECENT_EXCLUSION_DAYS days. */
async function recentlySeenIds(userId: string): Promise<string[]> {
  const recentlySeenCutoff = new Date(Date.now() - RECENT_EXCLUSION_DAYS * 24 * 60 * 60 * 1000);
  const recentlySeen = await db.attemptAnswer.findMany({
    where: { attempt: { userId }, answeredAt: { gte: recentlySeenCutoff } },
    select: { questionId: true },
  });
  return recentlySeen.map((r) => r.questionId);
}

function excludeIdsFilter(ids: string[]): Prisma.QuestionWhereInput {
  return ids.length > 0 ? { id: { notIn: ids } } : {};
}

function questionWhereForLabel(label: CoreLabel, excludeFilter: Prisma.QuestionWhereInput): Prisma.QuestionWhereInput {
  // NOTE: STRATEGIC_LABEL (Cấp A) filtering is added alongside
  // Question.strategicLabelSlugs — see the "Cấp A nhãn chiến lược" schema
  // addition in this same change; getCoreLabels only ever returns PART/
  // GRAMMAR_TOPIC labels until then, so this never sees that branch early.
  const labelFilter: Prisma.QuestionWhereInput =
    label.dimensionType === "PART"
      ? { part: label.dimensionKey as TestPart }
      : label.dimensionType === "GRAMMAR_TOPIC"
        ? { grammarTopicSlug: label.dimensionKey }
        : { strategicLabelSlugs: { has: label.dimensionKey } };
  return { status: "PUBLISHED", ...excludeFilter, ...labelFilter };
}

/** Pools up to `perLabel` questions for each label (deduped across labels)
 * — the shared curation loop behind both the Gate Test itself and its
 * follow-up remediation test. */
async function pickQuestionsForLabels(labels: CoreLabel[], excludeFilter: Prisma.QuestionWhereInput, perLabel: number): Promise<string[]> {
  const selectedIds: string[] = [];
  const seen = new Set<string>();
  for (const label of labels) {
    const where = questionWhereForLabel(label, excludeFilter);
    const candidates = await db.question.findMany({ where, select: { id: true }, take: perLabel * 3 });
    const picked = shuffle(candidates).slice(0, Math.min(perLabel, candidates.length));
    for (const q of picked) {
      if (!seen.has(q.id)) {
        seen.add(q.id);
        selectedIds.push(q.id);
      }
    }
  }
  return selectedIds;
}

/**
 * "Học bù" (mục 4 trong docs/ai-mentor-architecture.md's PDF nguồn) — after
 * a REMEDIATE/RESTART LEVEL_GATE result, auto-curates ONE follow-up
 * MentorTest pooled across the weak/hổng labels the gate just found (never
 * more than REMEDIATE_MAX_LABELS worth, whatever the caller passes in),
 * linked back to the gate it followed via sourceLevelGateTestId so the UI
 * can offer "làm lại Gate Test" once gradeRemediationTest says every label
 * cleared. Called right from the gate's own submit route — the learner
 * never has to ask for this separately.
 *
 * On top of the focused weak-label questions, tops up with
 * REMEDIATION_EXTRA_REVIEW_COUNT quick review questions spread across the
 * level's OTHER core labels — học bù stays targeted at what's actually
 * broken, but never leaves the learner drilling a single Part/topic in
 * isolation for the whole session (2026-09-22 discussion). Those review
 * questions are NOT required to clear HONG_LABEL_THRESHOLD — see
 * gradeRemediationTest's `targetLabels` param.
 */
export async function generateRemediationTest(params: {
  userId: string;
  sourceLevelGateTestId: string;
  fromLevel: GateableLevel;
  toLevel: MentorLevel;
  labels: CoreLabel[];
  conversationId?: string;
}): Promise<{ mentorTestId: string; questionCount: number } | null> {
  if (params.labels.length === 0) return null;

  const baseExcludeIds = await recentlySeenIds(params.userId);
  const focusedIds = await pickQuestionsForLabels(params.labels, excludeIdsFilter(baseExcludeIds), GATE_QUESTIONS_PER_LABEL);

  const targetKeys = new Set(params.labels.map((l) => `${l.dimensionType}:${l.dimensionKey}`));
  const allCoreLabels = await getCoreLabels(params.fromLevel);
  const reviewLabelPool = shuffle(allCoreLabels.filter((l) => !targetKeys.has(`${l.dimensionType}:${l.dimensionKey}`)));

  const reviewIds: string[] = [];
  for (const label of reviewLabelPool) {
    if (reviewIds.length >= REMEDIATION_EXTRA_REVIEW_COUNT) break;
    const where = questionWhereForLabel(label, excludeIdsFilter([...baseExcludeIds, ...focusedIds, ...reviewIds]));
    const candidates = await db.question.findMany({ where, select: { id: true }, take: 3 });
    const picked = shuffle(candidates)[0];
    if (picked) reviewIds.push(picked.id);
  }

  const selectedIds = [...focusedIds, ...reviewIds];
  if (selectedIds.length === 0) return null;

  const mentorTest = await db.mentorTest.create({
    data: {
      userId: params.userId,
      conversationId: params.conversationId,
      dimensionType: "REMEDIATION",
      dimensionKey: `${params.fromLevel}->${params.toLevel}`,
      difficulty: "MEDIUM",
      passThreshold: HONG_LABEL_THRESHOLD,
      remediationLabels: params.labels as unknown as Prisma.InputJsonValue,
      sourceLevelGateTestId: params.sourceLevelGateTestId,
      questions: { create: selectedIds.map((id, index) => ({ questionId: id, orderIndex: index })) },
    },
    select: { id: true },
  });

  return { mentorTestId: mentorTest.id, questionCount: selectedIds.length };
}

export interface RemediationLabelResult extends LevelGateLabelScore {
  cleared: boolean;
}

export interface RemediationResult {
  labelResults: RemediationLabelResult[];
  allCleared: boolean;
}

/**
 * Grades a REMEDIATION MentorTest per-label (not one overall pass/fail) —
 * a label counts as "đã bù" once its score on this follow-up test clears
 * HONG_LABEL_THRESHOLD, the same "Hổng" bar evaluateLevelGate uses.
 * `labelResults` covers every label present in
 * the submission (including the bonus review questions' labels, so the UI
 * can show "ôn thêm Part X: 100%"), but `allCleared` only requires the
 * originally-targeted `targetLabels` (from MentorTest.remediationLabels) to
 * clear — a review question going wrong must never block retaking the Gate
 * Test.
 */
export function gradeRemediationTest(graded: GradedGateQuestion[], targetLabels: CoreLabel[]): RemediationResult {
  const labelResults = scoreByLabel(graded).map((l) => ({ ...l, cleared: l.score >= HONG_LABEL_THRESHOLD }));
  const targetKeys = new Set(targetLabels.map((l) => `${l.dimensionType}:${l.dimensionKey}`));
  const targetResults = labelResults.filter((l) => targetKeys.has(`${l.dimensionType}:${l.dimensionKey}`));
  return { labelResults, allCleared: targetResults.length > 0 && targetResults.every((l) => l.cleared) };
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
  /** RESTART only — every "Hổng" (score < HONG_LABEL_THRESHOLD) label. */
  hongLabels: LevelGateLabelScore[];
}

export interface GradedGateQuestion {
  part: TestPart;
  grammarTopicSlug: string | null;
  /** Cấp A "nhãn kép" — strategic labels this question was tagged with, on
   * top of its PART/GRAMMAR_TOPIC label (see StrategicLabel). Empty/absent
   * for B→I gating, where no question carries a strategic label yet. */
  strategicLabelSlugs?: string[];
  isCorrect: boolean;
}

/**
 * Buckets graded gate questions by every label they carry (PART always,
 * GRAMMAR_TOPIC/STRATEGIC_LABEL when present) and scores each bucket —
 * shared by evaluateLevelGate (whole-gate ADVANCE/REMEDIATE/RESTART call)
 * and gradeRemediationTest (per-label "đã bù chưa" check on a follow-up
 * test), so the two never disagree on how a label's score is computed.
 */
export function scoreByLabel(graded: GradedGateQuestion[]): LevelGateLabelScore[] {
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
    for (const slug of g.strategicLabelSlugs ?? []) bump("STRATEGIC_LABEL", slug, g.isCorrect);
  }
  return [...byLabel.values()];
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
export function evaluateLevelGate(graded: GradedGateQuestion[]): LevelGateResult {
  const totalCount = graded.length;
  const correctCount = graded.filter((g) => g.isCorrect).length;
  const overallScore = totalCount > 0 ? correctCount / totalCount : 0;

  const labelScores = scoreByLabel(graded);
  const weakSorted = labelScores.filter((l) => l.score < HONG_LABEL_THRESHOLD).sort((a, b) => a.score - b.score);

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

export interface ExtraAdvanceRequirements {
  vocabRate: number;
  vocabOk: boolean;
  /** null when not applicable to this transition (only Cấp I's "Đạt chuẩn
   * lên A" table re-checks placement; Cấp B's own table doesn't). */
  placementScore: number | null;
  placementOk: boolean | null;
  /** True only when every applicable condition holds — the gate the
   * submit route ANDs onto evaluateLevelGate's own ADVANCE branch. */
  allOk: boolean;
}

/** % of this learner's tracked vocabulary marked as learned — the "từ vựng
 * đã nhớ" condition both B and I PDF docs require for their ADVANCE branch
 * (page 4's B→I table and mục V's I→A table alike). No vocabulary tracked
 * at all counts as 0%, not "not applicable" — "đã nhớ 70%" can't be true of
 * nothing. */
async function getVocabularyMasteryRate(userId: string): Promise<number> {
  const [total, learned] = await Promise.all([
    db.userVocabulary.count({ where: { userId } }),
    db.userVocabulary.count({ where: { userId, isLearned: true } }),
  ]);
  return total > 0 ? learned / total : 0;
}

/** Most recent completed PLACEMENT MentorTest's score (0-1) — placement
 * tests have no real pass/fail bar (passThreshold: 0, see
 * generatePlacementTest) so `completedAt` alone marks "done", not status. */
async function getLatestPlacementScore(userId: string): Promise<number | null> {
  const test = await db.mentorTest.findFirst({
    where: { userId, dimensionType: "PLACEMENT", completedAt: { not: null } },
    orderBy: { completedAt: "desc" },
    select: { score: true },
  });
  return test?.score ?? null;
}

/**
 * The extra conditions the B/I PDF docs list alongside the Gate Test score
 * itself for an ADVANCE branch to actually count — see mục 10.2 discussion
 * 2026-09-22: Cấp B's own table requires "từ vựng đã nhớ ≥70%" on top of
 * the Gate Test result, and Cấp I's "Đạt chuẩn lên A" table additionally
 * requires "Placement test ≥80%". evaluateLevelGate itself stays a pure,
 * synchronous function (fed one already-graded Gate Test); this is the
 * async DB-backed half the submit route ANDs onto its ADVANCE branch
 * before actually calling recordLevelAdvance.
 */
export async function checkExtraAdvanceRequirements(userId: string, targetLevel: MentorLevel): Promise<ExtraAdvanceRequirements> {
  const vocabRate = await getVocabularyMasteryRate(userId);
  const vocabOk = vocabRate >= VOCAB_MASTERY_THRESHOLD;

  if (targetLevel !== "ADVANCED") {
    return { vocabRate, vocabOk, placementScore: null, placementOk: null, allOk: vocabOk };
  }

  const placementScore = await getLatestPlacementScore(userId);
  const placementOk = placementScore !== null && placementScore >= ADVANCED_PLACEMENT_THRESHOLD;
  return { vocabRate, vocabOk, placementScore, placementOk, allOk: vocabOk && placementOk };
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

  const stillWeak = [...params.labelScores].filter((l) => l.score < HONG_LABEL_THRESHOLD).sort((a, b) => a.score - b.score).slice(0, 3);
  const weakText =
    stillWeak.length > 0
      ? `Còn hơi yếu ở: ${stillWeak.map((l) => `${l.dimensionKey} (${Math.round(l.score * 100)}%)`).join(", ")}.`
      : "Không còn nhãn nào yếu rõ rệt lúc vượt cấp.";
  let handoffLine = `[Bàn giao ${params.fromLevel}→${params.toLevel}, ${new Date().toISOString().slice(0, 10)}] Đạt ${Math.round(
    params.overallScore * 100
  )}% ở Gate Test. ${weakText}`;

  // Cấp A handoff (mục 11/spec mục X's "Hồ sơ chiến lược thi thật") — chỉ
  // áp dụng cho I→A, không phải B→I. Template-generated từ SkillMastery +
  // Mock Test gần nhất (advanced-readiness.ts), không phải LLM tự sinh —
  // giữ cùng triết lý "AI không tự bịa nội dung, chỉ tổng hợp dữ liệu thật"
  // của toàn bộ level-gate.ts.
  if (params.toLevel === "ADVANCED") {
    const notes = await buildAdvancedHandoffNotes(params.userId).catch((err) => {
      console.error("buildAdvancedHandoffNotes failed", err);
      return [];
    });
    if (notes.length > 0) {
      handoffLine += `\nLưu ý chiến lược Cấp A: ${notes.join(" | ")}`;
    }
  }

  const existing = await db.mentorMemory.findUnique({ where: { userId: params.userId }, select: { summary: true } });
  const summary = existing?.summary ? `${existing.summary}\n${handoffLine}` : handoffLine;

  await db.mentorMemory.upsert({
    where: { userId: params.userId },
    create: { userId: params.userId, summary },
    update: { summary },
  });
}
