"use client";

import * as React from "react";
import { Check, Loader2, PartyPopper, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ConfettiBurst } from "@/components/shared/confetti-burst";
import { cn } from "@/lib/utils";
import { buildQuiz, type QuizQuestion, type StudyItem } from "@/lib/services/study-game";
import type { ReviewRating } from "@/lib/services/spaced-repetition";
import { ensureSavedWordAction, unsaveWordIfExistsAction } from "@/lib/actions/dictionary";
import { useDictionaryHintNudge } from "@/hooks/use-dictionary-hint-nudge";

/** Wrong-attempt count within THIS quiz session -> the same rating buckets
 * self-rated flashcards use. Never-correct (wrong on every attempt, capped
 * at MAX_ATTEMPTS_PER_ITEM) must map to AGAIN, not HARD — HARD still
 * increments `repetitions` toward "isLearned", which would silently mark a
 * word mastered purely from being answered wrong every single time. */
function ratingForWrongCount(wrongCount: number): ReviewRating {
  if (wrongCount === 0) return "EASY";
  if (wrongCount <= 2) return "GOOD";
  return "AGAIN";
}

const INTERVAL_LABEL: Record<ReviewRating, string> = { AGAIN: "Hôm nay", HARD: "1 NGÀY", GOOD: "2 NGÀY", EASY: "4 NGÀY" };

const MAX_ATTEMPTS_PER_ITEM = 3;

interface QueueEntry {
  question: QuizQuestion;
  wrongCount: number;
}

interface ResultRow {
  item: StudyItem;
  rating: ReviewRating;
}

/** Multiple-choice quiz: term shown, four meanings, pick the right one. A
 * word answered wrong is requeued to the back of the session (up to
 * MAX_ATTEMPTS_PER_ITEM total tries) so its final wrong-count reflects how
 * shaky it really was, then the whole session's outcome is applied in one
 * batch — one SRS rating per unique word, shown on the results screen. */
