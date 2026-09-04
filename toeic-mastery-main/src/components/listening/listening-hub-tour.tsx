"use client";

import { useSequentialTour } from "@/hooks/use-tour-driver";
import { TOUR_IDS } from "@/lib/constants/tour";

/** Listening tour, part 1 of 3 — welcome modal on `/listening`. Continues on
 * `/listening/part-N` (`listening-part-tour.tsx`) and inside a real
 * Listening question's audio player (`listening-audio-tour.tsx`), all
 * sharing this `tourId`. */
export function ListeningHubTour() {
  useSequentialTour(
    TOUR_IDS.LISTENING,
    [
      {
        title: "👋 Chào mừng đến trang Listening!",
        description: "Nơi bạn luyện nghe chuyên sâu từ Part 1 đến Part 4 với ngân hàng đề bám sát thi thật. Hãy cùng khám phá!",
        nextBtnText: "KHÁM PHÁ",
        noProgress: true,
      },
    ],
    { isFinalStep: false }
  );

  return null;
}
