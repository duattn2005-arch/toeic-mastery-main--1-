"use client";

import * as React from "react";

interface YTPlayerStateChangeEvent {
  data: number;
}

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  loadVideoById: (videoId: string) => void;
  setVolume: (volume: number) => void;
  destroy: () => void;
}

interface YTPlayerOptions {
  height: string;
  width: string;
  videoId?: string;
  playerVars: Record<string, number>;
  events: {
    onReady?: () => void;
    onStateChange?: (event: YTPlayerStateChangeEvent) => void;
  };
}

interface YTNamespace {
  Player: new (el: HTMLElement, options: YTPlayerOptions) => YTPlayer;
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;

function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT!);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  });
  return apiPromise;
}

/** Thin wrapper around the YouTube IFrame Player API — background/BGM-style
 * playback driven by our own prev/play/next controls rather than YouTube's
 * default UI (playerVars disables controls/branding). The player is kept
 * small but visibly rendered (never display:none or 0x0): a hidden/zero-size
 * iframe can get throttled or silently stop by some browsers, and YouTube's
 * embed terms expect the player to actually be part of the page. */
export function useYouTubePlayer(containerRef: React.RefObject<HTMLDivElement | null>) {
  const playerRef = React.useRef<YTPlayer | null>(null);
  const [ready, setReady] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    loadYouTubeApi().then((YT) => {
      if (cancelled || !containerRef.current) return;
      playerRef.current = new YT.Player(containerRef.current, {
        height: "100%",
        width: "100%",
        playerVars: { controls: 0, disablekb: 1, modestbranding: 1, rel: 0 },
        events: {
          onReady: () => setReady(true),
          onStateChange: (e) => setIsPlaying(e.data === YT.PlayerState.PLAYING),
        },
      });
    });
    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- container ref target never changes
  }, []);

  const loadVideo = React.useCallback((videoId: string) => {
    playerRef.current?.loadVideoById(videoId);
  }, []);
  const play = React.useCallback(() => playerRef.current?.playVideo(), []);
  const pause = React.useCallback(() => playerRef.current?.pauseVideo(), []);
  const setVolume = React.useCallback((volumePercent: number) => playerRef.current?.setVolume(volumePercent), []);

  return { ready, isPlaying, loadVideo, play, pause, setVolume };
}
