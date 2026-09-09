import "server-only";
import { db } from "@/lib/db";
import { generateRecommendations, type PartAccuracy } from "@/lib/services/recommendation";
import type { TestPart } from "@/generated/prisma/enums";

export interface NextStepSuggestion {
  title: string;
  description: string;
  href: string;
  kind: "PART_PRACTICE" | "VOCAB_REVIEW" | "GRAMMAR_LESSON" | "FULL_TEST";
}

/**
 * Powers /api/mentor/next-steps — the FREE-tier guided action ("gợi ý học
 * tiếp"), capped to `maxItems` (4) by the caller. Deliberately built on top
 * of the existing rule-based recommendation.ts rather than an LLM call for
 * the selection itself: FREE requests are unauthenticated-adjacent, high
 * volume, and cost-sensitive, and the underlying signal (SkillMastery) is
 * already exactly what an LLM would need to reason about anyway — no
 * accuracy is lost by skipping the extra API call here. PRO's full chat
 * (mentor-context.ts) is where the LLM adds real value: open-ended
 * conversation, not "rank these four numbers".
 */
export async function getNextStepSuggestions(userId: string, maxItems: number): Promise<NextStepSuggestion[]> {
  const suggestions: NextStepSuggestion[] = [];

  const [partMastery, dueVocabCount, weakGrammar] = await Promise.all([
    db.skillMastery.findMany({
      where: { userId, dimensionType: "PART" },
      select: { dimensionKey: true, masteryScore: true, attemptedCount: true },
    }),
    db.userVocabulary.count({
      where: { userId, origin: "AI_DETECTED_WEAKNESS", isLearned: false, nextReviewDate: { lte: new Date() } },
    }),
    db.skillMastery.findFirst({
      where: { userId, dimensionType: "GRAMMAR_TOPIC", attemptedCount: { gte: 5 }, masteryScore: { lt: 0.6 } },
      orderBy: { masteryScore: "asc" },
      select: { dimensionKey: true, masteryScore: true },
    }),
  ]);

  const partAccuracies: PartAccuracy[] = partMastery.map((m) => ({
    part: m.dimensionKey as TestPart,
    accuracy: m.masteryScore,
    attempted: m.attemptedCount,
  }));

  const ruleBased = generateRecommendations({ partAccuracies, vocabularyMistakeRate: dueVocabCount > 0 ? 1 : 0 });
  for (const rec of ruleBased) {
    suggestions.push({
      title: rec.title,
      description: rec.description,
      href: rec.href,
      kind: rec.href.startsWith("/vocabulary") ? "VOCAB_REVIEW" : rec.href === "/practice" ? "FULL_TEST" : "PART_PRACTICE",
    });
  }

  if (dueVocabCount > 0 && !suggestions.some((s) => s.kind === "VOCAB_REVIEW") && suggestions.length < maxItems) {
    suggestions.push({
      title: "Ôn từ vựng AI phát hiện bạn còn yếu",
      description: `${dueVocabCount} từ đến hạn ôn tập — được tự động thêm sau những câu Reading/Listening bạn làm sai gần đây.`,
      href: "/vocabulary/review",
      kind: "VOCAB_REVIEW",
    });
  }

  if (weakGrammar && suggestions.length < maxItems) {
    const lesson = await db.grammarLesson.findFirst({
      where: { topic: { slug: weakGrammar.dimensionKey } },
      select: { slug: true, title: true },
    });
    if (lesson) {
      suggestions.push({
        title: `Ôn lại ngữ pháp: ${lesson.title}`,
        description: `Độ chính xác gần đây ở chủ điểm này khoảng ${Math.round(weakGrammar.masteryScore * 100)}%.`,
        href: `/grammar/${lesson.slug}`,
        kind: "GRAMMAR_LESSON",
      });
    }
  }

  if (suggestions.length === 0) {
    suggestions.push({
      title: "Làm bài kiểm tra đầu vào",
      description: "Chưa đủ dữ liệu để phân tích điểm yếu — hãy hoàn thành ít nhất một bài luyện tập hoặc đề thi thử.",
      href: "/practice",
      kind: "FULL_TEST",
    });
  }

  return suggestions.slice(0, maxItems);
}
