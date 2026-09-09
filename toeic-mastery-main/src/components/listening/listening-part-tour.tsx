"use client";

import { useSequentialTour } from "@/hooks/use-tour-driver";
import { TOUR_IDS } from "@/lib/constants/tour";

/** Listening tour, part 2 of 3 — spotlight on the "MẸO LÀM BÀI" tip box.
 * Only mounted by `part-detail-view.tsx` when `meta.skill === "LISTENING"`
 * (that same component is shared with Reading's part pages). */
export function ListeningPartTour() {
  useSequentialTour(
    TOUR_IDS.LISTENING,
    [
      {
        element: '[data-tour="listening-tips"]',
        title: "💡 Bí kíp & Mẹo tránh bẫy",
        description:
          "Đọc kỹ mẹo làm bài trước khi thi! Hệ thống tổng hợp các bẫy phát âm thường gặp, từ khóa nhận diện và chiến thuật làm bài độc quyền cho từng Part giúp bạn tự tin đạt điểm tối đa.",
        nextBtnText: "Tiếp tục →",
        side: "bottom",
        align: "start",
      },
    ],
    { startAt: 1, isFinalStep: false }
  );

  return null;
}
