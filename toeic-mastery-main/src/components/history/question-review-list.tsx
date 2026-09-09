"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { QuestionReviewCard } from "@/components/history/question-review-card";
import type { QuestionReview } from "@/lib/data/history";

type FilterKey = "ALL" | "CORRECT" | "WRONG" | "SKIPPED" | "FLAGGED";

export function QuestionReviewList({ reviews }: { reviews: QuestionReview[] }) {
  const [filter, setFilter] = React.useState<FilterKey>("ALL");

  const filtered = reviews.filter((r) => {
    switch (filter) {
      case "CORRECT":
        return r.isCorrect;
      case "WRONG":
        return !!r.selectedLabel && !r.isCorrect;
      case "SKIPPED":
        return !r.selectedLabel;
      case "FLAGGED":
        return r.isFlagged;
      default:
        return true;
    }
  });

  const counts = {
    ALL: reviews.length,
    CORRECT: reviews.filter((r) => r.isCorrect).length,
    WRONG: reviews.filter((r) => r.selectedLabel && !r.isCorrect).length,
    SKIPPED: reviews.filter((r) => !r.selectedLabel).length,
    FLAGGED: reviews.filter((r) => r.isFlagged).length,
  };

  const tabs: { key: FilterKey; label: string }[] = [
    { key: "ALL", label: "Tất cả" },
    { key: "WRONG", label: "Câu sai" },
    { key: "CORRECT", label: "Câu đúng" },
    { key: "SKIPPED", label: "Bỏ qua" },
    { key: "FLAGGED", label: "Đã đánh dấu" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="scrollbar-thin flex gap-1.5 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              filter === tab.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
            )}
          >
            {tab.label} ({counts[tab.key]})
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Không có câu hỏi nào trong mục này.</p>
        ) : (
          filtered.map((review) => <QuestionReviewCard key={review.id} review={review} index={reviews.indexOf(review)} />)
        )}
      </div>
    </div>
  );
}
