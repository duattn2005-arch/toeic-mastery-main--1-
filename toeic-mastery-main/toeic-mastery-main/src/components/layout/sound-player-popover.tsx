"use client";

import * as React from "react";
import {
  AudioLines,
  Bird,
  CloudDrizzle,
  CloudLightning,
  CloudRainWind,
  ExternalLink,
  Flame,
  Pause,
  Play,
  Plus,
  SkipBack,
  SkipForward,
  Turtle,
  Volume2,
  Waves,
  Wind,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAmbientSounds } from "@/hooks/use-ambient-sounds";
import { useYouTubePlayer } from "@/hooks/use-youtube-player";
import { useAmbientStore } from "@/store/ambient-store";
import { extractYouTubeVideoId } from "@/lib/youtube";
import { cn } from "@/lib/utils";
import type { AmbientSoundId } from "@/lib/services/ambient-sound-engine";

const AMBIENT_SOUNDS: { id: AmbientSoundId; label: string; icon: typeof CloudDrizzle }[] = [
  { id: "chillRain", label: "Mưa nhẹ", icon: CloudDrizzle },
  { id: "heavyRain", label: "Mưa to", icon: CloudRainWind },
  { id: "thunder", label: "Sấm sét", icon: CloudLightning },
  { id: "wind", label: "Gió", icon: Wind },
  { id: "ocean", label: "Sóng biển", icon: Waves },
  { id: "bonfire", label: "Lửa trại", icon: Flame },
  { id: "frog", label: "Ếch kêu", icon: Turtle },
  { id: "chirp", label: "Chim hót", icon: Bird },
];

/** Shown pre-added the first time anyone opens the panel, so the YouTube
 * section is never just an empty box — paste a different link to replace
 * it, per the user's request. */
const DEFAULT_YOUTUBE_URL = "https://www.youtube.com/watch?v=9kzE8isXlQY";

