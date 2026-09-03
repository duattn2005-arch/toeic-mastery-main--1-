"use client";

import * as React from "react";
import { Pause, Play, RotateCcw, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SPEEDS = [0.75, 1, 1.25, 1.5];

/**
 * Fallback listening player for questions that don't have a produced audio
 * file yet — reads the transcript aloud with the browser's built-in speech
 * synthesis (Web Speech API) instead of leaving the question silent.
 */
export function TtsAudioPlayer({
  text,
  allowReplay = true,
  className,
}: {
  text: string;
  allowReplay?: boolean;
  className?: string;
}) {
  const [speaking, setSpeaking] = React.useState(false);
  const [speed, setSpeed] = React.useState(1);
  const [playCount, setPlayCount] = React.useState(0);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const exhausted = !allowReplay && playCount >= 1;

  function speak() {
    if (!supported || exhausted) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = speed;
    utterance.onend = () => {
      setSpeaking(false);
      setPlayCount((c) => c + 1);
    };
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  function stop() {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  React.useEffect(() => () => window.speechSynthesis?.cancel(), []);

  if (!supported) {
    return <p className={cn("text-xs text-muted-foreground", className)}>Trình duyệt không hỗ trợ đọc audio.</p>;
  }

  return (
    <div className={cn("flex flex-col gap-2 rounded-2xl border border-dashed border-border bg-card p-3.5", className)}>
      <div className="flex items-center gap-3">
        <Button type="button" size="icon" onClick={speaking ? stop : speak} disabled={exhausted}>
          {speaking ? <Pause className="size-4" /> : <Play className="size-4" />}
        </Button>
        <Button type="button" size="icon" variant="ghost" onClick={speak} disabled={exhausted} aria-label="Nghe lại">
          <RotateCcw className="size-4" />
        </Button>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Volume2 className="size-3.5" /> Giọng đọc trình duyệt (chưa có file audio thật)
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        {SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSpeed(s)}
            className={cn(
              "rounded-md px-1.5 py-0.5 text-[11px] font-medium",
              speed === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            )}
          >
            {s}x
          </button>
        ))}
      </div>
      {!allowReplay && (
        <p className="text-[11px] text-muted-foreground">
          {exhausted ? "Bạn đã nghe hết lượt cho câu này (chế độ thi)." : "Chế độ thi: chỉ nghe được 1 lần."}
        </p>
      )}
    </div>
  );
}
