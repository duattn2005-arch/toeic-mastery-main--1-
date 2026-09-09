"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AudioPlayer } from "@/components/exam/audio-player";
import { PassageViewer } from "@/components/exam/passage-viewer";
import { AnswerOptionList } from "@/components/exam/answer-option";
import { PART_META } from "@/lib/constants/toeic";
import type { MistakeQuestion } from "@/lib/data/mistakes";

const AUDIO_ONLY_PARTS = new Set(["PART1", "PART2"]);

/** Read-only view of one saved question — replaces the old broken link that
 * sent a Test id into the Attempt-detail route (see getBookmarkedQuestions'
 * doc comment). No attempt to resolve/guess which of the user's attempts a
 * bookmarked question belongs to; this just shows the question itself with
 * its correct answer and explanation, which is what "xem chi tiết câu hỏi"
 * actually needs. */
export function QuestionDetailDialog({ question, onClose }: { question: MistakeQuestion; onClose: () => void }) {
  const isAudioOnly = AUDIO_ONLY_PARTS.has(question.part);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">{PART_META[question.part].shortLabel}</span>
            Chi tiết câu hỏi
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {question.passage && (
            <>
              {question.passage.audioUrl && <AudioPlayer src={question.passage.audioUrl} />}
              <PassageViewer title={question.passage.title} texts={question.passage.texts} imageUrl={question.passage.imageUrl} />
            </>
          )}
          {!question.passage && question.imageUrl && (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={question.imageUrl} alt="" className="size-full object-contain" />
            </div>
          )}
          {!question.passage && question.audioUrl && <AudioPlayer src={question.audioUrl} />}
          {!isAudioOnly && <p className="text-sm font-medium">{question.prompt}</p>}

          <AnswerOptionList options={question.options} selectedLabel={null} correctLabel={question.correctLabel} onSelect={() => {}} disabled />

          <p className="text-xs text-muted-foreground">{question.explanationVi}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
