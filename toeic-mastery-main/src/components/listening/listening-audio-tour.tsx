"use client";

import { useSequentialTour } from "@/hooks/use-tour-driver";
import { TOUR_IDS } from "@/lib/constants/tour";

/** Listening tour, part 3 of 3 (final) — spotlight on the audio player's
 * speed-control row. Mounted from `exam-question-panel.tsx` only for a real
 * Listening question in the actual exam runner — never from Mistake
 * Practice or Quick Study, which reuse the same audio player elsewhere. */
export function ListeningAudioTour() {
  useSequentialTour(
    TOUR_IDS.LISTENING,
    [
      {
        element: '[data-tour="listening-audio-speed"]',
        title: "🎧 Tùy chỉnh tốc độ nghe",
        description: "Tăng/giảm tốc độ phát (0.75x – 1.5x) hoặc tua lại 5s để rèn luyện tai nghe theo từng cấp độ.",
        nextBtnText: "Bắt đầu làm bài",
        side: "top",
        align: "start",
      },
    ],
    { startAt: 2 }
  );

  return null;
}
