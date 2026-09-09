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
 * explanation) in Practice mode — Pro is unlimited. Per TOEIC part (Part
 * 1-7), not a flat total, so working through one part doesn't eat into the
 * others' allowance. */
export const FREE_ANSWER_REVEALS_PER_PART_PER_DAY = 20;

/** Free-tier cap on how many saved questions can be selected in one "Học
 * lại" (practice again) session from Đã lưu — Pro is unlimited. Enforced
 * client-side only (SavedQuestionsManager disables further checkboxes past
 * this): the runner it feeds is a purely local, unscored practice loop (no
 * Attempt/AttemptAnswer row, no server round-trip per question), so there's
 * no mutating request to gate server-side the way dictionary lookups or
 * answer reveals are. */
export const FREE_SAVED_QUESTIONS_RETRY_LIMIT = 20;

/**
 * AI Mentor chat itself is open to every plan — Free and Pro both get the
 * same conversational interface and can ask anything, unlimited. The one
 * gated surface is the "next step" learning-path suggestion (the assistant
 * proactively recommending what to study next, or the quick-action button
 * that asks for it directly): Free gets a bounded number of those per day
 * before being nudged to upgrade; Pro is unlimited. See
 * src/lib/services/mentor/mentor-access.ts.
 */
export const FREE_MENTOR_NEXT_STEPS_PER_DAY = 4;
export const FREE_MENTOR_SUGGESTED_ITEMS = 4;
