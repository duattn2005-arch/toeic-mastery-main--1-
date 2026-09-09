"use client";

import * as React from "react";
import { CheckCircle2, ChevronDown, Flag, MinusCircle, Star, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PART_META } from "@/lib/constants/toeic";
import { AudioPlayer } from "@/components/exam/audio-player";
import { TtsAudioPlayer } from "@/components/exam/tts-audio-player";
import { PassageViewer } from "@/components/exam/passage-viewer";
import { AnswerOptionList } from "@/components/exam/answer-option";
import { ReportQuestionDialog } from "@/components/history/report-question-dialog";
import { toggleQuestionBookmarkAction, saveQuestionVocabularyAction } from "@/lib/actions/bookmarks";
import type { QuestionReview } from "@/lib/data/history";

function StatusBadge({ review }: { review: QuestionReview }) {
  if (!review.selectedLabel) {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <MinusCircle className="size-3.5" /> Bỏ qua
      </span>
    );
  }
  if (review.isCorrect) {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-success">
        <CheckCircle2 className="size-3.5" /> Đúng
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-destructive">
      <XCircle className="size-3.5" /> Sai
    </span>
  );
}

export function QuestionReviewCard({ review, index }: { review: QuestionReview; index: number }) {
  const [open, setOpen] = React.useState(false);
  const [bookmarked, setBookmarked] = React.useState(review.isBookmarked);
  const [bookmarkPending, startBookmarkTransition] = React.useTransition();
  const [vocabPending, startVocabTransition] = React.useTransition();

  function handleBookmark() {
    startBookmarkTransition(async () => {
      const result = await toggleQuestionBookmarkAction(review.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setBookmarked(!!result.bookmarked);
      toast.success(result.bookmarked ? "Đã lưu câu hỏi" : "Đã bỏ lưu câu hỏi");
    });
  }

  function handleSaveVocabulary() {
    if (review.vocabularyFocus.length === 0) {
      toast.info("Câu này chưa gắn từ vựng trọng tâm");
      return;
    }
    startVocabTransition(async () => {
      const result = await saveQuestionVocabularyAction(review.vocabularyFocus);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`Đã lưu ${review.vocabularyFocus.length} từ vựng`);
    });
  }

  return (
    <div className={cn("rounded-2xl border bg-card shadow-soft", review.isFlagged ? "border-warning/40" : "border-border")}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold">{index + 1}</span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-primary">{PART_META[review.part as keyof typeof PART_META].shortLabel}</p>
            <p className="truncate text-sm text-foreground/80">{review.prompt || "(Câu hỏi dạng nghe)"}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {review.isFlagged && <Flag className="size-3.5 text-warning" />}
          <StatusBadge review={review} />
          <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
        </div>
      </button>

      {open && (
        <div className="flex flex-col gap-4 border-t border-border px-4 py-4">
          {review.passage && (
            <div>
              {review.passage.audioUrl ? (
                <AudioPlayer src={review.passage.audioUrl} className="mb-3" />
              ) : (
                review.passage.transcript && <TtsAudioPlayer text={review.passage.transcript} className="mb-3" />
              )}
              <PassageViewer title={review.passage.title} texts={review.passage.texts} imageUrl={review.passage.imageUrl} />
            </div>
          )}
          {!review.passage &&
            (review.audioUrl ? (
              <AudioPlayer src={review.audioUrl} />
            ) : (
              review.transcript && <TtsAudioPlayer text={review.transcript} />
            ))}
          {review.prompt && <p className="text-sm leading-relaxed">{review.prompt}</p>}

          <AnswerOptionList options={review.options} selectedLabel={review.selectedLabel} correctLabel={review.correctLabel} onSelect={() => {}} disabled />

          <div className="rounded-xl bg-accent/50 p-4 text-sm">
            <p className="font-semibold text-foreground">Giải thích</p>
            <p className="mt-1 text-foreground/90">{review.explanationVi}</p>
            {review.options.some((o) => o.distractorExplanation) && (
              <ul className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
                {review.options
                  .filter((o) => o.distractorExplanation)
                  .map((o) => (
                    <li key={o.label}>
                      <span className="font-medium">{o.label}.</span> {o.distractorExplanation}
                    </li>
                  ))}
              </ul>
            )}
          </div>

          {(review.transcript || review.passage?.transcript) && (
            <details>
              <summary className="cursor-pointer text-xs font-medium text-muted-foreground">Xem transcript</summary>
              <p className="mt-1.5 whitespace-pre-line text-xs text-muted-foreground">
                {review.transcript ?? review.passage?.transcript}
              </p>
            </details>
          )}

          {review.evidenceText && (
            <p className="rounded-lg bg-warning/10 p-2.5 text-xs text-foreground/90">
              <span className="font-medium">Bằng chứng: </span>
              {review.evidenceText}
            </p>
          )}

          <div className="flex flex-wrap gap-2 border-t border-border pt-3.5">
            <Button size="sm" variant={bookmarked ? "default" : "outline"} disabled={bookmarkPending} onClick={handleBookmark}>
              <Star className={cn("size-3.5", bookmarked && "fill-current")} /> Lưu câu hỏi
            </Button>
            <Button size="sm" variant="outline" disabled={vocabPending} onClick={handleSaveVocabulary}>
              <Star className="size-3.5" /> Lưu từ vựng
            </Button>
            <ReportQuestionDialog questionId={review.id} />
          </div>
        </div>
      )}
    </div>
  );
}
