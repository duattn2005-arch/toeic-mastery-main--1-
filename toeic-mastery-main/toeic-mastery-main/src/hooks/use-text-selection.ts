"use client";

import * as React from "react";

export interface SelectionInfo {
  text: string;
  rect: DOMRect;
}

// Single words only — DictionaryService.lookup() rejects anything containing
// a space (dictionaryapi.dev's endpoint is per-word, not per-phrase, so
// multi-word lookups mostly 404 anyway), so allowing a 1-3 word selection
// here only produced a guaranteed "not found" for 2-3 word selections.
const WORD_PATTERN = /^[A-Za-z][A-Za-z'-]*$/;

function isInsideEditable(node: Node | null): boolean {
  let el: Element | null = node instanceof Element ? node : node?.parentElement ?? null;
  while (el) {
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || (el as HTMLElement).isContentEditable) return true;
    if (el.hasAttribute("data-no-dictionary")) return true;
    el = el.parentElement;
  }
  return false;
}

/**
 * Detects a single-word English selection anywhere on the page (outside form
 * fields) and exposes its bounding rect for anchoring a floating popup.
 * Debounced against `selectionchange`, which otherwise fires on every
 * character while dragging.
 */
export function useTextSelection(enabled: boolean) {
  const [selection, setSelection] = React.useState<SelectionInfo | null>(null);

  const clear = React.useCallback(() => setSelection(null), []);

  React.useEffect(() => {
    if (!enabled) return;

    let timeout: ReturnType<typeof setTimeout>;

    function evaluate() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        setSelection(null);
        return;
      }

      const text = sel.toString().trim().replace(/\s+/g, " ");
      if (!text || text.length > 40 || !WORD_PATTERN.test(text)) {
        setSelection(null);
        return;
      }

      if (isInsideEditable(sel.anchorNode)) {
        setSelection(null);
        return;
      }

      const rect = sel.getRangeAt(0).getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        setSelection(null);
        return;
      }

      setSelection({ text, rect });
    }

    function onSelectionChange() {
      clearTimeout(timeout);
      timeout = setTimeout(evaluate, 220);
    }

    document.addEventListener("selectionchange", onSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", onSelectionChange);
      clearTimeout(timeout);
    };
  }, [enabled]);

  return { selection, clear };
}
