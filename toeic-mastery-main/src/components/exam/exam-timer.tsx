"use client";

import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

function formatDuration(totalSec: number) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const mm = m.toString().padStart(2, "0");
  const ss = s.toString().padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function ExamTimer({ remainingSec }: { remainingSec: number }) {
  const isTimeUp = remainingSec <= 0;
  const isWarning = remainingSec <= 300 && remainingSec > 60;
  const isDanger = remainingSec <= 60;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-semibold tabular-nums",
        isDanger
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : isWarning
            ? "border-warning/40 bg-warning/10 text-warning"
            : "border-border bg-muted text-foreground",
        // Only pulse while it's actively counting down through the last
        // minute — a static "Hết giờ" that never stops pulsing reads as a
        // stuck/broken timer, not as "time is up".
        isDanger && !isTimeUp && "animate-pulse"
      )}
    >
      <Clock className="size-4" />
      {/* Practice mode never force-submits at 0 (see exam-runner.tsx), so
         this attempt can otherwise sit at 0 indefinitely — spelling that
         out here instead of a static "00:00" is what actually tells a
         learner "your time budget is up" apart from "this looks frozen". */}
      {isTimeUp ? "Hết giờ" : formatDuration(remainingSec)}
    </div>
  );
}
