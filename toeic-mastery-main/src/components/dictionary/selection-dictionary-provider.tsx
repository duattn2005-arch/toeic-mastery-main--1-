"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { useTextSelection } from "@/hooks/use-text-selection";
import { useSettingsStore } from "@/store/settings-store";
import { DictionaryPopupContent } from "@/components/dictionary/dictionary-popup-content";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { logDictionaryHistoryAction } from "@/lib/actions/dictionary";

const POPUP_WIDTH = 360;
const POPUP_EST_HEIGHT = 280;
const MOBILE_BREAKPOINT = 640;

export function SelectionDictionaryProvider() {
  const enabled = useSettingsStore((s) => s.dictionaryPopupEnabled);
  const { selection, clear } = useTextSelection(enabled);
  const [isMobile, setIsMobile] = React.useState(false);
  const popupRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function checkWidth() {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    }
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  React.useEffect(() => {
    if (!selection) return;
    void logDictionaryHistoryAction(selection.text, "SELECTION");
  }, [selection]);

  React.useEffect(() => {
    if (!selection || isMobile) return;

    function onScroll() {
      clear();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") clear();
    }
    function onClickOutside(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        clear();
      }
    }

    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [selection, isMobile, clear]);

  if (!selection) return null;

  if (isMobile) {
    return (
      <Sheet open onOpenChange={(open) => !open && clear()}>
        <SheetContent side="bottom" className="max-h-[75vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader className="sr-only">
            <SheetTitle>Từ điển: {selection.text}</SheetTitle>
          </SheetHeader>
          <DictionaryPopupContent word={selection.text} compact={false} onNavigate={clear} />
        </SheetContent>
      </Sheet>
    );
  }

  const { rect } = selection;
  const spaceBelow = window.innerHeight - rect.bottom;
  const showAbove = spaceBelow < POPUP_EST_HEIGHT && rect.top > POPUP_EST_HEIGHT;

  const left = Math.min(Math.max(8, rect.left + rect.width / 2 - POPUP_WIDTH / 2), window.innerWidth - POPUP_WIDTH - 8);
  const top = showAbove ? Math.max(8, rect.top - POPUP_EST_HEIGHT - 10) : rect.bottom + 10;

  return createPortal(
    <div
      ref={popupRef}
      role="dialog"
      aria-label={`Từ điển: ${selection.text}`}
      className="fixed z-[100] animate-in fade-in-0 zoom-in-95 rounded-2xl border border-border bg-popover text-popover-foreground shadow-lg"
      style={{ left, top, width: POPUP_WIDTH }}
    >
      <button
        type="button"
        onClick={clear}
        className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground hover:bg-muted"
        aria-label="Đóng"
      >
        <X className="size-3.5" />
      </button>
      <DictionaryPopupContent word={selection.text} onNavigate={clear} />
    </div>,
    document.body
  );
}
