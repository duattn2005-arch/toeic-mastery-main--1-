"use client";

import { useSequentialTour } from "@/hooks/use-tour-driver";
import { TOUR_IDS } from "@/lib/constants/tour";

/** Dictionary onboarding tour — welcome modal + spotlight on the search
 * form, both on `/dictionary`. */
export function DictionaryTour() {
  useSequentialTour(TOUR_IDS.DICTIONARY, [
    {
      title: "👋 Chào mừng đến Từ điển!",
      description: "Tra cứu nhanh nghĩa, phát âm và cách sử dụng của từ vựng TOEIC ngay trên website.",
      nextBtnText: "Tiếp tục",
      noProgress: true,
    },
    {
      element: '[data-tour="dictionary-search"]',
      title: "🔎 Tra từ thật nhanh",
      description: 'Nhập từ tiếng Anh bạn muốn tìm vào ô tìm kiếm và nhấn "Tra cứu" để xem thông tin chi tiết.',
      nextBtnText: "Đã hiểu",
      side: "bottom",
      align: "start",
    },
  ]);

  return null;
}
