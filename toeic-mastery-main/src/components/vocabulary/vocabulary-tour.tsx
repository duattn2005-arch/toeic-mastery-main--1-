"use client";

import { useSequentialTour } from "@/hooks/use-tour-driver";
import { TOUR_IDS } from "@/lib/constants/tour";

/** Vocabulary onboarding tour — welcome modal + spotlight on the path tab
 * bar (`vocabulary-tabs.tsx`) + spotlight on the "Từ vựng của tôi" button
 * (`vocabulary/page.tsx`). Both anchors already sit in the DOM by the time
 * this component's effect runs, regardless of which file renders them. */
export function VocabularyTour() {
  useSequentialTour(TOUR_IDS.VOCABULARY, [
    {
      title: "👋 Chào mừng đến trang Từ vựng!",
      description: "Học theo phương pháp Lặp lại ngắt quãng (Spaced Repetition) — nhắc nhở ôn tập đúng lúc giúp bạn ghi nhớ lâu dài",
      nextBtnText: "Tiếp tục",
      noProgress: true,
    },
    {
      element: '[data-tour="vocabulary-tabs"]',
      title: "🗺️ Lộ trình học đa dạng",
      description: "Chọn lộ trình 20 ngày, học theo chủ đề hoặc theo band điểm để nạp từ vựng hiệu quả nhất.",
      nextBtnText: "Tiếp tục",
      side: "bottom",
      align: "start",
    },
    {
      element: '[data-tour="vocabulary-my-words"]',
      title: "⭐ Xây dựng kho từ cá nhân",
      description: "Bấm vào đây để ôn lại ngay những từ bạn \"Đã lưu\" hoặc chủ động thêm từ mới của riêng mình.",
      nextBtnText: "Đã hiểu",
      side: "bottom",
      align: "end",
    },
  ]);

  return null;
}
