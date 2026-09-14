"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MentorTestRunnerDialog } from "@/components/mentor/mentor-test-runner-dialog";

interface OnboardingResponse {
  onboardingStatus: "NOT_STARTED" | "PLACEMENT_PENDING" | "READY";
  requiresPlacementTest: boolean;
  pathId: string | null;
}

async function submitOnboarding(input: { targetScore: number; examDate: string | null }): Promise<OnboardingResponse> {
  const res = await fetch("/api/mentor/onboarding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error ?? "Không lưu được mục tiêu");
  return body;
}

/**
 * The only place a placement-test MentorTest gets created client-side —
 * fired by the learner clicking "Làm bài kiểm tra đầu vào" below, never by
 * anything the AI mentor says in chat. See POST /api/mentor/placement-test
 * for why that distinction matters: creating the row there is what counts
 * against the free-tier daily cap.
 */
async function startPlacementTest(): Promise<{ mentorTestId: string; questionCount: number }> {
  const res = await fetch("/api/mentor/placement-test", { method: "POST" });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error ?? "Không tạo được bài kiểm tra đầu vào");
  return body;
}

/**
 * Cold-start onboarding (Module 1), inline at the top of /mentor rather
 * than a separate wizard page — shown only while
 * profile.onboardingStatus === "NOT_STARTED" (see the page's server
 * component). Captures the goal; if the learner has no score baseline yet
 * it points them at a placement test instead of pretending to generate a
 * path from nothing.
 */
export function MentorOnboardingCard() {
  const router = useRouter();
  const [targetScore, setTargetScore] = React.useState("800");
  const [examDate, setExamDate] = React.useState("");
  const [placementTestId, setPlacementTestId] = React.useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => submitOnboarding({ targetScore: Number(targetScore), examDate: examDate || null }),
    onSuccess: () => router.refresh(),
  });

  const placementMutation = useMutation({
    mutationFn: startPlacementTest,
    onSuccess: (data) => setPlacementTestId(data.mentorTestId),
  });

  if (mutation.data && !mutation.data.requiresPlacementTest) {
    return (
      <div className="rounded-2xl border border-success/30 bg-success/10 p-4 text-sm text-success">
        Đã ghi nhận mục tiêu — lộ trình học cá nhân hóa của bạn đang được chuẩn bị.
      </div>
    );
  }

  if (mutation.data?.requiresPlacementTest) {
    return (
      <>
        <div className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm">
          <p className="font-medium">Đã ghi nhận mục tiêu {targetScore} điểm.</p>
          <p className="text-muted-foreground">
            Bạn chưa có điểm ước tính nào — hãy làm một bài kiểm tra đầu vào ngắn (~50 câu, trải đều các Part) để AI Mentor
            biết điểm xuất phát, sau đó lộ trình học sẽ tự động được tạo.
          </p>
          {placementMutation.isError && <p className="text-xs text-destructive">{placementMutation.error.message}</p>}
          <Button size="sm" className="w-fit" onClick={() => placementMutation.mutate()} disabled={placementMutation.isPending}>
            {placementMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Làm bài kiểm tra đầu vào
          </Button>
        </div>
        {placementTestId && (
          <MentorTestRunnerDialog
            mentorTestId={placementTestId}
            open={!!placementTestId}
            onOpenChange={(next) => !next && setPlacementTestId(null)}
            onPassed={() => router.refresh()}
          />
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Target className="size-4" />
        </span>
        <p className="text-sm font-semibold">Chào bạn! Mục tiêu TOEIC của bạn là gì?</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mentor-target-score" className="text-xs">
            Điểm mục tiêu
          </Label>
          <Input
            id="mentor-target-score"
            type="number"
            min={10}
            max={990}
            step={5}
            value={targetScore}
            onChange={(e) => setTargetScore(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mentor-exam-date" className="text-xs">
            Ngày thi (không bắt buộc)
          </Label>
          <Input id="mentor-exam-date" type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
        </div>
      </div>
      {mutation.isError && <p className="text-xs text-destructive">{mutation.error.message}</p>}
      <Button size="sm" className="w-fit" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
        {mutation.isPending ? "Đang lưu..." : "Bắt đầu"}
      </Button>
    </div>
  );
}
