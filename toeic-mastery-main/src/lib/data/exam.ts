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

  // remainingSec is a checkpoint, not a derived value: it only decreases
  // while the attempt is actually open in a tab (ticked client-side and
  // flushed to this column every ~8s / on exit — see use-exam-sync.ts), so
  // reopening an attempt hours after closing the tab resumes with exactly
  // as much time as was left, instead of the clock having silently drained
  // in the background. Recomputing it from wall-clock elapsed-since-
  // startedAt (as this used to do) made the timer run whether or not the
  // learner was actually present, which is what caused attempts to
  // auto-submit at 0% after being reopened long after the fact.
  const remainingSec = attempt.remainingSec;

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
