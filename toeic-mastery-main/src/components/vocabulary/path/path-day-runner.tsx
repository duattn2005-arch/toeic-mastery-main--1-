"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpenCheck, Grid3x3, ListChecks, Loader2, PartyPopper, RotateCcw, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfettiBurst } from "@/components/shared/confetti-burst";
import { cn } from "@/lib/utils";
import type { StudyItem } from "@/lib/services/study-game";
import { FlashcardBrowse } from "@/components/study-game/flashcard-browse";
import { QuizMode } from "@/components/study-game/quiz-mode";
import { MatchingGame } from "@/components/study-game/matching-game";
import { VocabularyReviewOverview } from "@/components/vocabulary/vocabulary-review-overview";
import { logStudySessionAction, practiceVocabularyWordAction } from "@/lib/actions/vocabulary";
import { completePathStepAction } from "@/lib/actions/vocabulary-path";

const STEPS = [
  { step: 1 as const, label: "Học", icon: BookOpenCheck },
  { step: 2 as const, label: "Luyện tập", icon: Grid3x3 },
  { step: 3 as const, label: "Kiểm tra", icon: ListChecks },
];

export function PathDayRunner({
  dayId,
  dayNumber,
  tierLabel,
  totalDays,
  initialStepsCompleted,
  initialStars,
  items,
  starredTerms,
}: {
  dayId: string;
  dayNumber: number;
  tierLabel: string;
  totalDays: number;
  initialStepsCompleted: number;
  initialStars: number;
  items: StudyItem[];
  starredTerms: string[];
}) {
  const router = useRouter();
  const [activeStep, setActiveStep] = React.useState<1 | 2 | 3 | null>(
    initialStepsCompleted >= 3 ? null : ((Math.min(initialStepsCompleted + 1, 3)) as 1 | 2 | 3)
  );
  const [stepsCompleted, setStepsCompleted] = React.useState(initialStepsCompleted);
  const [stars, setStars] = React.useState(initialStars);
  const [pending, setPending] = React.useState(false);
  const [reviewItems, setReviewItems] = React.useState<StudyItem[] | null>(null);
  const [showOverview, setShowOverview] = React.useState(false);
  // Mirrors the star/unstar side effect FlashcardBrowse/QuizMode trigger
  // server-side, so the overview's counts update immediately instead of
  // waiting on a slow remote round-trip + router.refresh() to catch up.
  const [localStarOverrides, setLocalStarOverrides] = React.useState<Record<string, boolean>>({});
  const startedAtRef = React.useRef<number | null>(null);

  const effectiveStarredTerms = React.useMemo(() => {
    const set = new Set(starredTerms.map((t) => t.toLowerCase()));
    for (const [term, starred] of Object.entries(localStarOverrides)) {
      if (starred) set.add(term);
      else set.delete(term);
    }
    return [...set];
  }, [starredTerms, localStarOverrides]);

  const wrongItems = items.filter((i) => effectiveStarredTerms.includes(i.term.toLowerCase()));

  // async + awaited-by-QuizMode (not fire-and-forget) so a quiz's burst of
  // per-word writes at completion time survives even if the user navigates
  // away moments after seeing the results screen.
  const handleItemResult = React.useCallback(
    async (itemId: string, rating: Parameters<typeof practiceVocabularyWordAction>[1]) => {
      await practiceVocabularyWordAction(itemId, rating);
      const term = items.find((i) => i.id === itemId)?.term.toLowerCase();
      if (!term) return;
      // Step 3 (quiz) stars on anything but a perfect first try; every other
      // flow (self-rated flashcards) stars only on "Học lại" — same rule
      // FlashcardBrowse/QuizMode apply server-side (see their own files).
      const shouldStar = activeStep === 3 ? rating !== "EASY" : rating === "AGAIN";
      setLocalStarOverrides((prev) => ({ ...prev, [term]: shouldStar }));
    },
    [items, activeStep]
  );

  function beginStep(step: 1 | 2 | 3) {
    startedAtRef.current = Date.now();
    setActiveStep(step);
  }

  async function finishStep(step: 1 | 2 | 3, quizResult?: { correct: number; total: number }) {
    setPending(true);
    if (startedAtRef.current !== null) {
      const elapsedSec = Math.round((Date.now() - startedAtRef.current) / 1000);
      void logStudySessionAction(elapsedSec);
      startedAtRef.current = null;
    }
    const result = await completePathStepAction(dayId, step, quizResult);
    if (result.stepsCompleted !== undefined) setStepsCompleted(result.stepsCompleted);
    if (result.stars !== undefined) setStars(result.stars);
    setActiveStep(step < 3 ? ((step + 1) as 1 | 2 | 3) : null);
    setPending(false);
    router.refresh();
  }

  const dayComplete = stepsCompleted >= 3;

  function finishReview() {
    setReviewItems(null);
    setShowOverview(true);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/vocabulary" className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Lộ trình 20 ngày
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          Ngày {dayNumber} <span className="text-muted-foreground">/ {totalDays}</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          {tierLabel} · {items.length} từ
        </p>
      </div>

      {reviewItems ? (
        <FlashcardBrowse items={reviewItems} onFinish={finishReview} onItemResult={handleItemResult} />
      ) : showOverview ? (
        <VocabularyReviewOverview
          key={effectiveStarredTerms.join(",")}
          title={`Từ vựng Ngày ${dayNumber}`}
          items={items}
          starredTerms={effectiveStarredTerms}
          onStartReview={(list) => setReviewItems(list)}
          onBack={() => setShowOverview(false)}
        />
      ) : activeStep === null && dayComplete ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-success/30 bg-success/10 p-8 text-center">
          <ConfettiBurst />
          <span className="flex size-16 items-center justify-center rounded-full bg-success/20 text-success">
            <PartyPopper className="size-8" />
          </span>
          <div>
            <p className="text-xl font-bold">Hoàn thành Ngày {dayNumber}!</p>
            <div className="mt-2 flex items-center justify-center gap-1">
              {[1, 2, 3].map((n) => (
                <Star key={n} className={cn("size-6", n <= stars ? "fill-warning text-warning" : "text-muted-foreground/30")} />
              ))}
            </div>
          </div>

          {wrongItems.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Bạn có <strong className="text-foreground">{wrongItems.length}</strong>/{items.length} từ chưa nhớ chắc — hãy ôn tập lại.
            </p>
          )}

          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={() => setShowOverview(true)}>
              <RotateCcw className="size-4" /> Ôn tập lại
            </Button>
            <Button asChild variant="outline">
              <Link href="/vocabulary">Về lộ trình</Link>
            </Button>
            {dayNumber < totalDays && (
              <Button asChild>
                <Link href={`/vocabulary/path/day/${dayNumber + 1}`}>Ngày tiếp theo →</Link>
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            {STEPS.map(({ step, label, icon: Icon }) => {
              const done = stepsCompleted >= step;
              const active = activeStep === step;
              return (
                <div
                  key={step}
                  className={cn(
                    "flex flex-1 items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium",
                    done && "border-success/40 bg-success/10 text-success",
                    active && !done && "border-primary/40 bg-accent",
                    !active && !done && "border-border text-muted-foreground"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{label}</span>
                </div>
              );
            })}
          </div>

          {pending ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Đang lưu tiến độ...</p>
            </div>
          ) : activeStep === null ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 px-6 py-10 text-center">
              <p className="text-sm text-muted-foreground">Bắt đầu bước tiếp theo để tiếp tục.</p>
              <Button onClick={() => beginStep((Math.min(stepsCompleted + 1, 3)) as 1 | 2 | 3)}>Tiếp tục</Button>
            </div>
          ) : (
            <>
              {activeStep === 1 && <FlashcardBrowse items={items} onFinish={() => void finishStep(1)} onItemResult={handleItemResult} />}
              {activeStep === 2 && <MatchingGame items={items} onFinish={() => void finishStep(2)} onItemResult={handleItemResult} />}
              {activeStep === 3 && (
                <QuizMode items={items} onFinish={(result) => void finishStep(3, result)} onItemResult={handleItemResult} />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
