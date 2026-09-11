import { create } from "zustand";

interface ListeningAudioState {
  /** Count, not a boolean — AudioPlayer instances can briefly overlap (e.g.
   * a new question's player mounting before the previous one's onPause/
   * unmount fires), so "any TOEIC listening audio currently playing" is
   * `playingCount > 0` rather than a single flag one instance could clobber. */
  playingCount: number;
  increment: () => void;
  decrement: () => void;
}

/**
 * Bridges every `<AudioPlayer>` (Part 1-4 listening audio, wherever it's
 * used — real exams, Mistake Practice, Quick Study) to the background-music
 * widget (`SoundPlayerPopover`) so the two never play over each other,
 * without those components needing to know about one another directly.
 */
export const useListeningAudioStore = create<ListeningAudioState>((set) => ({
  playingCount: 0,
  increment: () => set((s) => ({ playingCount: s.playingCount + 1 })),
  decrement: () => set((s) => ({ playingCount: Math.max(0, s.playingCount - 1) })),
}));
