"use client";

import { useSequentialTour } from "@/hooks/use-tour-driver";
import { TOUR_IDS } from "@/lib/constants/tour";

/** Grammar onboarding tour — welcome modal + spotlight on the "Nouns" topic
 * card, both on `/grammar`. `grammar/page.tsx` stamps the `data-tour` anchor
 * on whichever card's `topic.slug === "nouns"` (see prisma/seed-data/grammar.ts). */
export function GrammarTour() {
  useSequentialTour(TOUR_IDS.GRAMMAR, [
    {
      title: "👋 Chào mừng đến trang Ngữ pháp!",
      description: "Đây là nơi tổng hợp toàn bộ các chủ điểm ngữ pháp trọng tâm nhất giúp bạn xây dựng nền tảng vững chắc.",
      nextBtnText: "Tiếp tục",
      noProgress: true,
    },
    {
      element: '[data-tour="grammar-topic-nouns"]',
      title: "📚 Chọn chủ đề để học",
      description: "Bấm vào thẻ bất kỳ để xem nhanh lý thuyết và thực hành trắc nghiệm. Mọi đáp án đều được giải thích chi tiết",
      nextBtnText: "Đã hiểu",
      side: "bottom",
      align: "start",
    },
  ]);

  return null;
}
