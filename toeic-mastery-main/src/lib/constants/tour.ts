/** Every onboarding-tour id used across the app — a single source of truth
 * for the localStorage keys `use-tour-step.ts` derives (`tour_<id>_step`,
 * `tour_<id>_done`) and for each tour's total step count, so neither value
 * is retyped as a magic string/number across ~15 tour + page files. */
export const TOUR_IDS = {
  DASHBOARD: "dashboard",
  PRACTICE: "practice",
  LISTENING: "listening",
  READING: "reading",
  GRAMMAR: "grammar",
  VOCABULARY: "vocabulary",
  DICTIONARY: "dictionary",
  BOOKMARKS: "bookmarks",
  HISTORY_LIST: "history-list",
  HISTORY_RESULT: "history-result",
} as const;

export type TourId = (typeof TOUR_IDS)[keyof typeof TOUR_IDS];

/** Total numbered (non-welcome) spotlight steps per tour — drives the
 * "Bước i/N" progress text. Bookmarks' real max is 5, but it's trimmed to 3
 * at runtime when the learner has no saved words yet (see bookmarks-tabs.tsx). */
export const TOUR_STEP_COUNT: Record<TourId, number> = {
  [TOUR_IDS.DASHBOARD]: 5,
  [TOUR_IDS.PRACTICE]: 3,
  [TOUR_IDS.LISTENING]: 3,
  [TOUR_IDS.READING]: 2,
  [TOUR_IDS.GRAMMAR]: 2,
  [TOUR_IDS.VOCABULARY]: 3,
  [TOUR_IDS.DICTIONARY]: 2,
  [TOUR_IDS.BOOKMARKS]: 5,
  [TOUR_IDS.HISTORY_LIST]: 2,
  [TOUR_IDS.HISTORY_RESULT]: 2,
};

/** Global (not per-tour) nudge toasting the "select any word to look it up"
 * dictionary feature — shown at most this many times total, ever. */
export const DICTIONARY_HINT_STORAGE_KEY = "dictionary_hint_shown_count";
export const DICTIONARY_HINT_MAX_SHOWN = 2;
