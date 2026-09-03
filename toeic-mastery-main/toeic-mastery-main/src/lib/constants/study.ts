/**
 * Exam sync fires every 8s while a tab is active (see `useExamSync`). Study
 * time for an attempt is accumulated as the real wall-clock delta between
 * checkpoints (`now - attempt.lastSyncedAt`), not derived from the countdown
 * timer — `allowedDurationSec - remainingSec` is mathematically capped at
 * `allowedDurationSec` and silently drops any time spent past the nominal
 * duration, which PRACTICE mode (no auto-submit) can run past indefinitely.
 *
 * Each delta is capped well above the expected 8s cadence so normal
 * jitter/backgrounding never loses time, but a long gap (laptop asleep, tab
 * left open for hours) doesn't get credited as active study time.
 */
export const MAX_STUDY_SYNC_GAP_SEC = 120;
