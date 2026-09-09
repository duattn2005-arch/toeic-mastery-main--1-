"use client";

import { useSequentialTour } from "@/hooks/use-tour-driver";
import { TOUR_IDS } from "@/lib/constants/tour";

/** Reading onboarding tour — welcome modal + spotlight on the Part 5 card,
 * both on `/reading`. The card itself is `skill-hub-view.tsx` (shared with
 * Listening's hub), which only stamps the `data-tour` anchor when
 * `basePath === "reading"` and the item is Part 5. */
export function ReadingTour() {
  useSequentialTour(TOUR_IDS.READING, [
    {
      title: "👋 Chào mừng đến trang Reading!",
      description: "Khám phá ngân hàng hàng câu hỏi bám sát đề thi thật. Tự do chọn ôn luyện theo từng Part để tiết kiệm thời gian.",
      nextBtnText: "Tiếp tục",
      noProgress: true,
    },
    {
      element: '[data-tour="reading-part5-card"]',
      title: "🎯 Bắt đầu luyện tập!",
      description: "Chọn ngay Part bạn muốn tập trung ôn luyện. Thanh màu tím sẽ hiển thị độ chính xác ngay sau khi làm bài",
      nextBtnText: "Đã hiểu",
      side: "bottom",
      align: "start",
    },
  ]);

  return null;
}
