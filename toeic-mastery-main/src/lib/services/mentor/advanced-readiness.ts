import "server-only";
import { db } from "@/lib/db";
import { getWeakestDimensions } from "./skill-mastery";

/**
 * Cấp A (Advanced) signals — docs/ai-mentor-architecture.md section 11
 * ("Đường cong sức bền nhận thức" / "ảo giác tự tin" / "3 lưu ý chiến lược
 * cá nhân"). Layered entirely on data `AttemptAnswer` already writes for
 * real (`firstAnsweredAt`/`timeSpentSec`/`initialSelectedLabel`/
 * `answerChangeCount` — see attempts/[attemptId]/sync/route.ts), so this
 * reads a completed full-length Attempt (i.e. a Mock Test), not the shorter
 * curated Gate Test — matches the spec's own worked example (section IX),
 * which computes the stamina curve from a Mock Test attempt.
 *
 * `MentorTestQuestion` (the Gate A Test itself) has matching timing columns
 * in schema but no route writes them yet — see section 11.1 điểm 2/11.2
 * điểm 4, still open. Nothing here depends on that.
 */

const STAMINA_BLOCK_MINUTES = 30;
/** Spec's own "mệt mỏi" signal (mục IV bước 2 của tài liệu Cấp A):
 * "hiệu suất giảm > 25% so với 20 câu đầu" — applied here as first-block
 * vs last-block accuracy drop, since a Mock Test attempt doesn't chunk
 * cleanly into "20 câu đầu" across all 7 Parts. */
const PERFORMANCE_CLIFF_DROP_RATIO = 0.25;

export interface StaminaBlock {
  blockIndex: number;
  startMin: number;
  endMin: number;
  totalAnswered: number;
  correctCount: number;
  accuracy: number;
}

export interface StaminaCurveResult {
  attemptId: string;
  blocks: StaminaBlock[];
  /** True when the last block's accuracy dropped by
   * PERFORMANCE_CLIFF_DROP_RATIO or more relative to the first block —
   * only meaningful with >=2 blocks (a <30min attempt never triggers this). */
  hasPerformanceCliff: boolean;
  cliffDropRatio: number | null;
}

/** Buckets a completed Attempt's answers into 30-minute blocks (by
 * `firstAnsweredAt` relative to `Attempt.startedAt`) and compares
 * first-block vs last-block accuracy — the "Cognitive Stamina Curve". */
export async function computeStaminaCurve(attemptId: string): Promise<StaminaCurveResult | null> {
  const attempt = await db.attempt.findUnique({ where: { id: attemptId }, select: { startedAt: true } });
  if (!attempt) return null;

  const answers = await db.attemptAnswer.findMany({
    where: { attemptId, firstAnsweredAt: { not: null } },
    select: { firstAnsweredAt: true, isCorrect: true },
  });
  if (answers.length === 0) return { attemptId, blocks: [], hasPerformanceCliff: false, cliffDropRatio: null };

  const byBlock = new Map<number, { total: number; correct: number }>();
  for (const a of answers) {
    const elapsedMin = (a.firstAnsweredAt!.getTime() - attempt.startedAt.getTime()) / 60_000;
    const blockIndex = Math.max(0, Math.floor(elapsedMin / STAMINA_BLOCK_MINUTES));
    const entry = byBlock.get(blockIndex) ?? { total: 0, correct: 0 };
    entry.total += 1;
    if (a.isCorrect) entry.correct += 1;
    byBlock.set(blockIndex, entry);
  }

  const blocks: StaminaBlock[] = [...byBlock.entries()]
    .sort(([a], [b]) => a - b)
    .map(([blockIndex, { total, correct }]) => ({
      blockIndex,
      startMin: blockIndex * STAMINA_BLOCK_MINUTES,
      endMin: (blockIndex + 1) * STAMINA_BLOCK_MINUTES,
      totalAnswered: total,
      correctCount: correct,
      accuracy: total > 0 ? correct / total : 0,
    }));

  let hasPerformanceCliff = false;
  let cliffDropRatio: number | null = null;
  if (blocks.length >= 2) {
    const first = blocks[0];
    const last = blocks[blocks.length - 1];
    if (first.accuracy > 0) {
      cliffDropRatio = (first.accuracy - last.accuracy) / first.accuracy;
      hasPerformanceCliff = cliffDropRatio >= PERFORMANCE_CLIFF_DROP_RATIO;
    }
  }

  return { attemptId, blocks, hasPerformanceCliff, cliffDropRatio };
}

export interface AnswerSwitchRisk {
  totalAnswered: number;
  correctToWrongCount: number;
  correctToWrongRate: number;
  isHighRisk: boolean;
}

/** Ví dụ minh họa mục IX của spec ghi nhận 12% correct→wrong switch rate ở
 * một learner còn "cần tinh chỉnh chiến lược" — lấy mốc cao hơn hẳn mức đó
 * làm ngưỡng cảnh báo thật sự (spec không cho số ngưỡng đóng, xem mục 11.2
 * điểm 3), tránh cảnh báo giả cho một tỷ lệ vẫn còn trong biên độ bình
 * thường của ví dụ minh họa. */
