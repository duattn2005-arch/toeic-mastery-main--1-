"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { WordAudioButton } from "@/components/dictionary/word-audio-button";
import { cn } from "@/lib/utils";
import type { ReviewRating } from "@/lib/services/spaced-repetition";

export interface FlashCardWord {
  word: string;
  ipa: string | null;
  partOfSpeech: string | null;
  meaningVi: string;
  definitionEn: string | null;
  exampleEn: string | null;
  exampleVi: string | null;
  collocations: string[];
  audioUrlUs: string | null;
  audioUrlUk: string | null;
}

/** Shared across every place a word gets self-rated (dedicated review page,
 * flashcard-browse first-time learning, Quick Study) — same 4 buckets, same
 * labels/colors, so the scheduling model reads as one consistent system. */
export const RATING_BUTTONS: { rating: ReviewRating; label: string; className: string }[] = [
  { rating: "AGAIN", label: "Học lại", className: "bg-destructive text-destructive-foreground hover:bg-destructive/90" },
  { rating: "HARD", label: "Khó", className: "bg-warning text-warning-foreground hover:bg-warning/90" },
  { rating: "GOOD", label: "Dễ", className: "bg-info text-info-foreground hover:bg-info/90" },
  { rating: "EASY", label: "Đã thuộc", className: "bg-success text-success-foreground hover:bg-success/90" },
];

export function FlashCard({ word, onRate }: { word: FlashCardWord; onRate: (rating: ReviewRating) => void }) {
  const [flipped, setFlipped] = React.useState(false);

  function handleRate(rating: ReviewRating) {
    onRate(rating);
    setFlipped(false);
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative h-72 w-full max-w-md [perspective:1200px]">
        <motion.div
          className="relative h-full w-full [transform-style:preserve-3d]"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-6 shadow-soft [backface-visibility:hidden]">
            {word.partOfSpeech && (
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-medium text-accent-foreground">{word.partOfSpeech}</span>
            )}
            <p className="text-3xl font-semibold">{word.word}</p>
            {word.ipa && <p className="text-sm text-muted-foreground">/{word.ipa.replace(/\//g, "")}/</p>}
            <div className="mt-1 flex gap-2">
              <WordAudioButton word={word.word} audioUrl={word.audioUrlUs} region="US" />
              <WordAudioButton word={word.word} audioUrl={word.audioUrlUk} region="UK" />
            </div>
            <Button size="sm" variant="outline" className="mt-4" onClick={() => setFlipped(true)}>
              Lật thẻ
            </Button>
          </div>

          <div className="absolute inset-0 flex flex-col justify-center gap-2.5 overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-soft [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <p className="text-lg font-semibold text-primary">{word.meaningVi}</p>
            {word.definitionEn && <p className="text-sm text-foreground/90">{word.definitionEn}</p>}
            {word.exampleEn && (
              <div className="rounded-lg bg-accent/50 p-2.5 text-xs">
                <p className="italic text-foreground/90">&quot;{word.exampleEn}&quot;</p>
                {word.exampleVi && <p className="mt-1 text-muted-foreground">{word.exampleVi}</p>}
              </div>
            )}
            {word.collocations.length > 0 && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Collocations: </span>
                {word.collocations.join(", ")}
              </p>
            )}
            <Button size="sm" variant="ghost" className="mt-1 self-start" onClick={() => setFlipped(false)}>
              Lật lại
            </Button>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {flipped && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="grid w-full max-w-md grid-cols-4 gap-2"
          >
            {RATING_BUTTONS.map((btn) => (
              <button
                key={btn.rating}
                type="button"
                onClick={() => handleRate(btn.rating)}
                className={cn("rounded-xl px-2 py-2.5 text-xs font-semibold transition-colors", btn.className)}
              >
                {btn.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
