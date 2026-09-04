"use client";

import { CheckCircle2 } from "lucide-react";
import { WordAudioButton } from "@/components/dictionary/word-audio-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface VocabularyCardWord {
  id: string;
  word: string;
  ipa: string | null;
  partOfSpeech: string | null;
  meaningVi: string;
  exampleEn: string | null;
  audioUrlUs: string | null;
  audioUrlUk: string | null;
  isTracked: boolean;
  isLearned: boolean;
}

export function VocabularyCard({ word }: { word: VocabularyCardWord }) {
  return (
    <div className={cn("flex flex-col gap-2 rounded-2xl border bg-card p-4 shadow-soft", word.isLearned ? "border-success/40" : "border-border")}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-base font-semibold">{word.word}</p>
            {word.partOfSpeech && (
              <Badge variant="secondary" className="text-[10px]">
                {word.partOfSpeech}
              </Badge>
            )}
          </div>
          {word.ipa && <p className="text-xs text-muted-foreground">/{word.ipa.replace(/\//g, "")}/</p>}
        </div>
        {word.isLearned && <CheckCircle2 className="size-4 shrink-0 text-success" />}
      </div>
      <p className="text-sm font-medium text-primary">{word.meaningVi}</p>
      {word.exampleEn && <p className="text-xs italic text-muted-foreground">&quot;{word.exampleEn}&quot;</p>}
      <div className="mt-1 flex gap-1.5">
        <WordAudioButton word={word.word} audioUrl={word.audioUrlUs} region="US" />
        <WordAudioButton word={word.word} audioUrl={word.audioUrlUk} region="UK" />
      </div>
    </div>
  );
}
