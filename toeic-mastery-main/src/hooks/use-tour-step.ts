"use client";

import * as React from "react";
import type { TourId } from "@/lib/constants/tour";

interface TourStepState {
  step: number;
  done: boolean;
}

export interface UseTourStepResult {
  /** Whether `step` is the next unseen step of this tour right now — false
   * before the localStorage read resolves, once the tour is done/skipped,
   * or when a different step is next. */
  isActive: (step: number) => boolean;
  /** Records that `toStep` is the next step to show (persisted so a reload
   * mid cross-page tour resumes instead of restarting). */
  advance: (toStep: number) => void;
  /** Marks the whole tour done — used both for the "Bỏ qua" button (skip
   * forever) and for the tour's real final step (finishing counts as done
   * too), matching how welcome-offer-modal.tsx treats its own flag. */
  skip: () => void;
}

/** Ephemeral, write-once onboarding-tour progress. Same localStorage +
 * try/catch fail-open pattern as welcome-offer-modal.tsx's view counter —
 * this doesn't need zustand's cross-component sync since exactly one tour
 * component reads/writes a given tourId at a time. */
export function useTourStep(tourId: TourId | string): UseTourStepResult {
  const stepKey = `tour_${tourId}_step`;
  const doneKey = `tour_${tourId}_done`;
  const [state, setState] = React.useState<TourStepState | null>(null);

  React.useEffect(() => {
    let next: TourStepState = { step: 0, done: false };
    try {
      const done = localStorage.getItem(doneKey) === "true";
      const rawStep = Number(localStorage.getItem(stepKey));
      const step = Number.isFinite(rawStep) && rawStep >= 0 ? rawStep : 0;
      next = { step, done };
    } catch {
      // localStorage unavailable — fail open, same as welcome-offer-modal.tsx.
    }
    // One-time sync with the browser's localStorage, not app state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(next);
  }, [doneKey, stepKey]);

  const isActive = React.useCallback((step: number) => state !== null && !state.done && state.step === step, [state]);

  const advance = React.useCallback(
    (toStep: number) => {
      setState({ step: toStep, done: false });
      try {
        localStorage.setItem(stepKey, String(toStep));
      } catch {
        // Fail open — the tour just won't resume correctly after a reload.
      }
    },
    [stepKey]
  );

  const skip = React.useCallback(() => {
    setState((prev) => ({ step: prev?.step ?? 0, done: true }));
    try {
      localStorage.setItem(doneKey, "true");
    } catch {
      // Fail open — worst case the tour reappears once more.
    }
  }, [doneKey]);

  return { isActive, advance, skip };
}
