import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface YouTubeTrack {
  id: string; // YouTube video id
  url: string;
  title: string;
  thumbnailUrl: string;
}

interface AmbientState {
  masterVolume: number;
  playlist: YouTubeTrack[];
  currentIndex: number;
  setMasterVolume: (v: number) => void;
  addTrack: (track: YouTubeTrack) => void;
  removeTrack: (id: string) => void;
  setCurrentIndex: (i: number) => void;
}

/**
 * Client-only convenience state for the ambient-sound/YouTube widget — a
 * volume level and a small link playlist, not learning data, so plain
 * localStorage persistence (no server sync) is enough. Which ambient sounds
 * are currently *playing* deliberately isn't persisted here: browsers block
 * audio from starting without a fresh user gesture, so restoring "these were
 * on" after a reload would just show active-looking buttons that aren't
 * actually making sound until clicked again — worse than starting silent.
 */
export const useAmbientStore = create<AmbientState>()(
  persist(
    (set) => ({
      masterVolume: 0.5,
      playlist: [],
      currentIndex: 0,
      setMasterVolume: (v) => set({ masterVolume: v }),
      addTrack: (track) =>
        set((state) => {
          const existingIndex = state.playlist.findIndex((t) => t.id === track.id);
          if (existingIndex !== -1) return { currentIndex: existingIndex };
          const playlist = [...state.playlist, track];
          return { playlist, currentIndex: playlist.length - 1 };
        }),
      removeTrack: (id) =>
        set((state) => {
          const playlist = state.playlist.filter((t) => t.id !== id);
          return { playlist, currentIndex: Math.min(state.currentIndex, Math.max(0, playlist.length - 1)) };
        }),
      setCurrentIndex: (i) => set({ currentIndex: i }),
    }),
    { name: "toeic-mastery-ambient" }
  )
);
