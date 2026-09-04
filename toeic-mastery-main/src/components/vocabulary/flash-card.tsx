import type { ReviewRating } from "@/lib/services/spaced-repetition";

/** Shared across every place a word gets self-rated (flashcard-browse
 * first-time learning and the daily review queue, both via FlashcardBrowse;
 * Quick Study) — same 4 buckets, same labels/colors, so the scheduling
 * model reads as one consistent system. */
export const RATING_BUTTONS: { rating: ReviewRating; label: string; className: string }[] = [
  { rating: "AGAIN", label: "Học lại", className: "bg-destructive text-destructive-foreground hover:bg-destructive/90" },
  { rating: "HARD", label: "Khó", className: "bg-warning text-warning-foreground hover:bg-warning/90" },
  { rating: "GOOD", label: "Dễ", className: "bg-info text-info-foreground hover:bg-info/90" },
  { rating: "EASY", label: "Đã thuộc", className: "bg-success text-success-foreground hover:bg-success/90" },
];
