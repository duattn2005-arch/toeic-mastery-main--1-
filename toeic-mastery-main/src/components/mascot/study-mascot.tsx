"use client";

import * as React from "react";
import Image from "next/image";
import { X, BookOpen, Sparkles, BellRing, type LucideIcon } from "lucide-react";
import { pickMascotMessage } from "@/components/mascot/mascot-messages";
import { useMascotMinimized } from "@/components/mascot/use-mascot-minimized";
import { MentorPopover } from "@/components/mascot/mentor-popover";
import type { MascotState } from "@/components/mascot/types";
import { cn } from "@/lib/utils";

const BADGE_ICON: Record<MascotState, LucideIcon | null> = {
  idle: null,
  studying: BookOpen,
  encouraging: Sparkles,
  success: Sparkles,
  reminder: BellRing,
};

/** Can't swap facial expression per state the way the old hand-drawn SVG
 * mascot did (this is one static photo-real character, not a set of
 * eyes/mouth paths) — a colored ring + a distinct little motion per state
 * stands in for that instead, so "something changed" is still readable at
 * a glance. */
const STATE_RING: Record<MascotState, string> = {
  idle: "ring-border",
  studying: "ring-primary/50",
  encouraging: "ring-primary/60",
  success: "ring-success/60",
  reminder: "ring-warning/60",
};

const STATE_MOTION: Record<MascotState, string> = {
  idle: "",
  studying: "",
  encouraging: "mascot-jump",
  success: "mascot-jump",
  reminder: "mascot-shake",
};

function MascotAvatar({ state, className }: { state: MascotState; className?: string }) {
  return (
    <span
      className={cn(
        "flex items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-card transition-colors duration-300",
        STATE_RING[state],
        STATE_MOTION[state],
        className
      )}
    >
      <Image src="/mascot-avatar.png" alt="" width={64} height={64} className="size-full rounded-full object-cover" priority />
    </span>
  );
}

/** Small, deterministic hash so message variety doesn't depend on an impure
 * `Math.random()` call during render (each mounted instance still gets its
 * own pick, via React's per-instance `useId`). */
function hashToIndex(id: string, mod: number) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % mod;
}

/**
 * Small "study buddy" widget — a corner-anchored rabbit/fox that reflects
 * what's happening (idle/studying/encouraging/success/reminder). Whenever
 * state or message changes, it proactively pops its speech bubble up (jump +
 * fade in), holds a few seconds, then fades itself back out — all via a CSS
 * animation keyed to restart on change, so it never needs a JS timer or
 * permanently blocks page content. Tapping the avatar slides open an AI
 * Mentor chat panel (see MentorPopover) without leaving the current page;
 * the small X that appears on hover minimizes the mascot itself instead.
 */
export function StudyMascot({ state, message }: { state: MascotState; message?: string }) {
  const [minimized, setMinimized] = useMascotMinimized();

  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        aria-label="Hiện trợ lý học tập"
        className="fixed bottom-20 right-4 z-40 flex size-11 items-center justify-center rounded-full border border-border bg-card shadow-soft transition-transform hover:scale-105 lg:bottom-5 lg:right-5"
      >
        <MascotAvatar state="idle" className="size-8" />
      </button>
    );
  }

  return <MascotFace state={state} message={message} onMinimize={() => setMinimized(true)} />;
}

function MascotFace({
  state,
  message,
  onMinimize,
}: {
  state: MascotState;
  message?: string;
  onMinimize: () => void;
}) {
  const id = React.useId();
  const [mentorOpen, setMentorOpen] = React.useState(false);

  const Badge = BADGE_ICON[state];
  const text = message ?? pickMascotMessage(state, hashToIndex(id, 10));
  const cycleKey = `${state}:${message ?? ""}`;

  return (
    <>
      <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2 lg:bottom-5 lg:right-5">
        <div key={cycleKey} className="mascot-bubble-auto max-w-[220px] rounded-2xl rounded-br-sm border border-border bg-card px-3.5 py-2.5 text-xs font-medium leading-relaxed text-foreground shadow-soft">
          {text}
        </div>

        <div className="group relative">
          <button
            type="button"
            onClick={onMinimize}
            aria-label="Ẩn trợ lý học tập"
            className="absolute -top-1.5 -right-1.5 z-10 flex size-5 items-center justify-center rounded-full border border-border bg-card text-muted-foreground opacity-0 shadow-soft transition-opacity group-hover:opacity-100"
          >
            <X className="size-3" />
          </button>

          <button
            type="button"
            onClick={() => setMentorOpen(true)}
            aria-label="Hỏi AI Mentor"
            className="mascot-float relative flex size-16 items-center justify-center rounded-full border border-border bg-card shadow-soft"
          >
            <MascotAvatar key={cycleKey} state={state} className="size-12" />
            {Badge && (
              <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Badge className="size-3" />
              </span>
            )}
            <span
              className="notify-dot absolute right-0.5 bottom-0.5 size-2.5 rounded-full border border-card bg-destructive"
              aria-hidden
            />
          </button>
        </div>
      </div>

      <MentorPopover open={mentorOpen} onOpenChange={setMentorOpen} />
    </>
  );
}
