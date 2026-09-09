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
  const isWarning = remainingSec <= 300 && remainingSec > 60;
  const isDanger = remainingSec <= 60;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-semibold tabular-nums",
        isDanger
          ? "animate-pulse border-destructive/40 bg-destructive/10 text-destructive"
          : isWarning
            ? "border-warning/40 bg-warning/10 text-warning"
            : "border-border bg-muted text-foreground"
      )}
    >
      <Clock className="size-4" />
      {formatDuration(remainingSec)}
    </div>
  );
}
