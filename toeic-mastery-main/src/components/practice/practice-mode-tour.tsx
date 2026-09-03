"use client";

import { useSequentialTour } from "@/hooks/use-tour-driver";
import { TOUR_IDS } from "@/lib/constants/tour";

/** Practice ("Luyện đề") tour, part 2 of 2 — spotlight on the two mode
 * buttons on `/practice/[testId]`, continuing the tour started on
 * `/practice` by `practice-tour.tsx` (same `tourId`, global step 2). */
export function PracticeModeTour() {
  useSequentialTour(
    TOUR_IDS.PRACTICE,
    [
      {
        element: '[data-tour="practice-mode-buttons"]',
        title: "Chọn chế độ luyện tập ⚡",
        description:
          "⏱️ BẮT ĐẦU THI (THI THỬ): Bấm giờ nghiêm ngặt, chỉ xem điểm và đáp án chi tiết sau khi nộp bài.\n💡 Luyện tập (XEM ĐÁP ÁN NGAY): Không áp lực thời gian, kiểm tra đúng/sai và xem lời giải giải thích ngay sau từng câu.",
        nextBtnText: "Vào làm bài",
        side: "top",
        align: "start",
      },
    ],
    { startAt: 2 }
  );

  return null;
}
