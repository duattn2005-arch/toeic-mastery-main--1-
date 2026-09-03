"use client";

import * as React from "react";
import { Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const SPEEDS = [0.75, 1, 1.25, 1.5];

function formatTime(sec: number) {
  if (!Number.isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayer({
  src,
  allowReplay = true,
  autoPlay = false,
  className,
  tourAnchor = false,
}: {
  src: string;
  allowReplay?: boolean;
  autoPlay?: boolean;
  className?: string;
  /** Stamps the speed-control row with `data-tour="listening-audio-speed"`
   * for the Listening onboarding tour's 3rd step. Only ever passed from
   * `exam-question-panel.tsx` for a real Listening question — never from
   * the Mistake Practice / Quick Study runners, which reuse this same
   * player outside that tour's flow. */
  tourAnchor?: boolean;
}) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const [current, setCurrent] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [speed, setSpeed] = React.useState(1);
  const [volume, setVolume] = React.useState(1);
  const [muted, setMuted] = React.useState(false);
  const [playCount, setPlayCount] = React.useState(0);

  const exhausted = !allowReplay && playCount >= 1;

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = speed;
  }, [speed]);

  function handlePlayPause() {
    const audio = audioRef.current;
    if (!audio || exhausted) return;
    if (playing) {
      audio.pause();
    } else {
      void audio.play();
    }
  }

  function handleReplay() {
    const audio = audioRef.current;
    if (!audio || (exhausted && playCount >= 1)) return;
    audio.currentTime = 0;
    void audio.play();
  }

  return (
    <div className={cn("flex flex-col gap-2 rounded-2xl border border-border bg-card p-3.5", className)}>
      <audio
        ref={audioRef}
        src={src}
        autoPlay={autoPlay}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setPlayCount((c) => c + 1);
        }}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      />

      <div className="flex items-center gap-3">
        <Button
          type="button"
          size="icon"
          variant={exhausted ? "outline" : "default"}
          onClick={handlePlayPause}
          disabled={exhausted}
          aria-label={playing ? "Tạm dừng" : "Phát"}
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </Button>
        <Button type="button" size="icon" variant="ghost" onClick={handleReplay} disabled={exhausted} aria-label="Nghe lại">
          <RotateCcw className="size-4" />
        </Button>

        <div className="flex flex-1 items-center gap-2">
          <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">{formatTime(current)}</span>
          <Slider
            value={[current]}
            max={duration || 100}
            step={0.1}
            onValueChange={([v]) => {
              if (audioRef.current) audioRef.current.currentTime = v;
            }}
            disabled={exhausted}
            className="flex-1"
          />
          <span className="w-9 shrink-0 text-[11px] tabular-nums text-muted-foreground">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div data-tour={tourAnchor ? "listening-audio-speed" : undefined} className="flex items-center gap-1.5">
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

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              const next = !muted;
              setMuted(next);
              if (audioRef.current) audioRef.current.muted = next;
            }}
            className="text-muted-foreground hover:text-foreground"
            aria-label={muted ? "Bật tiếng" : "Tắt tiếng"}
          >
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
          <Slider
            value={[muted ? 0 : volume]}
            max={1}
            step={0.05}
            onValueChange={([v]) => {
              setVolume(v);
              setMuted(v === 0);
              if (audioRef.current) audioRef.current.volume = v;
            }}
            className="w-20"
          />
        </div>
      </div>

      {!allowReplay && (
        <p className="text-[11px] text-muted-foreground">
          {exhausted ? "Bạn đã nghe hết lượt cho câu này (chế độ thi)." : "Chế độ thi: chỉ nghe được 1 lần."}
        </p>
      )}
    </div>
  );
}
