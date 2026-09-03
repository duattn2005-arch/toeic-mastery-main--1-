"use client";

import { useSequentialTour } from "@/hooks/use-tour-driver";
import { TOUR_IDS } from "@/lib/constants/tour";

/** History tour 2/2 ("Giao diện Kết quả bài làm") — spotlight on the score
 * overview then the question review list, both on `/history/[attemptId]`.
 * No welcome step and a separate `tourId` from `history-tour.tsx` — the
 * copy spec treats these as two unrelated mini-tours, each with its own
 * "x/2" count. */
export function HistoryResultTour() {
  useSequentialTour(TOUR_IDS.HISTORY_RESULT, [
    {
      element: '[data-tour="history-result-score"]',
      title: "📊 Theo dõi kết quả của bạn",
      description:
        "Xem nhanh số câu đúng, câu sai, câu bỏ qua, thời gian làm bài và độ chính xác để đánh giá kết quả sau mỗi lần luyện tập.",
      nextBtnText: "Tiếp tục",
      side: "bottom",
      align: "start",
    },
    {
      element: '[data-tour="history-result-questions"]',
      title: "💡 Ôn lại từ lỗi sai",
      description: "Bấm vào từng câu để xem lại đáp án và phần giải thích, từ đó biết mình sai ở đâu và cải thiện cho lần làm bài tiếp theo.",
      nextBtnText: "Xong",
      side: "top",
      align: "start",
    },
  ]);

  return null;
}
