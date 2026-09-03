"use client";

import * as React from "react";
import { X, BookOpen, Sparkles, BellRing, type LucideIcon } from "lucide-react";
import { RabbitIllustration, FoxIllustration } from "@/components/mascot/mascot-illustration";
import { pickMascotMessage } from "@/components/mascot/mascot-messages";
import { useMascotMinimized } from "@/components/mascot/use-mascot-minimized";
import type { MascotState, MascotCharacter } from "@/components/mascot/types";
import { cn } from "@/lib/utils";

const BADGE_ICON: Record<MascotState, LucideIcon | null> = {
  idle: null,
  studying: BookOpen,
  encouraging: Sparkles,
  success: Sparkles,
  reminder: BellRing,
};

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
 * permanently blocks page content. Tapping the avatar replays the bubble.
 */
export function StudyMascot({
  state,
  character = "rabbit",
  message,
}: {
  state: MascotState;
  character?: MascotCharacter;
  message?: string;
}) {
  const [minimized, setMinimized] = useMascotMinimized();

  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        aria-label="Hiện trợ lý học tập"
        className="fixed bottom-20 right-4 z-40 flex size-11 items-center justify-center rounded-full border border-border bg-card shadow-soft transition-transform hover:scale-105 lg:bottom-5 lg:right-5"
      >
        <RabbitIllustration state="idle" className="size-8" />
      </button>
    );
  }

  return (
    <MascotFace state={state} character={character} message={message} onMinimize={() => setMinimized(true)} />
  );
}

function MascotFace({
  state,
  character,
  message,
  onMinimize,
}: {
  state: MascotState;
  character: MascotCharacter;
  message?: string;
  onMinimize: () => void;
}) {
  const id = React.useId();
  // Bumped on every avatar tap to force a fresh key even when state/message
  // haven't changed, so replaying the bubble always restarts the animation.
  const [replayNonce, setReplayNonce] = React.useState(0);

  const Illustration = character === "fox" ? FoxIllustration : RabbitIllustration;
  const Badge = BADGE_ICON[state];
  const text = message ?? pickMascotMessage(state, hashToIndex(id, 10));
  const cycleKey = `${state}:${message ?? ""}:${replayNonce}`;

  return (
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
          onClick={() => setReplayNonce((n) => n + 1)}
          aria-label="Trợ lý học tập — bấm để xem lại lời nhắn"
          className="mascot-float relative flex size-16 items-center justify-center rounded-full border border-border bg-card shadow-soft"
        >
          <div key={cycleKey} className={cn(state !== "idle" && "mascot-jump")}>
            <Illustration state={state} className="size-12" />
          </div>
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
  );
}
