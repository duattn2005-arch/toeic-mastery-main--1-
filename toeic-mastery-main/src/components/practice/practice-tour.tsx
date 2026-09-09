"use client";

import { useSequentialTour } from "@/hooks/use-tour-driver";
import { TOUR_IDS } from "@/lib/constants/tour";

/** Practice ("Luyện đề") tour, part 1 of 2 — welcome modal + spotlight on
 * the filter bar, both on `/practice`. Step 3 (mode buttons) lives on
 * `/practice/[testId]` in `practice-mode-tour.tsx`, sharing this same
 * `tourId` so its global step number continues on from here. */
export function PracticeTour() {
  useSequentialTour(
    TOUR_IDS.PRACTICE,
    [
      {
        title: "Chào mừng bạn đến với Phòng Luyện đề!",
        description: "Khám phá kho đề thi TOEIC đa dạng, bám sát cấu trúc đề thi thật — chọn đúng đề phù hợp với trình độ và mục tiêu của bạn.",
        nextBtnText: "Tiếp tục",
        noProgress: true,
      },
      {
        element: '[data-tour="practice-filters"]',
        title: "Bộ lọc thông minh 🔍",
        description:
          "Dễ dàng tìm đề theo độ khó (Dễ – Trung bình – Khó) và theo dõi trạng thái đề chưa làm/đã làm để tối ưu thời gian ôn luyện.",
        nextBtnText: "Đã hiểu, chọn đề ngay",
        side: "bottom",
        align: "start",
      },
    ],
    { isFinalStep: false }
  );

  return null;
}
