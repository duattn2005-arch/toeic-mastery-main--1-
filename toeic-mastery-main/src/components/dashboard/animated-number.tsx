"use client";

import * as React from "react";

/** Counts up from 0 to `value` on mount (ease-out, ~1s) so XP/score numbers
 * feel like they're reacting rather than just being printed statically. */
export function AnimatedNumber({ value, durationMs = 900 }: { value: number; durationMs?: number }) {
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    let raf = 0;
    const start = performance.now();

    function tick(now: number) {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.round(eased * value));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs]);

  return <>{display}</>;
}
