// Plain constants module (no "server-only") — these numbers are read by both
// server-side limit checks (dictionary-limit.ts, reveal-limit.ts) and
// client-side display text (dictionary-popup-content.tsx,
// dictionary-limit-reached.tsx, exam-question-panel.tsx). Keeping a single
// source here is what the previous hardcoded "10" in the popup text should
// have done — it silently drifted out of sync when the real limit changed
// to 20 elsewhere, showing a wrong number to users for a while.

/** Free-tier daily cap on dictionary lookups via text-selection ("Tra từ
 * khi bôi đen") — Pro is unlimited. */
export const FREE_DICTIONARY_LOOKUPS_PER_DAY = 15;

/** Free-tier daily cap on "Chữa tức thì" (instant reveal-answer-and-
 * explanation) in Practice mode — Pro is unlimited. */
export const FREE_ANSWER_REVEALS_PER_DAY = 10;
