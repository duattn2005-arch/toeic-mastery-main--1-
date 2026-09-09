"use client";

import { useSequentialTour } from "@/hooks/use-tour-driver";
import { TOUR_IDS } from "@/lib/constants/tour";

/** History tour 1/2 ("Giao diện chính") — welcome modal + spotlight on the
 * attempts list, both on `/history`. Fully independent from the result-page
 * mini-tour in `history-result-tour.tsx` (separate `tourId`, own "x/2"
 * count), matching the copy spec's two unrelated mini-tours. */
export function HistoryTour() {
  useSequentialTour(TOUR_IDS.HISTORY_LIST, [
    {
      title: "👋 Chào mừng đến Lịch sử làm bài!",
      description:
        "Xem lại các bài luyện tập bạn đã hoàn thành cùng thời gian, chế độ làm bài và kết quả, giúp bạn theo dõi quá trình học tập.",
      nextBtnText: "Tiếp tục",
      noProgress: true,
    },
    {
      element: '[data-tour="history-list-items"]',
      title: "📋 Xem lại bài đã làm",
      description: "Bấm vào một bài bất kỳ để xem lại kết quả, số câu đúng – sai và chi tiết từng câu hỏi.",
      nextBtnText: "Đã hiểu",
      side: "top",
      align: "start",
    },
  ]);

  return null;
}
