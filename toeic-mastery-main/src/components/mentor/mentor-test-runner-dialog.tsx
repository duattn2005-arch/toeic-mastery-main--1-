"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PART_META } from "@/lib/constants/toeic";
import { AnswerOptionList } from "@/components/exam/answer-option";
import type { TestPart } from "@/generated/prisma/enums";

interface MentorTestQuestionDTO {
  id: string;
  part: TestPart;
  prompt: string;
  imageUrl: string | null;
  audioUrl: string | null;
  transcript: string | null;
  options: { label: string; content: string }[];
}

interface MentorTestDTO {
  id: string;
  status: "PENDING" | "IN_PROGRESS" | "PASSED" | "FAILED";
  score: number | null;
  passThreshold: number;
  questions: MentorTestQuestionDTO[];
}

interface SubmitResult {
  score: number;
  passed: boolean;
  correctCount: number;
  totalCount: number;
}

async function fetchMentorTest(mentorTestId: string): Promise<MentorTestDTO> {
  const res = await fetch(`/api/mentor/tests/${mentorTestId}`);
  if (!res.ok) throw new Error("Không tải được bài kiểm tra");
  const data = (await res.json()) as { mentorTest: MentorTestDTO };
  return data.mentorTest;
}

async function submitMentorTest(mentorTestId: string, answers: { questionId: string; selectedLabel: string }[]): Promise<SubmitResult> {
  const res = await fetch(`/api/mentor/tests/${mentorTestId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Nộp bài thất bại");
  return res.json();
}

export function MentorTestRunnerDialog({
  mentorTestId,
  open,
  onOpenChange,
  onPassed,
}: {
  mentorTestId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fired once, right after a graded PASS — e.g. the LearningPath day
   * runner uses this to call .../items/[id]/complete, which a FAILED
   * result must never trigger (see mentor-test-runner-dialog.tsx's own
   * copy about asking the mentor for another attempt instead). */
  onPassed?: () => void;
}) {
  const queryClient = useQueryClient();
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [result, setResult] = React.useState<SubmitResult | null>(null);

  const testQuery = useQuery({
    queryKey: ["mentor-test", mentorTestId],
    queryFn: () => fetchMentorTest(mentorTestId),
    enabled: open,
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      submitMentorTest(
        mentorTestId,
        Object.entries(answers).map(([questionId, selectedLabel]) => ({ questionId, selectedLabel }))
      ),
    onSuccess: (data) => {
      setResult(data);
      void queryClient.invalidateQueries({ queryKey: ["mentor-test", mentorTestId] });
      if (data.passed) onPassed?.();
    },
  });

  const test = testQuery.data;
  const answeredCount = Object.keys(answers).length;
  const alreadyGraded = test?.status === "PASSED" || test?.status === "FAILED";

  function handleClose(next: boolean) {
    if (!next) {
      // Reset local state on close so reopening the same card starts fresh
      // (relevant only if the test wasn't graded — a graded test always
      // shows its stored result via `alreadyGraded` instead).
      setAnswers({});
      setResult(null);
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Bài kiểm tra nhanh</DialogTitle>
          <DialogDescription>Vượt qua để AI Mentor mở khóa phần khó hơn cho bạn.</DialogDescription>
        </DialogHeader>

        {testQuery.isLoading && (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        )}

        {test && !result && !alreadyGraded && (
          <div className="flex flex-col gap-5">
            {test.questions.map((q, index) => (
              <div key={q.id} className="flex flex-col gap-2.5 border-t border-border pt-4 first:border-t-0 first:pt-0">
                <p className="text-xs font-medium text-primary">
                  Câu {index + 1}/{test.questions.length} · {PART_META[q.part].shortLabel}
                </p>
                {q.prompt && <p className="text-sm leading-relaxed">{q.prompt}</p>}
                <AnswerOptionList
                  options={q.options}
                  selectedLabel={answers[q.id] ?? null}
                  onSelect={(label) => setAnswers((prev) => ({ ...prev, [q.id]: label }))}
                />
              </div>
            ))}
          </div>
        )}

        {test && !result && alreadyGraded && (
          <p className="py-6 text-center text-sm text-muted-foreground">Bài kiểm tra này đã được nộp trước đó.</p>
        )}

        {result && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            {result.passed ? (
              <CheckCircle2 className="size-12 text-success" />
            ) : (
              <XCircle className="size-12 text-destructive" />
            )}
            <p className="text-lg font-semibold">
              {result.correctCount}/{result.totalCount} câu đúng ({Math.round(result.score * 100)}%)
            </p>
            <p className="text-sm text-muted-foreground">
              {result.passed
                ? "Chúc mừng! Bạn đã mở khóa mức độ khó hơn cho phần này."
                : "Chưa đạt ngưỡng cần thiết — hãy nhắn cho AI Mentor để nhận một bài kiểm tra khác sau khi ôn lại."}
            </p>
          </div>
        )}

        {submitMutation.isError && <p className="text-sm text-destructive">{(submitMutation.error as Error).message}</p>}

        <DialogFooter>
          {!result && !alreadyGraded && (
            <>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Đóng
              </Button>
              <Button
                onClick={() => submitMutation.mutate()}
                disabled={!test || answeredCount < test.questions.length || submitMutation.isPending}
              >
                {submitMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                Nộp bài ({answeredCount}/{test?.questions.length ?? 0})
              </Button>
            </>
          )}
          {(result || alreadyGraded) && <Button onClick={() => handleClose(false)}>Đóng</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
