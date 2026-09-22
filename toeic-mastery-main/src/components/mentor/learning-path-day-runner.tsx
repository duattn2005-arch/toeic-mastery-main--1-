"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { BookOpen, CheckCircle2, ClipboardList, Headphones, Layers, Lightbulb, ListChecks, SpellCheck2, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PART_META } from "@/lib/constants/toeic";
import { MentorTestRunnerDialog } from "./mentor-test-runner-dialog";
import type { LearningPathItemDetail } from "@/lib/data/learning-path";
import type { TestPart, LearningItemType } from "@/generated/prisma/enums";

async function completeItem(itemId: string): Promise<{ dayCompleted: boolean; nextDayUnlocked: boolean }> {
  const res = await fetch(`/api/mentor/learning-path/items/${itemId}/complete`, { method: "POST" });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error ?? "Không đánh dấu hoàn thành được");
  return body;
}

async function startTest(itemId: string): Promise<{ mentorTestId: string; questionCount: number }> {
  const res = await fetch(`/api/mentor/learning-path/items/${itemId}/start-test`, { method: "POST" });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error ?? "Không tạo được bài kiểm tra");
  return body;
}

const ITEM_META: Record<LearningItemType, { icon: LucideIcon; title: string }> = {
  GRAMMAR_LESSON: { icon: SpellCheck2, title: "Ôn ngữ pháp" },
  VOCAB_TOPIC: { icon: Layers, title: "Học từ vựng theo chủ đề" },
  VOCAB_REVIEW: { icon: Layers, title: "Ôn từ vựng đến hạn" },
  LISTENING_PRACTICE: { icon: Headphones, title: "Luyện nghe" },
  READING_PRACTICE: { icon: BookOpen, title: "Luyện đọc" },
  MINI_TEST: { icon: ListChecks, title: "Bài kiểm tra nhanh" },
  FULL_TEST: { icon: ClipboardList, title: "Đề thi thử đầy đủ" },
  TIP: { icon: Lightbulb, title: "Mẹo học tập hôm nay" },
};

/** null for MINI_TEST (handled as its own "Bắt đầu" flow) and TIP (nothing
 * to navigate to — it's just a note). */
function hrefForItem(itemType: LearningItemType, focusParts: TestPart[], orderIndex: number): string | null {
  switch (itemType) {
    case "GRAMMAR_LESSON":
      return "/grammar";
    case "VOCAB_TOPIC":
      return "/vocabulary/topics";
    case "VOCAB_REVIEW":
      return "/vocabulary/review";
    case "LISTENING_PRACTICE":
    case "READING_PRACTICE": {
      // buildDayItems (learning-path-generator.ts) creates one of these per
      // focus Part via focusParts.forEach((part, i) => ... orderIndex: i),
      // so orderIndex IS that Part's index into focusParts — not just "the
      // day's first Listening/Reading Part" (two Listening items on the
      // same day used to both link to whichever Part came first).
      const part = focusParts[orderIndex];
      if (!part) return itemType === "LISTENING_PRACTICE" ? "/listening" : "/reading";
      const meta = PART_META[part];
      return `/${meta.skill === "LISTENING" ? "listening" : "reading"}/${meta.slug}`;
    }
    case "FULL_TEST":
      return "/practice";
    case "MINI_TEST":
    case "TIP":
      return null;
  }
}

/**
 * One day's items. GRAMMAR_LESSON items point at one specific lesson the
 * generator picked (item.refTitle/refHref — see learning-path-generator.ts
 * and grammar-lesson-picker.ts); every other non-test item still links to
 * its general section rather than one specific piece of content (no
 * per-item refId assignment for those yet), so completion for those is a
 * self-reported "Đánh dấu đã học" rather than something the system can
 * verify. MINI_TEST is the one item type that's actually enforced: it only
 * completes after MentorTestRunnerDialog reports a real pass.
 */
export function LearningPathDayRunner({
  dayNumber,
  focusParts,
  summary,
  items,
}: {
  dayNumber: number;
  focusParts: TestPart[];
  summary: string | null;
  items: LearningPathItemDetail[];
}) {
  const router = useRouter();
  const [activeTest, setActiveTest] = React.useState<{ itemId: string; mentorTestId: string } | null>(null);

  const completeMutation = useMutation({
    mutationFn: completeItem,
    onSuccess: (data) => {
      if (data.dayCompleted) {
        toast.success(data.nextDayUnlocked ? "Hoàn thành ngày học! Ngày tiếp theo đã mở khóa 🎉" : "Đã hoàn thành ngày học!");
      }
      router.refresh();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const startTestMutation = useMutation({
    mutationFn: startTest,
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="mb-1">
        <h1 className="text-xl font-semibold tracking-tight">Ngày {dayNumber}</h1>
        <p className="text-sm text-muted-foreground">Trọng tâm: {focusParts.map((p) => PART_META[p].shortLabel).join(", ") || "—"}</p>
        {summary && <p className="mt-1 text-sm text-foreground/80">{summary}</p>}
      </div>

      {items.map((item) => {
        const meta = ITEM_META[item.itemType];
        const Icon = meta.icon;
        const done = item.status === "DONE";
        const href = item.refHref ?? hrefForItem(item.itemType, focusParts, item.orderIndex);
        const title = item.refTitle ?? meta.title;

        return (
          <div
            key={item.id}
            className={cn(
              "flex items-center gap-3 rounded-2xl border p-4 shadow-soft",
              done ? "border-success/30 bg-success/5" : "border-border bg-card"
            )}
          >
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl",
                done ? "bg-success/15 text-success" : "bg-accent text-accent-foreground"
              )}
            >
              {done ? <CheckCircle2 className="size-5" /> : <Icon className="size-5" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{title}</p>
              {item.itemType === "MINI_TEST" && <p className="text-xs text-muted-foreground">Vượt qua để mở khóa phần khó hơn</p>}
              {item.refTitle && <p className="text-xs text-muted-foreground">{meta.title}</p>}
            </div>

            {done ? (
              <span className="shrink-0 text-xs font-medium text-success">Đã hoàn thành</span>
            ) : item.itemType === "MINI_TEST" ? (
              <Button
                size="sm"
                onClick={async () => {
                  const result = await startTestMutation.mutateAsync(item.id);
                  setActiveTest({ itemId: item.id, mentorTestId: result.mentorTestId });
                }}
                disabled={startTestMutation.isPending}
              >
                Bắt đầu
              </Button>
            ) : (
              <div className="flex shrink-0 items-center gap-2">
                {href && (
                  <Button size="sm" variant="outline" asChild>
                    <Link href={href}>Đi tới</Link>
                  </Button>
                )}
                <Button size="sm" onClick={() => completeMutation.mutate(item.id)} disabled={completeMutation.isPending}>
                  Đánh dấu đã học
                </Button>
              </div>
            )}
          </div>
        );
      })}

      {activeTest && (
        <MentorTestRunnerDialog
          mentorTestId={activeTest.mentorTestId}
          open={!!activeTest}
          onOpenChange={(open) => !open && setActiveTest(null)}
          onPassed={() => completeMutation.mutate(activeTest.itemId)}
        />
      )}
    </div>
  );
}
