"use client";

import * as React from "react";
import { toast } from "sonner";
import { DICTIONARY_HINT_MAX_SHOWN, DICTIONARY_HINT_STORAGE_KEY } from "@/lib/constants/tour";

/**
 * Nudges the learner toward the "select any English word to look it up"
 * dictionary feature — not a `driver.js` tour (it isn't anchored to one
 * element; the feature applies to text anywhere on the page), just a
 * `sonner` toast reusing the same localStorage view-counter pattern as
 * `welcome-offer-modal.tsx`. Shown at most `DICTIONARY_HINT_MAX_SHOWN`
 * times total across the whole app, then never again. Called from every
 * study/practice runner (`ExamRunner`, `QuizMode`, `FlashcardBrowse`,
 * `MistakePracticeRunner`, `QuickStudyRunner`) so it surfaces during actual
 * study sessions, where selecting a word is most useful.
 */
export function useDictionaryHintNudge() {
  React.useEffect(() => {
    try {
      const count = Number(localStorage.getItem(DICTIONARY_HINT_STORAGE_KEY) ?? "0");
      if (count >= DICTIONARY_HINT_MAX_SHOWN) return;
      localStorage.setItem(DICTIONARY_HINT_STORAGE_KEY, String(count + 1));
      toast.info("💡 Mẹo: Bôi đen (chọn) bất kỳ từ tiếng Anh nào trên trang để tra nghĩa nhanh ngay lập tức!");
    } catch {
      // localStorage unavailable — fail open, the tip just won't show.
    }
  }, []);
}