const CORRECT_TO_WRONG_HIGH_RISK_RATE = 0.15;

/** "Ảo giác tự tin" (illusion of competence) — % of answers where the
 * learner's FIRST pick was already correct but they switched away from it
 * to a wrong final answer. Only counts questions actually answered
 * (selectedLabel set). */
export async function detectAnswerSwitchRisk(attemptId: string): Promise<AnswerSwitchRisk | null> {
  const answers = await db.attemptAnswer.findMany({
    where: { attemptId, selectedLabel: { not: null } },
    select: { initialSelectedLabel: true, selectedLabel: true, question: { select: { correctLabel: true } } },
  });
  if (answers.length === 0) return null;

  let correctToWrongCount = 0;
  for (const a of answers) {
    if (a.initialSelectedLabel && a.initialSelectedLabel === a.question.correctLabel && a.selectedLabel !== a.question.correctLabel) {
      correctToWrongCount += 1;
    }
  }
  const correctToWrongRate = correctToWrongCount / answers.length;
  return { totalAnswered: answers.length, correctToWrongCount, correctToWrongRate, isHighRisk: correctToWrongRate >= CORRECT_TO_WRONG_HIGH_RISK_RATE };
}

/** Per-label suggested pace, straight from the spec's own worked examples
 * (mục IV/IX) where it gives a number — every other seeded label falls back
 * to a generic phrasing with no time target (see buildAdvancedHandoffNotes),
 * rather than guessing a number the spec never gave. */
const STRATEGIC_LABEL_TARGET_SECONDS: Partial<Record<string, number>> = {
  "not-stated": 45,
  inference: 60,
  "phonetic-distractor-intent": 25,
  "double-triple-passage-synthesis": 70,
};

/** Latest fully submitted Attempt (any test) — the Mock Test attempt used
 * as the stamina-curve/switch-risk source for a fresh I→A handoff. */
async function getLatestSubmittedAttemptId(userId: string): Promise<string | null> {
  const attempt = await db.attempt.findFirst({
    where: { userId, status: "SUBMITTED" },
    orderBy: { submittedAt: "desc" },
    select: { id: true },
  });
  return attempt?.id ?? null;
}

/**
 * "Ba lưu ý chiến lược cá nhân" (spec mục X's handoff profile field) —
 * template-generated (not an LLM call, same style as level-gate.ts's own
 * recordLevelAdvance handoff line), built from the top weakest
 * STRATEGIC_LABEL SkillMastery rows plus the latest Mock Test's stamina
 * curve/answer-switch signals. Returns at most 3 lines, weakest label first.
 */
export async function buildAdvancedHandoffNotes(userId: string): Promise<string[]> {
  const weakStrategic = await getWeakestDimensions(userId, 3, "STRATEGIC_LABEL");
  const titleBySlug = new Map(
    weakStrategic.length > 0
      ? (await db.strategicLabel.findMany({ where: { slug: { in: weakStrategic.map((w) => w.dimensionKey) } }, select: { slug: true, title: true } })).map(
          (l) => [l.slug, l.title] as const
        )
      : []
  );

  const notes: string[] = weakStrategic.map((w) => {
    const title = titleBySlug.get(w.dimensionKey) ?? w.dimensionKey;
    const targetSec = STRATEGIC_LABEL_TARGET_SECONDS[w.dimensionKey];
    const pct = Math.round(w.masteryScore * 100);
    return targetSec
      ? `${title}: đang đạt ${pct}%, cố gắng loại suy trong khoảng ${targetSec} giây/câu, không quay lại nếu đã vượt thời gian.`
      : `${title}: đang đạt ${pct}%, cần loại suy đáp án nhiễu cẩn thận hơn trước khi chọn.`;
  });

  const latestAttemptId = await getLatestSubmittedAttemptId(userId);
  if (latestAttemptId && notes.length < 3) {
    const curve = await computeStaminaCurve(latestAttemptId);
    if (curve?.hasPerformanceCliff) {
      notes.push(
        `Hiệu suất giảm ${Math.round((curve.cliffDropRatio ?? 0) * 100)}% ở khối thời gian cuối bài Mock Test gần nhất — phân bổ lại thời gian, tránh dồn quá nhiều cho câu khó ở cuối bài.`
      );
    }
  }
  if (latestAttemptId && notes.length < 3) {
    const switchRisk = await detectAnswerSwitchRisk(latestAttemptId);
    if (switchRisk?.isHighRisk) {
      notes.push(
        `Tỷ lệ đổi đáp án từ đúng sang sai ở mức ${Math.round(switchRisk.correctToWrongRate * 100)}% trong bài Mock Test gần nhất — dấu hiệu "ảo giác tự tin", nên tin vào lựa chọn đầu tiên khi đã có bằng chứng rõ ràng.`
      );
    }
  }

  return notes.slice(0, 3);
}
