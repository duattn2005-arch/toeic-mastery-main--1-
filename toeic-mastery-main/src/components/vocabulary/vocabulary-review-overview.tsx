"use client";

import * as React from "react";
import { ArrowLeft, ChevronDown, Star, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toggleSaveWordAction } from "@/lib/actions/dictionary";
import { cn } from "@/lib/utils";
import type { StudyItem } from "@/lib/services/study-game";

type SortMode = "stats" | "original" | "alphabetical";

const SORT_LABEL: Record<SortMode, string> = {
  stats: "Thông số của bạn",
  original: "Thứ tự gốc",
  alphabetical: "Bảng chữ cái",
};

function playAudio(item: StudyItem) {
  if (item.audioUrl) {
    new Audio(item.audioUrl).play().catch(() => {});
    return;
  }
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(item.term));
  }
}

function WordRow({ item, starred, onToggleStar }: { item: StudyItem; starred: boolean; onToggleStar: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3.5 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{item.term}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-muted-foreground">
          {item.meaningVi}
          {item.partOfSpeech && <span className="ml-1 italic">({item.partOfSpeech})</span>}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button type="button" onClick={onToggleStar} aria-label={starred ? "Bỏ đánh dấu" : "Đánh dấu cần ôn"}>
          <Star className={cn("size-4", starred ? "fill-warning text-warning" : "text-muted-foreground")} />
        </button>
        <button type="button" onClick={() => playAudio(item)} aria-label="Phát âm" className="text-muted-foreground hover:text-foreground">
          <Volume2 className="size-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Quizlet-style "study set" overview shown before reviewing again — lets the
 * learner see what they got wrong/haven't confidently learned yet before
 * picking whether to redo everything or just the shaky ones. Shared by every
 * vocabulary study surface (20-day path, topic study, saved words, the daily
 * review queue) — each caller just supplies its own `items`/`starredTerms`.
 */
export function VocabularyReviewOverview({
  title,
  items,
  starredTerms,
  onStartReview,
  onBack,
}: {
  title: string;
  items: StudyItem[];
  starredTerms: string[];
  onStartReview: (items: StudyItem[]) => void;
  onBack?: () => void;
}) {
  const [sortMode, setSortMode] = React.useState<SortMode>("stats");
  const [starred, setStarred] = React.useState<Set<string>>(() => new Set(starredTerms.map((t) => t.toLowerCase())));

  function toggleStar(item: StudyItem) {
    const key = item.term.toLowerCase();
    setStarred((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    void toggleSaveWordAction(item.term);
  }

  const needsReview = items.filter((i) => starred.has(i.term.toLowerCase()));
  const known = items.filter((i) => !starred.has(i.term.toLowerCase()));

  const alphabetical = [...items].sort((a, b) => a.term.localeCompare(b.term));

  return (
    <div className="flex flex-col gap-5">
      {onBack && (
        <button type="button" onClick={onBack} className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Quay lại
        </button>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {title} ({items.length})
        </h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              {SORT_LABEL[sortMode]} <ChevronDown className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(Object.keys(SORT_LABEL) as SortMode[]).map((mode) => (
              <DropdownMenuItem key={mode} onSelect={() => setSortMode(mode)}>
                {SORT_LABEL[mode]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {sortMode === "stats" ? (
        <div className="flex flex-col gap-5">
          {needsReview.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-warning">Cần ôn lại ({needsReview.length})</p>
              <p className="mb-2 text-xs text-muted-foreground">Những từ bạn từng làm sai hoặc chưa nhớ chắc — nên ôn lại trước.</p>
              <div className="rounded-2xl border border-border bg-card">
                {needsReview.map((item) => (
                  <WordRow key={item.id} item={item} starred={starred.has(item.term.toLowerCase())} onToggleStar={() => toggleStar(item)} />
                ))}
              </div>
            </div>
          )}
          {known.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-success">Đã thuộc ({known.length})</p>
              <div className="mt-2 rounded-2xl border border-border bg-card">
                {known.map((item) => (
                  <WordRow key={item.id} item={item} starred={starred.has(item.term.toLowerCase())} onToggleStar={() => toggleStar(item)} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card">
          {(sortMode === "alphabetical" ? alphabetical : items).map((item) => (
            <WordRow key={item.id} item={item} starred={starred.has(item.term.toLowerCase())} onToggleStar={() => toggleStar(item)} />
          ))}
        </div>
      )}

      <div className="sticky bottom-4 flex flex-wrap justify-center gap-2 rounded-2xl border border-border bg-card/95 p-3 shadow-soft backdrop-blur-sm">
        <Button variant="outline" onClick={() => onStartReview(needsReview)} disabled={needsReview.length === 0}>
          Ôn từ chưa nhớ ({needsReview.length})
        </Button>
        <Button onClick={() => onStartReview(items)}>Ôn tập lại tất cả</Button>
      </div>
    </div>
  );
}
