"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Crown, Eye, Flag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AudioPlayer } from "@/components/exam/audio-player";
import { TtsAudioPlayer } from "@/components/exam/tts-audio-player";
import { PassageViewer } from "@/components/exam/passage-viewer";
import { AnswerOptionList } from "@/components/exam/answer-option";
import { PART_META } from "@/lib/constants/toeic";
import { FREE_ANSWER_REVEALS_PER_DAY } from "@/lib/constants/limits";
import type { ExamData } from "@/lib/data/exam";
import type { ExamQuestion } from "@/store/exam-store";
import { ListeningAudioTour } from "@/components/listening/listening-audio-tour";

interface RevealData {
  correctLabel: string;
  explanationVi: string;
  grammarTopicSlug: string | null;
  transcript: string | null;
  evidenceText: string | null;
  options: { label: string; distractorExplanation: string | null }[];
}

const AUDIO_ONLY_PARTS = new Set(["PART1", "PART2"]);
const LISTENING_PARTS_WITH_PASSAGE = new Set(["PART3", "PART4"]);
const READING_PASSAGE_PARTS = new Set(["PART6", "PART7"]);

export function ExamQuestionPanel({
  attemptId,
  question,
  questionNumber,
  passage,
  selectedLabel,
  isFlagged,
  onSelectAnswer,
  onToggleFlag,
  mode,
  allowReplay,
}: {
  attemptId: string;
  question: ExamQuestion;
  questionNumber: number;
  passage: ExamData["passages"][string] | null;
  selectedLabel: string | null;
  isFlagged: boolean;
  onSelectAnswer: (label: string) => void;
  onToggleFlag: () => void;
  mode: "PRACTICE" | "EXAM";
  allowReplay: boolean;
}) {
  const [reveal, setReveal] = React.useState<RevealData | null>(null);
  const [revealLoading, setRevealLoading] = React.useState(false);
  const [revealError, setRevealError] = React.useState<string | null>(null);

  async function handleReveal() {
    setRevealLoading(true);
    setRevealError(null);
    try {
      const res = await fetch(`/api/attempts/${attemptId}/questions/${question.id}/reveal`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Không thể tải đáp án");
      setReveal(data as RevealData);
    } catch (err) {
      setRevealError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setRevealLoading(false);
    }
  }

  const isAudioOnly = AUDIO_ONLY_PARTS.has(question.part);
  const hasSharedPassage = LISTENING_PARTS_WITH_PASSAGE.has(question.part) || READING_PASSAGE_PARTS.has(question.part);
  // Only these two parts render audio at all — Reading's shared-passage
  // parts never do — so this also happens to gate the Listening tour's 3rd
  // step (audio speed control) to real Listening questions only.
  const isListeningQuestion = isAudioOnly || LISTENING_PARTS_WITH_PASSAGE.has(question.part);

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-semibold text-primary">{PART_META[question.part as keyof typeof PART_META].label}</span>
          <h2 className="mt-0.5 text-base font-semibold">Câu {questionNumber}</h2>
        </div>
        <Button
          type="button"
          size="sm"
          variant={isFlagged ? "default" : "outline"}
          onClick={onToggleFlag}
          className={cn(isFlagged && "bg-warning text-warning-foreground hover:bg-warning/90")}
        >
          <Flag className="size-3.5" />
          {isFlagged ? "Đã đánh dấu" : "Đánh dấu"}
        </Button>
      </div>

      {hasSharedPassage && passage && (
        <div key={question.passageId}>
          {passage.audioUrl ? (
            <AudioPlayer src={passage.audioUrl} allowReplay={mode === "PRACTICE" || allowReplay} className="mb-3" tourAnchor={isListeningQuestion} />
          ) : (
            passage.transcript && (
              <TtsAudioPlayer
                text={passage.transcript}
                allowReplay={mode === "PRACTICE" || allowReplay}
                className="mb-3"
                tourAnchor={isListeningQuestion}
              />
            )
          )}
          <PassageViewer title={passage.title} texts={passage.texts} imageUrl={passage.imageUrl} />
        </div>
      )}

      {question.imageUrl && !passage?.imageUrl && (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted">
          <Image src={question.imageUrl} alt="" fill className="object-contain" sizes="(max-width: 768px) 100vw, 480px" />
        </div>
      )}

      {!passage?.audioUrl && !passage?.transcript && (
        question.audioUrl ? (
          <AudioPlayer src={question.audioUrl} allowReplay={mode === "PRACTICE" || allowReplay} tourAnchor={isListeningQuestion} />
        ) : (
          question.transcript && (
            <TtsAudioPlayer text={question.transcript} allowReplay={mode === "PRACTICE" || allowReplay} tourAnchor={isListeningQuestion} />
          )
        )
      )}

      {!isAudioOnly && <p className="text-sm leading-relaxed">{question.prompt}</p>}

      <AnswerOptionList
        options={question.options}
        selectedLabel={selectedLabel}
        correctLabel={reveal?.correctLabel ?? null}
        onSelect={onSelectAnswer}
        hideText={isAudioOnly && !reveal}
      />

      {mode === "PRACTICE" && (
        <div className="border-t border-border pt-4">
          {revealError === "LIMIT_REACHED" ? (
            <div className="flex flex-col items-center gap-2 rounded-xl bg-accent/50 p-4 text-center">
              <Crown className="size-5 text-primary" />
              <p className="text-sm font-medium">Nâng cấp tài khoản để tiếp tục xem đáp án</p>
              <p className="text-xs text-muted-foreground">
                Bạn đã dùng hết {FREE_ANSWER_REVEALS_PER_DAY} lượt chữa tức thì miễn phí hôm nay.
              </p>
              <Button asChild size="sm">
                <Link href="/pricing">Nâng cấp Pro</Link>
              </Button>
            </div>
          ) : !reveal ? (
            <Button type="button" variant="outline" size="sm" onClick={handleReveal} disabled={revealLoading}>
              {revealLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Eye className="size-3.5" />}
              Xem đáp án & giải thích
            </Button>
          ) : (
            <div className="flex flex-col gap-2 rounded-xl bg-accent/50 p-4 text-sm">
              <p>
                <span className="font-semibold text-success">Đáp án đúng: {reveal.correctLabel}</span>
              </p>
              <p className="text-foreground/90">{reveal.explanationVi}</p>
              {reveal.transcript && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-xs font-medium text-muted-foreground">Xem transcript</summary>
                  <p className="mt-1.5 whitespace-pre-line text-xs text-muted-foreground">{reveal.transcript}</p>
                </details>
              )}
              {reveal.evidenceText && (
                <p className="rounded-lg bg-warning/10 p-2 text-xs text-foreground/90">
                  <span className="font-medium">Bằng chứng: </span>
                  {reveal.evidenceText}
                </p>
              )}
            </div>
          )}
          {revealError && revealError !== "LIMIT_REACHED" && <p className="mt-2 text-xs text-destructive">{revealError}</p>}
        </div>
      )}

      {isListeningQuestion && <ListeningAudioTour />}
    </div>
  );
}
