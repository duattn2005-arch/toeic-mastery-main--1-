import type { TestPart } from "@/generated/prisma/enums";
import { PART_META } from "@/lib/constants/toeic";

export interface PartAccuracy {
  part: TestPart;
  accuracy: number; // 0-1
  attempted: number;
}

export interface RecommendationInput {
  partAccuracies: PartAccuracy[];
  vocabularyMistakeRate: number; // 0-1, share of recent wrong answers tied to vocab gaps
}

export interface Recommendation {
  title: string;
  description: string;
  href: string;
  priority: number;
}

const MIN_SAMPLE_SIZE = 5;
const WEAK_THRESHOLD = 0.6;

function hrefForPart(part: TestPart): string {
  const meta = PART_META[part];
  return meta.skill === "LISTENING" ? `/listening/${meta.slug}` : `/reading/${meta.slug}`;
}

/**
 * Rule-based recommendations — no ML/LLM call. Flags any part with a real
 * sample size (>= MIN_SAMPLE_SIZE attempts) scoring below WEAK_THRESHOLD,
 * ranked weakest-first, plus a vocabulary nudge when mistakes skew lexical.
 */
export function generateRecommendations(input: RecommendationInput): Recommendation[] {
  const recs: Recommendation[] = [];

  const weakParts = input.partAccuracies
    .filter((p) => p.attempted >= MIN_SAMPLE_SIZE && p.accuracy < WEAK_THRESHOLD)
    .sort((a, b) => a.accuracy - b.accuracy);

  for (const p of weakParts) {
    const meta = PART_META[p.part];
    recs.push({
      title: `Luyện tập ${meta.label}`,
      description: `Độ chính xác hiện tại ${Math.round(p.accuracy * 100)}% trên ${p.attempted} câu — thấp hơn mức mục tiêu 60%.`,
      href: hrefForPart(p.part),
      priority: 1 - p.accuracy,
    });
  }

  if (input.vocabularyMistakeRate > 0.3) {
    recs.push({
      title: "Ôn lại từ vựng",
      description: `Khoảng ${Math.round(input.vocabularyMistakeRate * 100)}% câu sai gần đây liên quan đến từ vựng chưa nắm vững.`,
      href: "/vocabulary/review",
      priority: input.vocabularyMistakeRate,
    });
  }

  if (recs.length === 0) {
    recs.push({
      title: "Làm một đề thi thử đầy đủ",
      description: "Chưa đủ dữ liệu để phân tích điểm yếu — hãy hoàn thành thêm bài luyện tập.",
      href: "/practice",
      priority: 0,
    });
  }

  return recs.sort((a, b) => b.priority - a.priority).slice(0, 5);
}
