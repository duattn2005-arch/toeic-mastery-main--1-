"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MistakePracticeRunner } from "@/components/practice/mistake-practice-runner";
import { PART_META } from "@/lib/constants/toeic";
import type { MistakeQuestion } from "@/lib/data/mistakes";
import type { TestPart } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

const ALL_PARTS: TestPart[] = ["PART1", "PART2", "PART3", "PART4", "PART5", "PART6", "PART7"];

export function MistakeBankClient({ questions, countByPart }: { questions: MistakeQuestion[]; countByPart: Partial<Record<TestPart, number>> }) {
  const [filter, setFilter] = React.useState<TestPart | "ALL">("ALL");
  const [started, setStarted] = React.useState(false);

  const filtered = filter === "ALL" ? questions : questions.filter((q) => q.part === filter);

  if (started) {
    return <MistakePracticeRunner questions={filtered} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/practice" className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Luyện đề
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">Ngân hàng lỗi sai</h1>
        <p className="text-sm text-muted-foreground">Các câu bạn làm sai gần nhất trong các đề đã nộp — luyện lại theo phần hoặc luyện tất cả.</p>
      </div>

      {questions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
          <p className="text-sm font-semibold">Chưa có câu sai nào</p>
          <p className="max-w-sm text-sm text-muted-foreground">Làm và nộp một đề thi — câu nào trả lời sai sẽ xuất hiện ở đây để bạn ôn lại.</p>
          <Button asChild size="sm" className="mt-1">
            <Link href="/practice">Xem đề thi</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFilter("ALL")}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                filter === "ALL" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"
              )}
            >
              Tất cả ({questions.length})
            </button>
            {ALL_PARTS.filter((p) => (countByPart[p] ?? 0) > 0).map((part) => (
              <button
                key={part}
                type="button"
                onClick={() => setFilter(part)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  filter === part ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"
                )}
              >
                {PART_META[part].shortLabel} ({countByPart[part]})
              </button>
            ))}
          </div>

          <Button size="lg" className="self-start" onClick={() => setStarted(true)}>
            Luyện {filtered.length} câu sai
          </Button>
        </>
      )}
    </div>
  );
}
