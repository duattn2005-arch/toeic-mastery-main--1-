"use client";

import * as React from "react";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfettiBurst } from "@/components/shared/confetti-burst";
import { cn } from "@/lib/utils";
import { buildMatchBoard, type StudyItem, type MatchTile } from "@/lib/services/study-game";
import type { ReviewRating } from "@/lib/services/spaced-repetition";

const WRONG_FLASH_MS = 550;

/** Click term/meaning tiles to pair them up — the most "game" of the three
 * modes. A wrong pair briefly flashes red then un-selects; a right pair
 * locks in place. Finishes when every pair is solved. */
export function MatchingGame({
  items,
  onFinish,
  onItemResult,
}: {
  items: StudyItem[];
  onFinish: () => void;
  onItemResult?: (itemId: string, rating: ReviewRating) => void;
}) {
  const [board] = React.useState<MatchTile[]>(() => buildMatchBoard(items));
  const [selected, setSelected] = React.useState<string[]>([]);
  const [wrongPair, setWrongPair] = React.useState<string[]>([]);
  const [solved, setSolved] = React.useState<Set<string>>(new Set());
  const [moves, setMoves] = React.useState(0);

  const totalPairs = board.length / 2;
  const solvedPairs = solved.size / 2;
  const done = solvedPairs === totalPairs;

  function select(tile: MatchTile) {
    if (wrongPair.length > 0 || solved.has(tile.key) || selected.includes(tile.key)) return;

    if (selected.length === 0) {
      setSelected([tile.key]);
      return;
    }

    const firstKey = selected[0];
    const first = board.find((t) => t.key === firstKey)!;
    setMoves((m) => m + 1);

    if (first.itemId === tile.itemId) {
      setSolved((prev) => new Set(prev).add(first.key).add(tile.key));
      setSelected([]);
      onItemResult?.(first.itemId, "GOOD");
    } else {
      setSelected([firstKey, tile.key]);
      setWrongPair([firstKey, tile.key]);
      setTimeout(() => {
        setWrongPair([]);
        setSelected([]);
      }, WRONG_FLASH_MS);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <ConfettiBurst />
        <span className="flex size-16 items-center justify-center rounded-full bg-success/10 text-success">
          <Trophy className="size-8" />
        </span>
        <div>
          <p className="text-2xl font-bold">Ghép xong {totalPairs} cặp!</p>
          <p className="mt-1 text-sm text-muted-foreground">{moves} lượt bấm</p>
        </div>
        <Button type="button" onClick={onFinish}>
          Xong
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-muted-foreground">
        Đã ghép {solvedPairs}/{totalPairs} cặp · {moves} lượt bấm
      </p>
      <div className="grid w-full max-w-2xl grid-cols-2 gap-2.5 sm:grid-cols-4">
        {board.map((tile) => {
          const isSolved = solved.has(tile.key);
          const isSelected = selected.includes(tile.key);
          const isWrong = wrongPair.includes(tile.key);
          return (
            <button
              key={tile.key}
              type="button"
              onClick={() => select(tile)}
              disabled={isSolved}
              className={cn(
                "flex min-h-20 items-center justify-center rounded-xl border p-3 text-center text-sm font-medium transition-all",
                isSolved && "border-success/40 bg-success/10 text-success/70 opacity-60",
                isWrong && "border-destructive bg-destructive/10 text-destructive",
                !isSolved && !isWrong && isSelected && "border-primary bg-accent",
                !isSolved && !isWrong && !isSelected && "border-border bg-card hover:border-primary/40 hover:bg-accent/40"
              )}
            >
              {tile.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