export function SoundPlayerPopover() {
  const masterVolume = useAmbientStore((s) => s.masterVolume);
  const setMasterVolume = useAmbientStore((s) => s.setMasterVolume);
  const playlist = useAmbientStore((s) => s.playlist);
  const currentIndex = useAmbientStore((s) => s.currentIndex);
  const setCurrentIndex = useAmbientStore((s) => s.setCurrentIndex);
  const addTrack = useAmbientStore((s) => s.addTrack);
  const removeTrack = useAmbientStore((s) => s.removeTrack);

  const { activeIds, toggle, setVolume } = useAmbientSounds(masterVolume);

  const ytContainerRef = React.useRef<HTMLDivElement>(null);
  const yt = useYouTubePlayer(ytContainerRef);
  const loadedIdRef = React.useRef<string | null>(null);

  const [urlInput, setUrlInput] = React.useState("");
  const [adding, setAdding] = React.useState(false);
  const seededDefaultRef = React.useRef(false);

  const currentTrack = playlist[currentIndex] ?? null;

  // Load whichever track is "current" into the player whenever it changes
  // (new track added, prev/next pressed) — but only once the player is
  // ready and only when the id actually differs, so re-renders don't
  // restart playback from 0.
  React.useEffect(() => {
    if (!yt.ready || !currentTrack) return;
    if (loadedIdRef.current === currentTrack.id) return;
    loadedIdRef.current = currentTrack.id;
    yt.loadVideo(currentTrack.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- yt is stable across renders
  }, [yt.ready, currentTrack?.id]);

  function handleVolumeChange(value: number[]) {
    const v = value[0] / 100;
    setMasterVolume(v);
    setVolume(v);
    yt.setVolume(value[0]);
  }

  const addTrackFromUrl = React.useCallback(
    async (url: string): Promise<boolean> => {
      const res = await fetch(`/api/youtube-oembed?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Không lấy được thông tin video");
      addTrack({ id: data.id, url, title: data.title, thumbnailUrl: data.thumbnailUrl });
      return true;
    },
    [addTrack]
  );

  async function handleAddTrack(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    const videoId = extractYouTubeVideoId(trimmed);
    if (!videoId) {
      toast.error("Không nhận diện được link YouTube này");
      return;
    }

    setAdding(true);
    try {
      await addTrackFromUrl(trimmed);
      setUrlInput("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thêm được video này");
    } finally {
      setAdding(false);
    }
  }

  // Seed the default track the first time the panel is opened with an empty
  // playlist — pasting a different link still replaces/adds to it normally
  // afterward. Triggered by the click that opens the panel (a real user
  // gesture), not on page load, so nothing plays without the user's action.
  function handleOpenChange(open: boolean) {
    if (!open || seededDefaultRef.current || playlist.length > 0) return;
    seededDefaultRef.current = true;
    addTrackFromUrl(DEFAULT_YOUTUBE_URL).catch(() => {
      seededDefaultRef.current = false;
    });
  }

  function playPrev() {
    if (playlist.length === 0) return;
    setCurrentIndex((currentIndex - 1 + playlist.length) % playlist.length);
  }
  function playNext() {
    if (playlist.length === 0) return;
    setCurrentIndex((currentIndex + 1) % playlist.length);
  }
  function togglePlay() {
    if (!currentTrack) return;
    if (yt.isPlaying) yt.pause();
    else yt.play();
  }

  return (
    <>
      {/* The real YT IFrame Player, rendered outside the Popover (which
          Radix unmounts its content for while closed) and outside the
          viewport — so background playback survives closing the panel or
          navigating between pages, instead of stopping every time. Real
          pixel dimensions (not display:none/0x0) so browsers don't throttle
          it as an inactive/invisible element. */}
      <div ref={ytContainerRef} className="fixed -left-[9999px] -top-[9999px] h-[113px] w-[200px]" aria-hidden />

      <Popover onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" size="icon" className="rounded-full" aria-label="Âm thanh nền">
            <AudioLines className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 rounded-2xl border-white/10 bg-[#181530]/95 p-4 text-white shadow-xl backdrop-blur-xl">
        <p className="text-xs font-semibold tracking-wider text-white/50">SOUND</p>
        <div className="mt-2.5 grid grid-cols-4 gap-2">
          {AMBIENT_SOUNDS.map((s) => {
            const active = activeIds.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggle(s.id)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border p-2 text-center text-[10px] leading-tight transition-colors",
                  active ? "border-primary/50 bg-primary/25 text-white shadow-[0_0_0_1px_rgba(124,58,237,0.4)]" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                )}
              >
                <s.icon className="size-4" />
                {s.label}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Volume2 className="size-3.5 shrink-0 text-white/50" />
          <Slider value={[Math.round(masterVolume * 100)]} onValueChange={handleVolumeChange} max={100} className="flex-1" />
        </div>

        <div className="mt-4 border-t border-white/10 pt-3.5">
          <p className="text-xs font-semibold tracking-wider text-white/50">YOUTUBE</p>
          <form onSubmit={handleAddTrack} className="mt-2 flex gap-1.5">
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Dán link YouTube..."
              className="h-8 border-white/10 bg-white/5 text-xs text-white placeholder:text-white/40"
            />
            <Button type="submit" size="icon" className="size-8 shrink-0" disabled={adding}>
              <Plus className="size-3.5" />
            </Button>
          </form>

          <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-white/5 p-2">
            <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black/40">
              {currentTrack && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentTrack.thumbnailUrl} alt="" className="size-full object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              {currentTrack ? (
                <>
                  <p className="truncate text-xs font-medium">{currentTrack.title}</p>
                  <p className="text-[10px] text-white/50">YouTube · {playlist.length} bài</p>
                </>
              ) : (
                <p className="text-[11px] text-white/50">Dán link YouTube ở trên để phát nhạc nền</p>
              )}
            </div>
            {currentTrack && (
              <>
                <a href={currentTrack.url} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white" title="Mở trên YouTube">
                  <ExternalLink className="size-3.5" />
                </a>
                <button type="button" onClick={() => removeTrack(currentTrack.id)} className="text-white/40 hover:text-white" title="Xóa khỏi danh sách">
                  <X className="size-3.5" />
                </button>
              </>
            )}
          </div>

          <div className="mt-2.5 flex items-center justify-center gap-4">
            <button type="button" onClick={playPrev} disabled={playlist.length < 2} className="text-white/70 hover:text-white disabled:opacity-30">
              <SkipBack className="size-4" />
            </button>
            <button
              type="button"
              onClick={togglePlay}
              disabled={!currentTrack}
              className="flex size-9 items-center justify-center rounded-full bg-primary text-white transition-transform hover:scale-105 disabled:opacity-30"
            >
              {yt.isPlaying ? <Pause className="size-4" /> : <Play className="size-4 translate-x-0.5" />}
            </button>
            <button type="button" onClick={playNext} disabled={playlist.length < 2} className="text-white/70 hover:text-white disabled:opacity-30">
              <SkipForward className="size-4" />
            </button>
          </div>
        </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
