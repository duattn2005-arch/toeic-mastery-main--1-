import "server-only";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import type { ExamAnswerState, ExamQuestion } from "@/store/exam-store";

export interface ExamData {
  attemptId: string;
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
      imageUrl: string | null;
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

  const [questions, existingAnswers] = await Promise.all([
    db.question.findMany({
      where: { testId: attempt.testId },
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
        imageUrl: q.passage.imageUrl,
        transcript: q.passage.transcript,
      };
    }
  }

  return {
    attemptId: attempt.id,
    testTitle: attempt.test.title,
    mode: attempt.mode,
    allowReplay: attempt.test.allowReplay,
    allowedDurationSec: attempt.allowedDurationSec,
    remainingSec: attempt.remainingSec,
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
