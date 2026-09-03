"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AudioPlayer } from "@/components/exam/audio-player";
import { PassageViewer } from "@/components/exam/passage-viewer";
import { AnswerOptionList } from "@/components/exam/answer-option";
import { PART_META } from "@/lib/constants/toeic";
import type { MistakeQuestion } from "@/lib/data/mistakes";
import { useDictionaryHintNudge } from "@/hooks/use-dictionary-hint-nudge";

const AUDIO_ONLY_PARTS = new Set(["PART1", "PART2"]);

/** Untimed drill over previously-missed questions — no Attempt/AttemptAnswer
 * row (a mistake set spans many different Tests, which the exam pipeline
 * isn't built to score as one attempt). Getting one right here is genuine
 * practice, but the mistake bank itself only clears a question once a real
 * timed attempt confirms it — this is instant feedback for learning, not a
 * replacement for retaking a real test. */
export function MistakePracticeRunner({ questions }: { questions: MistakeQuestion[] }) {
  const [index, setIndex] = React.useState(0);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [correctCount, setCorrectCount] = React.useState(0);
  const [wrongCount, setWrongCount] = React.useState(0);
  const [finished, setFinished] = React.useState(false);

  useDictionaryHintNudge();

  const current = questions[index];
  const isAudioOnly = current && AUDIO_ONLY_PARTS.has(current.part);

  function handleAnswer(label: string) {
    if (!current || selected) return;
    setSelected(label);
    if (label === current.correctLabel) setCorrectCount((c) => c + 1);
    else setWrongCount((c) => c + 1);
  }

  function goNext() {
    setSelected(null);
    if (index + 1 >= questions.length) setFinished(true);
    else setIndex((i) => i + 1);
  }

  if (questions.length === 0) {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center gap-3 py-16 text-center">
        <CheckCircle2 className="size-10 text-success" />
        <p className="text-sm font-medium">Không còn câu sai nào để luyện!</p>
        <Button asChild variant="outline">
          <Link href="/practice">Về Luyện đề</Link>
        </Button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center gap-4 py-16 text-center">
        <CheckCircle2 className="size-14 text-success" />
        <h1 className="text-xl font-semibold">Hoàn thành luyện tập!</h1>
        <div className="grid w-full grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-border p-3">
            <p className="text-2xl font-bold text-success">{correctCount}</p>
            <p className="text-xs text-muted-foreground">Câu đúng</p>
          </div>
          <div className="rounded-xl border border-border p-3">
            <p className="text-2xl font-bold text-destructive">{wrongCount}</p>
            <p className="text-xs text-muted-foreground">Câu sai</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Câu trả lời đúng ở đây giúp bạn luyện tập — để câu chính thức biến mất khỏi Ngân hàng lỗi sai, hãy làm lại một đề thi có chứa câu đó.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Luyện lại
          </Button>
          <Button asChild>
            <Link href="/practice/mistakes">Về Ngân hàng lỗi sai</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Câu {index + 1}/{questions.length}
        </p>
        <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">{PART_META[current.part].shortLabel}</span>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
        {current.passage && (
          <>
            {current.passage.audioUrl && <AudioPlayer src={current.passage.audioUrl} />}
            <PassageViewer title={current.passage.title} texts={current.passage.texts} imageUrl={current.passage.imageUrl} />
          </>
        )}
        {!current.passage && current.imageUrl && (
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.imageUrl} alt="" className="size-full object-contain" />
          </div>
        )}
        {!current.passage && current.audioUrl && <AudioPlayer src={current.audioUrl} />}
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

      {selected && (
        <Button onClick={goNext} className="self-center">
          {index + 1 >= questions.length ? "Xem kết quả" : "Câu tiếp theo"}
        </Button>
      )}
    </div>
  );
}
