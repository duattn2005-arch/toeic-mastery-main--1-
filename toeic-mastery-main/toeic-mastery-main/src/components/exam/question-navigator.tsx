"use client";

import { cn } from "@/lib/utils";
import { PART_META } from "@/lib/constants/toeic";
import type { ExamAnswerState, ExamQuestion } from "@/store/exam-store";

export function QuestionNavigator({
  questions,
  answers,
  currentIndex,
  onSelect,
}: {
  questions: ExamQuestion[];
  answers: Record<string, ExamAnswerState>;
  currentIndex: number;
  onSelect: (index: number) => void;
}) {
  const groups: { part: string; startIndex: number; items: ExamQuestion[] }[] = [];
  questions.forEach((q, index) => {
    const last = groups[groups.length - 1];
    if (last && last.part === q.part) last.items.push(q);
    else groups.push({ part: q.part, startIndex: index, items: [q] });
  });

  const answeredCount = questions.filter((q) => answers[q.id]?.selectedLabel).length;
  const flaggedCount = questions.filter((q) => answers[q.id]?.isFlagged).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Đã làm <span className="font-semibold text-foreground">{answeredCount}</span>/{questions.length}
        </span>
        {flaggedCount > 0 && <span className="text-warning">{flaggedCount} câu đánh dấu</span>}
      </div>

      <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
        <LegendDot className="bg-primary" label="Đang xem" />
        <LegendDot className="bg-success" label="Đã làm" />
        <LegendDot className="bg-warning" label="Đánh dấu" />
        <LegendDot className="border border-border bg-card" label="Chưa làm" />
      </div>

      <div className="scrollbar-thin flex max-h-[60vh] flex-col gap-4 overflow-y-auto pr-1">
        {groups.map((group) => (
          <div key={group.startIndex}>
            <p className="mb-1.5 text-[11px] font-semibold text-muted-foreground">{PART_META[group.part as keyof typeof PART_META].shortLabel}</p>
            <div className="grid grid-cols-6 gap-1.5">
              {group.items.map((q, i) => {
                const index = group.startIndex + i;
                const answer = answers[q.id];
                const isCurrent = index === currentIndex;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => onSelect(index)}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-lg border text-xs font-medium transition-colors",
                      isCurrent
                        ? "border-primary bg-primary text-primary-foreground"
                        : answer?.isFlagged
                          ? "border-warning/50 bg-warning/10 text-warning"
                          : answer?.selectedLabel
                            ? "border-success/40 bg-success/10 text-success"
                            : "border-border bg-card text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LegendDot({ className, label }: { className?: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={cn("size-2.5 rounded-full", className)} />
      {label}
    </span>
  );
}
