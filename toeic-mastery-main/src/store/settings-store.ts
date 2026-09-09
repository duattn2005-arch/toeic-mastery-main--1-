import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  dictionaryPopupEnabled: boolean;
  audioAutoplay: boolean;
  defaultPlaybackSpeed: number;
  setDictionaryPopupEnabled: (value: boolean) => void;
  setAudioAutoplay: (value: boolean) => void;
  setDefaultPlaybackSpeed: (value: number) => void;
  hydrateFromServer: (settings: { dictionaryPopupEnabled: boolean; audioAutoplay: boolean; defaultPlaybackSpeed: number }) => void;
}

/**
 * Client-side mirror of UserSettings for instant UI feedback (e.g. toggling
 * the dictionary popup with zero network round-trip). The settings page
 * writes through to the database via a Server Action for cross-device sync;
 * this store just avoids a fetch-on-every-render for a value that gates a
 * `selectionchange` listener on every page.
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      dictionaryPopupEnabled: true,
      audioAutoplay: true,
      defaultPlaybackSpeed: 1,
      setDictionaryPopupEnabled: (value) => set({ dictionaryPopupEnabled: value }),
      setAudioAutoplay: (value) => set({ audioAutoplay: value }),
      setDefaultPlaybackSpeed: (value) => set({ defaultPlaybackSpeed: value }),
      hydrateFromServer: (settings) => set(settings),
    }),
    { name: "toeic-mastery-settings" }
  )
);
