"use client";

import * as React from "react";
import { toast } from "sonner";

import Link from "next/link";
import { PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FlashCard, type FlashCardWord } from "@/components/vocabulary/flash-card";
import { FlashcardBrowse } from "@/components/study-game/flashcard-browse";
import { VocabularyReviewOverview } from "@/components/vocabulary/vocabulary-review-overview";
import { reviewVocabularyAction, practiceVocabularyWordAction, logStudySessionAction } from "@/lib/actions/vocabulary";
import { ensureSavedWordAction, unsaveWordIfExistsAction } from "@/lib/actions/dictionary";
import type { ReviewRating } from "@/lib/services/spaced-repetition";
import type { StudyItem } from "@/lib/services/study-game";

interface ReviewItem {
  userVocabularyId: string;
  vocabularyWordId: string;
  word: FlashCardWord;
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

export function ReviewSession({ items, starredTerms }: { items: ReviewItem[]; starredTerms: string[] }) {
  const [queue] = React.useState(items);
  const [index, setIndex] = React.useState(0);
  const [reviewItems, setReviewItems] = React.useState<StudyItem[] | null>(null);
  const [sessionOverrides, setSessionOverrides] = React.useState<Record<string, boolean>>({});
  const [, startTransition] = React.useTransition();
  const startedAtRef = React.useRef<number | null>(null);

  const current = queue[index];
  const isDone = !current;
  const progressPercent = queue.length > 0 ? Math.round((index / queue.length) * 100) : 0;
  const studyItems = React.useMemo(() => queue.map(toStudyItem), [queue]);

  const effectiveStarredTerms = React.useMemo(() => {
    const base = new Set(starredTerms.map((t) => t.toLowerCase()));
    for (const [term, needsReview] of Object.entries(sessionOverrides)) {
      if (needsReview) base.add(term);
      else base.delete(term);
    }
    return [...base];
  }, [starredTerms, sessionOverrides]);

  // Logs real elapsed time once the queue is exhausted — same "count it
  // toward Tổng giờ học" treatment the flashcard/quiz/matching games get, so
  // this older graded-review flow isn't the one place study time still goes
  // untracked. Guarded by clearing the ref, so a Strict Mode double-invoke
  // (or any re-render while isDone stays true) can't log twice.
  React.useEffect(() => {
    if (!isDone || startedAtRef.current === null) return;
    const elapsedSec = Math.round((Date.now() - startedAtRef.current) / 1000);
    startedAtRef.current = null;
    void logStudySessionAction(elapsedSec);
  }, [isDone]);

  function handleRate(rating: ReviewRating) {
    if (!current) return;
    startedAtRef.current ??= Date.now();
    startTransition(async () => {
      const result = await reviewVocabularyAction(current.userVocabularyId, rating);
      if (result.error) toast.error(result.error);
    });
    if (rating === "AGAIN") void ensureSavedWordAction(current.word.word);
    else void unsaveWordIfExistsAction(current.word.word);
    setSessionOverrides((prev) => ({ ...prev, [current.word.word.toLowerCase()]: rating === "AGAIN" }));
    setIndex((i) => i + 1);
  }

  function handleReviewItemResult(vocabularyWordId: string, rating: ReviewRating) {
    void practiceVocabularyWordAction(vocabularyWordId, rating);
    const term = studyItems.find((i) => i.id === vocabularyWordId)?.term.toLowerCase();
    if (term) setSessionOverrides((prev) => ({ ...prev, [term]: rating === "AGAIN" }));
  }

  if (reviewItems) {
    return <FlashcardBrowse items={reviewItems} onFinish={() => setReviewItems(null)} onItemResult={handleReviewItemResult} />;
  }

  if (isDone && queue.length === 0) {
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

  if (isDone) {
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

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full max-w-md">
        <div className="mb-2 flex justify-between text-xs text-muted-foreground">
          <span>
            {index + 1}/{queue.length}
          </span>
          <span>{progressPercent}%</span>
        </div>
        <Progress value={progressPercent} className="h-1.5" />
      </div>

      <FlashCard key={current.userVocabularyId} word={current.word} onRate={handleRate} />
    </div>
  );
}
