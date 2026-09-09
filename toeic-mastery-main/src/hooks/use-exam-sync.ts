"use client";

import * as React from "react";
import { useExamStore, type ExamAnswerState } from "@/store/exam-store";

interface LocalSnapshot {
  answers: Record<string, ExamAnswerState>;
  remainingSec: number;
  currentIndex: number;
  savedAt: number;
}

function localKey(attemptId: string) {
  return `toeic-mastery:exam:${attemptId}`;
}

/** Read a previously-saved local snapshot — used at mount to survive a
 * refresh even before the periodic server sync has caught up. */
export function loadLocalSnapshot(attemptId: string): LocalSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(localKey(attemptId));
    return raw ? (JSON.parse(raw) as LocalSnapshot) : null;
  } catch {
    return null;
  }
}

const SYNC_INTERVAL_MS = 8000;

/**
 * Keeps a full local snapshot on every state change (survives refresh /
 * offline) and periodically pushes unsynced answers to the server whenever
 * the browser is online. Retries automatically on the next interval tick or
 * the `online` event if a push fails.
 */
export function useExamSync(attemptId: string) {
  const hydrated = useExamStore((s) => s.hydrated);
  const answers = useExamStore((s) => s.answers);
  const remainingSec = useExamStore((s) => s.remainingSec);
  const currentIndex = useExamStore((s) => s.currentIndex);
  const markSynced = useExamStore((s) => s.markSynced);

  React.useEffect(() => {
    // Before hydration, the store still holds its pre-load defaults
    // (remainingSec: 0, no answers). Persisting that would poison the local
    // snapshot a brand-new attempt reads back on its very next mount —
    // `Math.min(0, realRemainingSec)` in the hydration effect always wins,
    // permanently zeroing the timer for an attempt that never actually ran out.
    if (!hydrated) return;
    try {
      const snapshot: LocalSnapshot = { answers, remainingSec, currentIndex, savedAt: Date.now() };
      localStorage.setItem(localKey(attemptId), JSON.stringify(snapshot));
    } catch {
      // localStorage unavailable (private mode / quota) — server sync still runs.
    }
  }, [attemptId, hydrated, answers, remainingSec, currentIndex]);

  React.useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;

    async function flush() {
      if (typeof navigator !== "undefined" && !navigator.onLine) return;

      const state = useExamStore.getState();
      const unsynced = Object.entries(state.answers).filter(([, a]) => !a.isSynced);

      try {
        const res = await fetch(`/api/attempts/${attemptId}/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            remainingSec: state.remainingSec,
            currentQuestionIndex: state.currentIndex,
            answers: unsynced.map(([questionId, a]) => ({
              questionId,
              selectedLabel: a.selectedLabel,
              isFlagged: a.isFlagged,
            })),
          }),
          keepalive: true,
        });
        if (res.ok && !cancelled) {
          for (const [questionId] of unsynced) markSynced(questionId);
        }
      } catch {
        // Offline or request failed — stays queued, retried on next tick.
      }
    }

    const interval = setInterval(flush, SYNC_INTERVAL_MS);
    window.addEventListener("online", flush);
    window.addEventListener("beforeunload", flush);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("online", flush);
      window.removeEventListener("beforeunload", flush);
    };
  }, [attemptId, hydrated, markSynced]);
}
