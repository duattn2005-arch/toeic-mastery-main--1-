"use client";

import * as React from "react";
import Link from "next/link";
import { Bookmark } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/shared/empty-state";
import { MistakePracticeRunner } from "@/components/practice/mistake-practice-runner";
import { QuestionDetailDialog } from "@/components/bookmarks/question-detail-dialog";
import { PART_META } from "@/lib/constants/toeic";
import { FREE_SAVED_QUESTIONS_RETRY_LIMIT } from "@/lib/constants/limits";
import type { MistakeQuestion } from "@/lib/data/mistakes";

/**
 * "Câu hỏi đã lưu" tab body: each row opens a read-only detail dialog on
 * click (fixes the old dead history link), and a checkbox lets the learner
 * build a subset to practice again via MistakePracticeRunner — reusing that
 * component exactly as the mistake bank does (client-side selection state,
 * no server action, no Attempt row; see its own doc comment).
 *
 * Free accounts cap the selection at FREE_SAVED_QUESTIONS_RETRY_LIMIT: once
 * reached, remaining checkboxes disable rather than allowing an over-limit
 * selection. This is a client-side-only cap — deliberately so, see
 * FREE_SAVED_QUESTIONS_RETRY_LIMIT's doc comment for why there's no
 * server-side mutation here to gate more strictly.
 */
export function SavedQuestionsManager({ questions, isPro }: { questions: MistakeQuestion[]; isPro: boolean }) {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [detailQuestion, setDetailQuestion] = React.useState<MistakeQuestion | null>(null);
  const [practiceQuestions, setPracticeQuestions] = React.useState<MistakeQuestion[] | null>(null);

  if (practiceQuestions) {
    return <MistakePracticeRunner questions={practiceQuestions} backHref="/bookmarks" backLabel="Về Đã lưu" />;
  }

  if (questions.length === 0) {
    return <EmptyState icon={Bookmark} title="Chưa lưu câu hỏi nào" actionLabel="Luyện đề" actionHref="/practice" />;
  }

  const limit = isPro ? Infinity : FREE_SAVED_QUESTIONS_RETRY_LIMIT;
  const atLimit = selected.size >= limit;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < limit) next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {!isPro && (
        <p className="text-xs text-muted-foreground">
          Tài khoản Free chọn tối đa <strong className="text-foreground">{FREE_SAVED_QUESTIONS_RETRY_LIMIT} câu</strong>/lượt học lại —{" "}
          <Link href="/pricing" className="font-medium text-primary hover:underline">
            Nâng cấp Pro
          </Link>{" "}
          để chọn không giới hạn.
        </p>
      )}

      <div className="flex flex-col gap-2 pb-16">
        {questions.map((q) => {
          const checked = selected.has(q.id);
          return (
            <div
              key={q.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm has-[button:hover]:border-primary/40"
            >
              <Checkbox
                checked={checked}
                disabled={!checked && atLimit}
                onCheckedChange={() => toggle(q.id)}
                aria-label={`Chọn câu "${q.prompt || PART_META[q.part].shortLabel}" để học lại`}
              />
              <button type="button" onClick={() => setDetailQuestion(q)} className="flex flex-1 items-center justify-between gap-2 text-left">
                <span className="truncate">{q.prompt || `Câu hỏi ${PART_META[q.part].shortLabel}`}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{PART_META[q.part].shortLabel}</span>
              </button>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 p-3 shadow-soft backdrop-blur-sm">
        <span className="text-sm text-muted-foreground">
          Đã chọn <strong className="text-foreground">{selected.size}</strong> câu
        </span>
        <Button size="sm" disabled={selected.size === 0} onClick={() => setPracticeQuestions(questions.filter((q) => selected.has(q.id)))}>
          Học lại{selected.size > 0 ? ` (${selected.size} câu)` : ""}
        </Button>
      </div>

      {detailQuestion && <QuestionDetailDialog question={detailQuestion} onClose={() => setDetailQuestion(null)} />}
    </div>
  );
}
