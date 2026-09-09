"use client";

import * as React from "react";
import type { MascotState } from "@/components/mascot/types";

const ENCOURAGE_EVERY = 10;
const INACTIVITY_MS = 60_000;
const ENCOURAGE_DURATION_MS = 4000;
const CHECK_INTERVAL_MS = 5000;

/**
 * Derives the exam mascot's state from real activity rather than a fixed
 * schedule: "studying" by default, a brief "encouraging" pop every 10
 * answered questions, and "reminder" if nothing has happened for a minute
 * (no answer, flag, or question change). `notifyInteraction` should be
 * called from every one of those actions.
 */
export function useExamMascotState(answeredCount: number, hydrated: boolean) {
  const [state, setState] = React.useState<MascotState>("studying");
  // 0 (not a real timestamp) until the mount effect below sets it — reading
  // the clock belongs in an effect/handler, not as a ref's initial render value.
  const lastInteractionRef = React.useRef(0);
  const prevAnsweredRef = React.useRef(answeredCount);
  const encourageTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    lastInteractionRef.current = Date.now();
  }, []);

  const notifyInteraction = React.useCallback(() => {
    lastInteractionRef.current = Date.now();
    setState((s) => (s === "reminder" ? "studying" : s));
  }, []);

  React.useEffect(() => {
    const prev = prevAnsweredRef.current;
    prevAnsweredRef.current = answeredCount;
    if (answeredCount > prev && answeredCount % ENCOURAGE_EVERY === 0) {
      setState("encouraging");
      if (encourageTimeoutRef.current) clearTimeout(encourageTimeoutRef.current);
      encourageTimeoutRef.current = setTimeout(() => setState("studying"), ENCOURAGE_DURATION_MS);
    }
  }, [answeredCount]);

  React.useEffect(() => {
    if (!hydrated) return;
    const interval = setInterval(() => {
      if (Date.now() - lastInteractionRef.current > INACTIVITY_MS) {
        setState((s) => (s === "encouraging" ? s : "reminder"));
      }
    }, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [hydrated]);

  React.useEffect(
    () => () => {
      if (encourageTimeoutRef.current) clearTimeout(encourageTimeoutRef.current);
    },
    []
  );

  return { mascotState: state, notifyInteraction };
}
