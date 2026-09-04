"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Lightbulb, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTextSelection } from "@/hooks/use-text-selection";
import { useSettingsStore } from "@/store/settings-store";
import { DICTIONARY_HINT_STORAGE_KEY, DICTIONARY_HINT_MAX_SHOWN, DICTIONARY_HINT_TUTORIAL_DONE_KEY } from "@/lib/constants/tour";

/**
 * Interactive replacement for the old one-shot toast nudge: a floating,
 * non-blocking card (not a driver.js tour — the feature isn't anchored to
 * one element, it applies to any text on the page) that invites the learner
 * to actually try bôi đen right where they are, watches for a real
 * selection via the same useTextSelection hook SelectionDictionaryProvider
 * uses, and only offers "Đã hiểu" (permanently dismissing itself) once
 * they've completed the gesture themselves.
 *
 * Call from a study/practice runner's top level (same spot the old
 * useDictionaryHintNudge() call lived) and render the returned node
 * anywhere in that component's main JSX branch — it's a fixed-position
 * portal, so placement in the tree doesn't affect layout.
 */
export function useDictionaryHintTutorial(): React.ReactNode {
  const dictionaryEnabled = useSettingsStore((s) => s.dictionaryPopupEnabled);
  const [visible, setVisible] = React.useState(false);
  const [succeeded, setSucceeded] = React.useState(false);
  const { selection } = useTextSelection(dictionaryEnabled && visible);

  React.useEffect(() => {
    // One-way latch: once the learner has made a real selection, stay in
    // the "succeeded" state even after the browser selection itself clears
    // (e.g. they click elsewhere) — never reset back to "waiting".
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (selection) setSucceeded(true);
  }, [selection]);

  React.useEffect(() => {
    if (!dictionaryEnabled) return;
    try {
      if (localStorage.getItem(DICTIONARY_HINT_TUTORIAL_DONE_KEY)) return;
      const count = Number(localStorage.getItem(DICTIONARY_HINT_STORAGE_KEY) ?? "0");
      if (count >= DICTIONARY_HINT_MAX_SHOWN) return;
      localStorage.setItem(DICTIONARY_HINT_STORAGE_KEY, String(count + 1));
      // Deliberate: this is the one-time "check an external store after
      // hydration, then reveal UI" effect React's own docs describe as a
      // legitimate use of setState-in-effect (can't read localStorage
      // during SSR/the first client render without a hydration mismatch).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
    } catch {
      // localStorage unavailable — fail open, the tutorial just won't show.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function dismiss() {
    setVisible(false);
  }

  function acknowledge() {
    try {
      localStorage.setItem(DICTIONARY_HINT_TUTORIAL_DONE_KEY, "1");
    } catch {
      // Best-effort — worst case it can show again up to DICTIONARY_HINT_MAX_SHOWN.
    }
    setVisible(false);
  }

  if (!visible || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-label="Mẹo tra từ nhanh"
      className="animate-in fade-in-0 slide-in-from-bottom-4 fixed bottom-4 left-1/2 z-[90] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-primary/30 bg-popover p-4 text-popover-foreground shadow-lg sm:right-4 sm:left-auto sm:translate-x-0"
    >
      <button
        type="button"
        onClick={dismiss}
        className="absolute top-2 right-2 rounded-full p-1 text-muted-foreground hover:bg-muted"
        aria-label="Đóng"
      >
        <X className="size-3.5" />
      </button>

      {succeeded ? (
        <div className="flex flex-col gap-3 pr-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-5 shrink-0 text-success" />
            <p className="text-sm font-semibold">Chính xác!</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Bạn đã biết cách tra từ nhanh rồi — cứ bôi đen bất kỳ từ tiếng Anh nào trên trang để tra nghĩa ngay lập tức.
          </p>
          <Button size="sm" onClick={acknowledge} className="self-start">
            Đã hiểu
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 pr-5">
          <div className="flex items-center gap-2">
            <Lightbulb className="size-5 shrink-0 text-primary" />
            <p className="text-sm font-semibold">Mẹo: Tra từ nhanh</p>
          </div>
          <p className="text-xs text-muted-foreground">Hãy thử bôi đen (chọn) một từ tiếng Anh bất kỳ ngay trên trang này để xem cách hoạt động!</p>
        </div>
      )}
    </div>,
    document.body
  );
}
