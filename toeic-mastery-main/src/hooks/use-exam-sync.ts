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
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalSnapshot;
    // Backfill answers saved by an older build that predates the decision-
    // log/timing fields — a stale snapshot must never crash hydration or
    // turn answerChangeCount into NaN.
    for (const key of Object.keys(parsed.answers)) {
      const a = parsed.answers[key];
      parsed.answers[key] = {
        selectedLabel: a.selectedLabel,
        isFlagged: a.isFlagged,
        isSynced: a.isSynced,
        initialSelectedLabel: a.initialSelectedLabel ?? null,
        answerChangeCount: a.answerChangeCount ?? 0,
        timeSpentMs: a.timeSpentMs ?? 0,
        syncedTimeMs: a.syncedTimeMs ?? 0,
      };
    }
    return parsed;
  } catch {
    return null;
  }
}

const SYNC_INTERVAL_MS = 8000;

/**
 * Keeps a full local snapshot on every state change (survives refresh /
 * offline) and periodically pushes unsynced answers to the server whenever
 * the browser is online. Retries automatically on the next interval tick or
 * the `online` event if a push fails. Returns `flushNow` so a caller that's
 * about to navigate away in-app (e.g. the "Thoát" button — a client-side
 * route change, so neither the interval nor `beforeunload` is guaranteed to
 * have just run) can push the exact remainingSec/answers at that instant
 * instead of leaving up to SYNC_INTERVAL_MS of it unsynced.
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

  const settleCurrentQuestionTime = useExamStore((s) => s.settleCurrentQuestionTime);

  const flush = React.useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;

    // Fold in live time on whatever question is currently open before
    // reading state — otherwise the question being actively viewed never
    // reports its growing timeSpentMs until the learner navigates away.
    settleCurrentQuestionTime();
    const state = useExamStore.getState();
    // A question needs syncing if its answer/flag changed (isSynced) OR
    // its settled time grew past what was last pushed — a question the
    // learner revisits without changing the answer still needs its extra
    // time reported.
    const toSync = Object.entries(state.answers).filter(([, a]) => !a.isSynced || a.timeSpentMs > a.syncedTimeMs);

    try {
      const res = await fetch(`/api/attempts/${attemptId}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          remainingSec: state.remainingSec,
          currentQuestionIndex: state.currentIndex,
          answers: toSync.map(([questionId, a]) => ({
            questionId,
            selectedLabel: a.selectedLabel,
            isFlagged: a.isFlagged,
            initialSelectedLabel: a.initialSelectedLabel,
            answerChangeCount: a.answerChangeCount,
            timeSpentDeltaSec: Math.max(0, Math.round((a.timeSpentMs - a.syncedTimeMs) / 1000)),
          })),
        }),
        keepalive: true,
      });
      if (res.ok) {
        for (const [questionId, a] of toSync) markSynced(questionId, a.timeSpentMs);
      }
    } catch {
      // Offline or request failed — stays queued, retried on next tick.
    }
  }, [attemptId, markSynced, settleCurrentQuestionTime]);

  React.useEffect(() => {
    if (!hydrated) return;
    const interval = setInterval(flush, SYNC_INTERVAL_MS);
    window.addEventListener("online", flush);
    window.addEventListener("beforeunload", flush);
    return () => {
      clearInterval(interval);
      window.removeEventListener("online", flush);
      window.removeEventListener("beforeunload", flush);
    };
  }, [hydrated, flush]);

  return { flushNow: flush };
}
