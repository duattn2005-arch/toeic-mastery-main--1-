"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExamQuestionOption } from "@/store/exam-store";

export function AnswerOptionList({
  options,
  selectedLabel,
  correctLabel,
  onSelect,
  hideText = false,
  disabled = false,
}: {
  options: ExamQuestionOption[];
  selectedLabel: string | null;
  correctLabel?: string | null;
  onSelect: (label: string) => void;
  hideText?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {options.map((option) => {
        const isSelected = selectedLabel === option.label;
        const isRevealedCorrect = correctLabel === option.label;
        const isRevealedWrong = !!correctLabel && isSelected && option.label !== correctLabel;

        return (
          <button
            key={option.label}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(option.label)}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors disabled:cursor-not-allowed",
              isRevealedCorrect
                ? "border-success bg-success/10"
                : isRevealedWrong
                  ? "border-destructive bg-destructive/10"
                  : isSelected
                    ? "border-primary bg-accent"
                    : "border-border bg-card hover:border-primary/40 hover:bg-accent/40"
            )}
          >
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                isRevealedCorrect
                  ? "border-success bg-success text-white"
                  : isRevealedWrong
                    ? "border-destructive bg-destructive text-white"
                    : isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground"
              )}
            >
              {option.label}
            </span>
            {!hideText && <span className="flex-1">{option.content}</span>}
            {isRevealedCorrect && <Check className="size-4 shrink-0 text-success" />}
            {isRevealedWrong && <X className="size-4 shrink-0 text-destructive" />}
          </button>
        );
      })}
    </div>
  );
}
