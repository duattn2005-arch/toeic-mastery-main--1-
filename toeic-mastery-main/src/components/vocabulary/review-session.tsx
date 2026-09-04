"use client";

import * as React from "react";
import Link from "next/link";
import { BookOpenCheck, Grid3x3, ListChecks, Loader2, PartyPopper, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlashcardBrowse } from "@/components/study-game/flashcard-browse";
import { MatchingGame } from "@/components/study-game/matching-game";
import { QuizMode } from "@/components/study-game/quiz-mode";
import { VocabularyReviewOverview } from "@/components/vocabulary/vocabulary-review-overview";
import { practiceVocabularyWordAction, logStudySessionAction } from "@/lib/actions/vocabulary";
import type { ReviewRating } from "@/lib/services/spaced-repetition";
import type { StudyItem } from "@/lib/services/study-game";
import { cn } from "@/lib/utils";

interface ReviewItem {
  vocabularyWordId: string;
  word: {
    word: string;
    ipa: string | null;
    partOfSpeech: string | null;
    meaningVi: string;
    exampleEn: string | null;
    audioUrlUs: string | null;
    audioUrlUk: string | null;
  };
}

function toStudyItem(item: ReviewItem): StudyItem {
  return {
    id: item.vocabularyWordId,
    term: item.word.word,
    ipa: item.word.ipa,
    partOfSpeech: item.word.partOfSpeech,
    meaningVi: item.word.meaningVi,
    exampleEn: item.word.exampleEn,
    audioUrl: item.word.audioUrlUs ?? item.word.audioUrlUk,
  };
}

const STEPS = [
  { step: 1 as const, label: "Học", icon: BookOpenCheck },
  { step: 2 as const, label: "Luyện tập", icon: Grid3x3 },
  { step: 3 as const, label: "Kiểm tra", icon: ListChecks },
];

/**
 * Same Học/Luyện tập/Kiểm tra flow as the 20-day path's PathDayRunner, reused
 * here for the daily spaced-repetition due queue — same underlying
 * StudyItem-based games (FlashcardBrowse/MatchingGame/QuizMode), just no
 * per-day persistence (there's nothing to resume: a fresh due queue is
 * generated every visit, so `activeStep`/`stepsCompleted` are plain local
 * state, not saved to the server like a path day's step is).
 */
export function ReviewSession({ items, starredTerms }: { items: ReviewItem[]; starredTerms: string[] }) {
  const studyItems = React.useMemo(() => items.map(toStudyItem), [items]);
  const hasItems = studyItems.length > 0;

  const [activeStep, setActiveStep] = React.useState<1 | 2 | 3 | null>(hasItems ? 1 : null);
  const [stepsCompleted, setStepsCompleted] = React.useState(0);
  const [pending, setPending] = React.useState(false);
  const [reviewItems, setReviewItems] = React.useState<StudyItem[] | null>(null);
  const [showOverview, setShowOverview] = React.useState(false);
  const [sessionOverrides, setSessionOverrides] = React.useState<Record<string, boolean>>({});
  const startedAtRef = React.useRef<number | null>(null);

  const effectiveStarredTerms = React.useMemo(() => {
    const base = new Set(starredTerms.map((t) => t.toLowerCase()));
    for (const [term, needsReview] of Object.entries(sessionOverrides)) {
      if (needsReview) base.add(term);
      else base.delete(term);
    }
    return [...base];
  }, [starredTerms, sessionOverrides]);

  function handleItemResult(vocabularyWordId: string, rating: ReviewRating) {
    void practiceVocabularyWordAction(vocabularyWordId, rating);
    const term = studyItems.find((i) => i.id === vocabularyWordId)?.term.toLowerCase();
    if (term) setSessionOverrides((prev) => ({ ...prev, [term]: rating === "AGAIN" }));
  }

  function beginStep(step: 1 | 2 | 3) {
    startedAtRef.current = Date.now();
    setActiveStep(step);
  }

  function finishStep(step: 1 | 2 | 3) {
    setPending(true);
    if (startedAtRef.current !== null) {
      const elapsedSec = Math.round((Date.now() - startedAtRef.current) / 1000);
      void logStudySessionAction(elapsedSec);
      startedAtRef.current = null;
    }
    setStepsCompleted((prev) => Math.max(prev, step));
    if (step < 3) {
      setActiveStep((step + 1) as 1 | 2 | 3);
    } else {
      setActiveStep(null);
    }
    setPending(false);
  }

  function finishReview() {
    setReviewItems(null);
    setShowOverview(true);
  }

  if (!hasItems) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-10 text-center shadow-soft">
        <PartyPopper className="size-10 text-primary" />
        <h2 className="text-lg font-semibold">Không có từ nào cần ôn hôm nay!</h2>
        <p className="text-sm text-muted-foreground">Quay lại vào ngày mai để tiếp tục duy trì streak học tập.</p>
        <div className="mt-2 flex gap-2">
          <Button asChild variant="outline">
            <Link href="/vocabulary/topics">Học thêm từ mới</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard">Về Tổng quan</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (reviewItems) {
    return <FlashcardBrowse items={reviewItems} onFinish={finishReview} onItemResult={handleItemResult} />;
  }

  if (showOverview) {
    return (
      <VocabularyReviewOverview
        key={effectiveStarredTerms.join(",")}
        title="Ôn tập hôm nay"
        items={studyItems}
        starredTerms={effectiveStarredTerms}
        onStartReview={(list) => setReviewItems(list)}
      />
    );
  }

  if (activeStep === null && stepsCompleted >= 3) {
    const needsReviewCount = studyItems.filter((i) => effectiveStarredTerms.includes(i.term.toLowerCase())).length;
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-success/30 bg-success/10 p-8 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-success/20 text-success">
          <PartyPopper className="size-8" />
        </span>
        <p className="text-xl font-bold">Đã ôn xong {studyItems.length} từ hôm nay!</p>
        {needsReviewCount > 0 && (
          <p className="text-sm text-muted-foreground">
            Bạn có <strong className="text-foreground">{needsReviewCount}</strong>/{studyItems.length} từ chưa nhớ chắc — hãy ôn tập lại.
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="outline" onClick={() => setShowOverview(true)}>
            <RotateCcw className="size-4" /> Ôn tập lại
          </Button>
          <Button asChild>
            <Link href="/dashboard">Về Tổng quan</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        {STEPS.map(({ step, label, icon: Icon }) => {
          const done = stepsCompleted >= step;
          const active = activeStep === step;
          return (
            <button
              key={step}
              type="button"
              // Only a completed step can be revisited — "quay lại thẻ" to
              // redo an earlier one, same as clicking it below normally would.
              disabled={!done}
              onClick={() => done && beginStep(step)}
              className={cn(
                "flex flex-1 items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                done && "border-success/40 bg-success/10 text-success hover:bg-success/20",
                active && !done && "border-primary/40 bg-accent",
                !active && !done && "border-border text-muted-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>

      {pending ? (
        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Đang lưu tiến độ...</p>
        </div>
      ) : (
        <>
          {activeStep === 1 && <FlashcardBrowse items={studyItems} onFinish={() => finishStep(1)} onItemResult={handleItemResult} />}
          {activeStep === 2 && <MatchingGame items={studyItems} onFinish={() => finishStep(2)} onItemResult={handleItemResult} />}
          {activeStep === 3 && <QuizMode items={studyItems} onFinish={() => finishStep(3)} onItemResult={handleItemResult} />}
        </>
      )}
    </div>
  );
}
