"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AudioPlayer } from "@/components/exam/audio-player";
import { AnswerOptionList } from "@/components/exam/answer-option";
import { RATING_BUTTONS } from "@/components/vocabulary/flash-card";
import { practiceVocabularyWordAction } from "@/lib/actions/vocabulary";
import { toggleSaveWordAction, ensureSavedWordAction, unsaveWordIfExistsAction } from "@/lib/actions/dictionary";
import { toggleQuestionBookmarkAction } from "@/lib/actions/bookmarks";
import { completeQuickStudySessionAction } from "@/lib/actions/quick-study";
import type { QuickStudyItem } from "@/lib/data/quick-study";
import type { ReviewRating } from "@/lib/services/spaced-repetition";
import { cn } from "@/lib/utils";

const AUDIO_ONLY_PARTS = new Set(["PART1", "PART2"]);
const AUTO_ADVANCE_MS = 1400;

function formatClock(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function starKeyFor(item: QuickStudyItem): string {
  return item.type === "question" ? `q:${item.id}` : `v:${item.word.toLowerCase()}`;
}

export function QuickStudyRunner({
  items,
  durationSec,
  onRestart,
}: {
  items: QuickStudyItem[];
  durationSec: number;
  onRestart?: () => void;
}) {
  const router = useRouter();
  const [queue, setQueue] = React.useState(() => items.map((item, i) => ({ item, queueKey: `${i}` })));
  const [index, setIndex] = React.useState(0);
  const [remainingSec, setRemainingSec] = React.useState(durationSec);
  const [answers, setAnswers] = React.useState<Record<number, string>>({});
  const [correctCount, setCorrectCount] = React.useState(0);
  const [wrongCount, setWrongCount] = React.useState(0);
  const [vocabReviewed, setVocabReviewed] = React.useState(0);
  const [finished, setFinished] = React.useState(false);
  const [starred, setStarred] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(items.map((item) => [starKeyFor(item), item.type === "question" ? item.bookmarked : item.saved]))
  );
  const finishedRef = React.useRef(false);
  const remainingSecRef = React.useRef(durationSec);
  const requeueCounter = React.useRef(items.length);
  const advanceTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => {
    remainingSecRef.current = remainingSec;
  }, [remainingSec]);

  const finish = React.useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setFinished(true);
    // Elapsed = how much of the countdown was actually used — avoids
    // reaching for wall-clock time (Date.now()) during render/callbacks,
    // which React's purity rule flags as an impure call.
    void completeQuickStudySessionAction(durationSec - remainingSecRef.current);
  }, [durationSec]);

  React.useEffect(() => {
    if (finished) return;
    const interval = setInterval(() => {
      setRemainingSec((s) => {
        if (s <= 1) {
          clearInterval(interval);
          finish();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [finished, finish]);

  React.useEffect(() => () => {
    if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
  }, []);

  const current = queue[index]?.item;

  function advance() {
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
    if (index + 1 >= queue.length) finish();
    else setIndex((i) => i + 1);
  }

  function goBack() {
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
    if (index > 0) setIndex((i) => i - 1);
  }

  function handleAnswer(label: string) {
    if (!current || current.type !== "question" || answers[index] !== undefined) return;
    setAnswers((a) => ({ ...a, [index]: label }));
    if (label === current.correctLabel) setCorrectCount((c) => c + 1);
    else setWrongCount((c) => c + 1);
    advanceTimeoutRef.current = setTimeout(advance, AUTO_ADVANCE_MS);
  }

  function handleVocabRate(rating: ReviewRating) {
    if (!current || current.type !== "vocab") return;
    setVocabReviewed((v) => v + 1);
    void practiceVocabularyWordAction(current.vocabularyWordId, rating);
    if (rating === "AGAIN") {
      void ensureSavedWordAction(current.word);
      const key = `requeue-${requeueCounter.current++}`;
      setQueue((q) => [...q, { item: current, queueKey: key }]);
    } else {
      void unsaveWordIfExistsAction(current.word);
    }
    advance();
  }

  function handleToggleStar() {
    if (!current) return;
    const key = starKeyFor(current);
    const nextValue = !starred[key];
    setStarred((s) => ({ ...s, [key]: nextValue }));
    if (current.type === "question") {
      void toggleQuestionBookmarkAction(current.id);
    } else {
      void toggleSaveWordAction(current.word);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-muted-foreground">Chưa có nội dung để ôn lúc này — hãy quay lại sau.</p>
        <Button asChild variant="outline">
          <Link href="/dashboard">Về trang chủ</Link>
        </Button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center gap-4 py-16 text-center">
        <CheckCircle2 className="size-14 text-success" />
        <h1 className="text-xl font-semibold">Hoàn thành phiên ôn nhanh!</h1>
        <div className="grid w-full grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-border p-3">
            <p className="text-2xl font-bold text-success">{correctCount}</p>
            <p className="text-xs text-muted-foreground">Câu đúng</p>
          </div>
          <div className="rounded-xl border border-border p-3">
            <p className="text-2xl font-bold text-destructive">{wrongCount}</p>
            <p className="text-xs text-muted-foreground">Câu sai</p>
          </div>
          <div className="col-span-2 rounded-xl border border-border p-3">
            <p className="text-2xl font-bold text-primary">{vocabReviewed}</p>
            <p className="text-xs text-muted-foreground">Từ vựng đã ôn</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onRestart ?? (() => router.refresh())}>
            Ôn thêm
          </Button>
          <Button asChild>
            <Link href="/dashboard">Về trang chủ</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isAudioOnly = current.type === "question" && AUDIO_ONLY_PARTS.has(current.part);
  const selected = current.type === "question" ? (answers[index] ?? null) : null;
  const isStarred = starred[starKeyFor(current)] ?? false;

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Câu {index + 1}/{queue.length}
        </p>
        <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
          <Clock className="size-4" /> {formatClock(remainingSec)}
        </span>
      </div>

      {current.type === "question" ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
          {current.imageUrl && (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted">
              <Image src={current.imageUrl} alt="" fill className="object-contain" sizes="(max-width: 768px) 100vw, 480px" />
            </div>
          )}
          {current.audioUrl && <AudioPlayer key={current.id} src={current.audioUrl} />}
          {!isAudioOnly && <p className="text-sm font-medium">{current.prompt}</p>}

          <AnswerOptionList
            options={current.options}
            selectedLabel={selected}
            correctLabel={selected ? current.correctLabel : null}
            onSelect={handleAnswer}
            disabled={selected !== null}
            hideText={isAudioOnly && !selected}
          />

          {selected && <p className="text-xs text-muted-foreground">{current.explanationVi}</p>}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 text-center shadow-soft">
          <span className="rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-medium text-accent-foreground">
            {current.mode === "new" ? "Từ mới" : "Ôn tập"}
          </span>
          <p className="text-2xl font-semibold">{current.word}</p>
          {current.ipa && <p className="text-sm text-muted-foreground">/{current.ipa.replace(/\//g, "")}/</p>}
          <p className="text-base font-medium text-primary">{current.meaningVi}</p>
          {current.exampleEn && <p className="text-sm italic text-muted-foreground">&quot;{current.exampleEn}&quot;</p>}
          <div className="mt-2 grid w-full max-w-xs grid-cols-4 gap-2">
            {RATING_BUTTONS.map((btn) => (
              <button
                key={btn.rating}
                type="button"
                onClick={() => handleVocabRate(btn.rating)}
                className={cn("rounded-xl px-2 py-2.5 text-xs font-semibold transition-colors", btn.className)}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" size="icon" onClick={goBack} disabled={index === 0} aria-label="Câu trước">
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleToggleStar}
          aria-label={isStarred ? "Bỏ lưu" : "Lưu lại để ôn sau"}
        >
          <Star className={cn("size-5", isStarred ? "fill-warning text-warning" : "text-muted-foreground")} />
        </Button>
        <Button type="button" variant="outline" size="icon" onClick={advance} aria-label="Câu tiếp theo">
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
