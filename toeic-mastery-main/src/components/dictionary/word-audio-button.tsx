"use client";

import * as React from "react";
import { Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

function speak(word: string, lang: "en-US" | "en-GB") {
  if (typeof window === "undefined" || !window.speechSynthesis) return false;
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = lang;
  utterance.rate = 0.9;

  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find((v) => v.lang === lang) ?? voices.find((v) => v.lang.startsWith(lang.slice(0, 2)));
  if (voice) utterance.voice = voice;

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  return true;
}

export function WordAudioButton({
  word,
  audioUrl,
  region,
  className,
}: {
  word: string;
  audioUrl?: string | null;
  region: "US" | "UK";
  className?: string;
}) {
  const [playing, setPlaying] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  function handlePlay(e: React.MouseEvent) {
    e.stopPropagation();
    setPlaying(true);
    if (audioUrl) {
      const audio = audioRef.current ?? new Audio(audioUrl);
      audioRef.current = audio;
      audio.currentTime = 0;
      audio.onended = () => setPlaying(false);
      audio.play().catch(() => {
        speak(word, region === "US" ? "en-US" : "en-GB");
        setPlaying(false);
      });
      return;
    }
    speak(word, region === "US" ? "en-US" : "en-GB");
    window.setTimeout(() => setPlaying(false), 600);
  }

  return (
    <button
      type="button"
      onClick={handlePlay}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-input bg-card px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50",
        playing && "border-primary text-primary",
        className
      )}
      aria-label={`Phát âm ${region}`}
    >
      <Volume2 className="size-3.5" />
      {region}
    </button>
  );
}
