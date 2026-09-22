"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MentorTestRunnerDialog } from "@/components/mentor/mentor-test-runner-dialog";
import { MENTOR_LEVEL_LABEL_VI } from "@/lib/constants/toeic";

interface LevelGateEligibilityResponse {
  mentorLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  hasNextGate: boolean;
  eligible?: boolean;
  totalAttempted?: number;
  totalRequired?: number;
  labelsBelow?: { dimensionKey: string; attemptedCount: number; required: number }[];
}

async function fetchEligibility(): Promise<LevelGateEligibilityResponse> {
  const res = await fetch("/api/mentor/level-gate");
  if (!res.ok) throw new Error("Không tải được trạng thái Gate Test");
  return res.json();
}

/**
 * The only place a LEVEL_GATE MentorTest gets created client-side — mirrors
 * MentorOnboardingCard's same rule for its placement test, and for the same
 * reason (see POST /api/mentor/level-gate): the AI mentor may only ever
 * mention this in chat, never trigger it.
 */
async function startLevelGateTest(): Promise<{ mentorTestId: string; questionCount: number; targetLevel: string }> {
  const res = await fetch("/api/mentor/level-gate", { method: "POST" });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error ?? "Không tạo được Gate Test");
  return body;
}

/**
 * Shown once onboarding is past its first-run wizard (see
 * MentorPageClient's showLevelGate) — reports progress toward the next
 * mentorLevel gate (see docs/ai-mentor-architecture.md mục 10-11; both
 * BEGINNER→INTERMEDIATE and INTERMEDIATE→ADVANCED use this same card and
 * API, `asGateableLevel` in the API route covers both). Renders nothing
 * once mentorLevel is already ADVANCED (no further gate exists) or while
 * still loading, so it never flashes an empty card.
 */
export function MentorLevelGateCard() {
  const router = useRouter();
  const [gateTestId, setGateTestId] = React.useState<string | null>(null);
  const [remediationTestId, setRemediationTestId] = React.useState<string | null>(null);

  const eligibilityQuery = useQuery({ queryKey: ["mentor-level-gate-eligibility"], queryFn: fetchEligibility });

  const startMutation = useMutation({
    mutationFn: startLevelGateTest,
    onSuccess: (data) => setGateTestId(data.mentorTestId),
  });

  const data = eligibilityQuery.data;
  if (!data || !data.hasNextGate) return null;

  const targetLevel = data.mentorLevel === "BEGINNER" ? "INTERMEDIATE" : "ADVANCED";

  return (
    <>
      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Sparkles className="size-4" />
          </span>
          <p className="font-semibold">
            {MENTOR_LEVEL_LABEL_VI[data.mentorLevel]} → {MENTOR_LEVEL_LABEL_VI[targetLevel]}
          </p>
        </div>

        {data.eligible ? (
          <>
            <p className="text-muted-foreground">
              Bạn đã luyện đủ để làm Gate Test lên {MENTOR_LEVEL_LABEL_VI[targetLevel]}. Sai phần nào, AI Mentor sẽ cho học lại
              đúng phần đó trước khi cho thi lại.
            </p>
            {startMutation.isError && <p className="text-xs text-destructive">{(startMutation.error as Error).message}</p>}
            <Button size="sm" className="w-fit" onClick={() => startMutation.mutate()} disabled={startMutation.isPending}>
              {startMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Làm Gate Test
            </Button>
          </>
        ) : (
          <p className="text-muted-foreground">
            Đã luyện {data.totalAttempted ?? 0}/{data.totalRequired ?? 0} câu
            {data.labelsBelow && data.labelsBelow.length > 0 ? `, còn ${data.labelsBelow.length} nhãn kiến thức cần luyện thêm` : ""} trước khi đủ
            điều kiện làm Gate Test.
          </p>
        )}
      </div>

      {gateTestId && (
        <MentorTestRunnerDialog
          mentorTestId={gateTestId}
          open={!!gateTestId}
          onOpenChange={(next) => {
            if (!next) {
              setGateTestId(null);
              void eligibilityQuery.refetch();
              router.refresh();
            }
          }}
          onStartRemediation={(id) => {
            // Swap straight from the Gate Test dialog into the học bù
            // dialog — closing this one first would flash the eligibility
            // card in between for no reason.
            setGateTestId(null);
            setRemediationTestId(id);
          }}
        />
      )}

      {remediationTestId && (
        <MentorTestRunnerDialog
          mentorTestId={remediationTestId}
          open={!!remediationTestId}
          onOpenChange={(next) => {
            if (!next) {
              setRemediationTestId(null);
              // Eligibility for the Gate Test itself never changes from
              // doing học bù (it was already met to unlock the original
              // Gate Test) — refetch anyway so the card's copy/progress
              // numbers stay current if more practice happened along the
              // way.
              void eligibilityQuery.refetch();
              router.refresh();
            }
          }}
        />
      )}
    </>
  );
}