export function QuizMode({
  items,
  onFinish,
  onItemResult,
  autoStar = true,
}: {
  items: StudyItem[];
  onFinish: (result?: { correct: number; total: number }) => void;
  onItemResult?: (itemId: string, rating: ReviewRating) => void | Promise<void>;
  /** Off for Saved Words — see FlashcardBrowse's autoStar doc. */
  autoStar?: boolean;
}) {
  const [queue, setQueue] = React.useState<QueueEntry[]>(() => buildQuiz(items).map((question) => ({ question, wrongCount: 0 })));
  const [index, setIndex] = React.useState(0);
  const [picked, setPicked] = React.useState<number | null>(null);
  const [firstTryCorrect, setFirstTryCorrect] = React.useState(0);
  const [results, setResults] = React.useState<ResultRow[]>([]);
  const [applying, setApplying] = React.useState(false);
  const appliedRef = React.useRef(false);

  useDictionaryHintNudge();

  const totalUnique = items.length;
  const current = queue[index];
  const done = index >= queue.length;

  React.useEffect(() => {
    if (!done || appliedRef.current) return;
    appliedRef.current = true;
    setApplying(true);
    // Awaited as one Promise.all instead of N fire-and-forget calls — a
    // burst of ~15-20 unawaited writes fired the instant a quiz finishes is
    // exactly the kind that silently never lands if the learner closes the
    // tab moments later (very natural right after "Cả nhà vỗ tay!"). Every
    // write still starts concurrently, so this costs no extra time; it just
    // keeps the "Tiếp tục" button disabled until they've actually landed.
    void (async () => {
      await Promise.all(
        results.map(async (row) => {
          await onItemResult?.(row.item.id, row.rating);
          if (!autoStar) return;
          // "Làm sai" (wrongCount > 0, i.e. anything but the perfect EASY
          // bucket) -> starred into Đã lưu for later review; answered right
          // first try -> no longer needs it.
          if (row.rating === "EASY") await unsaveWordIfExistsAction(row.item.term);
          else await ensureSavedWordAction(row.item.term);
        })
      );
      setApplying(false);
    })();
  }, [done, results, onItemResult, autoStar]);

  function pick(optionIndex: number) {
    if (picked !== null || !current) return;
    setPicked(optionIndex);
    if (optionIndex === current.question.correctIndex && current.wrongCount === 0) {
      setFirstTryCorrect((s) => s + 1);
    }
  }

  function next() {
    const wasCorrect = picked === current.question.correctIndex;
    if (wasCorrect) {
      setResults((r) => [...r, { item: current.question.item, rating: ratingForWrongCount(current.wrongCount) }]);
    } else {
      const wrongCount = current.wrongCount + 1;
      if (wrongCount >= MAX_ATTEMPTS_PER_ITEM) {
        setResults((r) => [...r, { item: current.question.item, rating: ratingForWrongCount(wrongCount) }]);
      } else {
        setQueue((q) => [...q, { question: current.question, wrongCount }]);
      }
    }
    setPicked(null);
    setIndex((i) => i + 1);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <ConfettiBurst />
        <span className="flex size-16 items-center justify-center rounded-full bg-success/10 text-success">
          <PartyPopper className="size-8" />
        </span>
        <div>
          <h2 className="text-xl font-bold">Cả nhà vỗ tay!</h2>
          <p className="mt-1 text-sm text-muted-foreground">Chúc mừng bạn vừa ôn thêm được {totalUnique} từ!</p>
        </div>

        <div className="w-full max-w-sm divide-y divide-border rounded-2xl border border-border bg-card text-left shadow-soft">
          {results.map((row) => (
            <div key={row.item.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <button
                type="button"
                onClick={() => row.item.audioUrl && new Audio(row.item.audioUrl).play().catch(() => {})}
                className="flex items-center gap-2 text-left"
                disabled={!row.item.audioUrl}
              >
                {row.item.audioUrl && <Volume2 className="size-4 shrink-0 text-primary" />}
                <span>
                  <span className="block text-sm font-semibold">{row.item.term}</span>
                  <span className="block text-xs text-muted-foreground">{row.item.meaningVi}</span>
                </span>
              </button>
              <span className="whitespace-nowrap text-right text-xs text-muted-foreground">
                Ôn lại sau
                <br />
                <span className="text-sm font-bold text-foreground">{INTERVAL_LABEL[row.rating]}</span>
              </span>
            </div>
          ))}
        </div>

        <Button type="button" onClick={() => onFinish({ correct: firstTryCorrect, total: totalUnique })} disabled={applying}>
          {applying && <Loader2 className="size-4 animate-spin" />}
          {applying ? "Đang lưu kết quả..." : "Tiếp tục ôn tập"}
        </Button>
      </div>
    );
  }

  const { question } = current;

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="w-full max-w-sm">
        <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
          <span>
            Đã học {results.length} / {totalUnique} từ
          </span>
          <span>Đúng ngay: {firstTryCorrect}</span>
        </div>
        <Progress value={(results.length / totalUnique) * 100} className="h-1.5" />
      </div>

      <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 text-center shadow-soft">
        <p className="text-xs font-medium text-muted-foreground">Từ này có nghĩa là gì?</p>
        <p className="mt-2 text-3xl font-bold tracking-tight">{question.item.term}</p>
        {question.item.ipa && <p className="mt-1 text-sm text-muted-foreground">/{question.item.ipa}/</p>}
      </div>

      <div className="grid w-full max-w-sm grid-cols-1 gap-2.5">
        {question.options.map((option, i) => {
          const isCorrect = i === question.correctIndex;
          const isPicked = i === picked;
          const revealed = picked !== null;
          return (
            <button
              key={option}
              type="button"
              onClick={() => pick(i)}
              disabled={revealed}
              className={cn(
                "flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                !revealed && "border-border bg-card hover:border-primary/40 hover:bg-accent/40",
                revealed && isCorrect && "border-success bg-success/10 text-success",
                revealed && isPicked && !isCorrect && "border-destructive bg-destructive/10 text-destructive",
                revealed && !isCorrect && !isPicked && "border-border opacity-50"
              )}
            >
              {option}
              {revealed && isCorrect && <Check className="size-4 shrink-0" />}
              {revealed && isPicked && !isCorrect && <X className="size-4 shrink-0" />}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <Button type="button" onClick={next}>
          Câu tiếp theo
        </Button>
      )}
    </div>
  );
}
