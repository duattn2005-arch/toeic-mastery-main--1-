import "server-only";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import type { ExamAnswerState, ExamQuestion } from "@/store/exam-store";

export interface ExamData {
  attemptId: string;
  testId: string;
  testTitle: string;
  mode: "PRACTICE" | "EXAM";
  allowReplay: boolean;
  allowedDurationSec: number;
  remainingSec: number;
  currentQuestionIndex: number;
  questions: ExamQuestion[];
  answers: Record<string, ExamAnswerState>;
  passages: Record<
    string,
    {
      format: string;
      layout: string;
      title: string | null;
      texts: { label: string; content: string }[];
      audioUrl: string | null;
      imageUrls: string[];
      transcript: string | null;
    }
  >;
}

export async function getExamData(attemptId: string, userId: string): Promise<ExamData> {
  const attempt = await db.attempt.findUnique({
    where: { id: attemptId },
    include: { test: { select: { title: true, allowReplay: true } } },
  });

  if (!attempt || attempt.userId !== userId) notFound();

  // Derived from the wall-clock elapsed since the attempt actually started,
  // not the `remainingSec` column — that's only a periodic checkpoint (every
  // 8s, plus on tab close; see use-exam-sync.ts), so reading it directly
  // effectively paused the countdown for however long the tab stayed closed:
  // reopen an attempt hours later and it would resume as if no time had
  // passed. A real exam clock keeps running whether or not the tab is open.
  const elapsedSec = Math.max(0, Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000));
  const remainingSec = attempt.status === "IN_PROGRESS" ? Math.max(0, attempt.allowedDurationSec - elapsedSec) : attempt.remainingSec;

  const [questions, existingAnswers] = await Promise.all([
    db.question.findMany({
      // Explicit `questionIds` (a "retry just these questions" attempt —
      // see startMistakeRetryAction) takes priority over testId+parts
      // scoping entirely, since the set it covers can span the whole test
      // rather than one contiguous Part range. Otherwise: empty `parts`
      // (the default — every attempt before that field existed, and "Full
      // Test") means the whole test; a non-empty array (Listening-only,
      // Reading-only, or a hand-picked set — see test-attempt-start-panel.tsx)
      // scopes it to just those Parts.
      where:
        attempt.questionIds.length > 0
          ? { id: { in: attempt.questionIds } }
          : { testId: attempt.testId, ...(attempt.parts.length > 0 ? { part: { in: attempt.parts } } : {}) },
      orderBy: { orderIndex: "asc" },
      include: { options: { orderBy: { label: "asc" }, select: { label: true, content: true } }, passage: true },
    }),
    db.attemptAnswer.findMany({ where: { attemptId }, select: { questionId: true, selectedLabel: true, isFlagged: true } }),
  ]);

  const answers: Record<string, ExamAnswerState> = {};
  for (const a of existingAnswers) {
    answers[a.questionId] = { selectedLabel: a.selectedLabel, isFlagged: a.isFlagged, isSynced: true };
  }

  const passages: ExamData["passages"] = {};
  for (const q of questions) {
    if (q.passage && !passages[q.passage.id]) {
      passages[q.passage.id] = {
        format: q.passage.format,
        layout: q.passage.layout,
        title: q.passage.title,
        texts: q.passage.texts as unknown as { label: string; content: string }[],
        audioUrl: q.passage.audioUrl,
        imageUrls: q.passage.imageUrls,
        transcript: q.passage.transcript,
      };
    }
  }

  return {
    attemptId: attempt.id,
    testId: attempt.testId,
    testTitle: attempt.test.title,
    mode: attempt.mode,
    allowReplay: attempt.test.allowReplay,
    allowedDurationSec: attempt.allowedDurationSec,
    remainingSec,
    currentQuestionIndex: attempt.currentQuestionIndex,
    questions: questions.map((q) => ({
      id: q.id,
      part: q.part,
      orderIndex: q.orderIndex,
      prompt: q.prompt,
      imageUrl: q.imageUrl,
      audioUrl: q.audioUrl,
      transcript: q.transcript,
      passageId: q.passageId,
      options: q.options,
    })),
    answers,
    passages,
  };
}
