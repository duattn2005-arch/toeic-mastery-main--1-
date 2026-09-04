import "server-only";
import { db } from "@/lib/db";
import { PART_META } from "@/lib/constants/toeic";
import type { TestPart } from "@/generated/prisma/enums";

export interface MistakeQuestion {
  id: string;
  part: TestPart;
  prompt: string;
  imageUrl: string | null;
  audioUrl: string | null;
  options: { label: string; content: string }[];
  correctLabel: string;
  explanationVi: string;
  passage: { title: string | null; texts: { label: string; content: string }[]; imageUrl: string | null; audioUrl: string | null } | null;
}

/**
 * "Câu sai" = the user's most recent submitted-attempt answer for a question
 * is wrong — not "ever answered wrong", so retaking a real test and getting
 * it right naturally drops it out of the mistake bank without any separate
 * bookmark/star bookkeeping to keep in sync (and without risking collision
 * with the unrelated manual question-bookmark feature).
 */
export async function getMistakeQuestions(userId: string): Promise<{ questions: MistakeQuestion[]; countByPart: Partial<Record<TestPart, number>> }> {
  const answers = await db.attemptAnswer.findMany({
    where: { attempt: { userId, status: "SUBMITTED" }, isCorrect: { not: null } },
    select: { questionId: true, isCorrect: true, attempt: { select: { submittedAt: true } } },
    orderBy: { attempt: { submittedAt: "desc" } },
  });

  const latestByQuestion = new Map<string, boolean>();
  for (const a of answers) {
    if (!latestByQuestion.has(a.questionId)) latestByQuestion.set(a.questionId, a.isCorrect === true);
  }
  const mistakeQuestionIds = [...latestByQuestion.entries()].filter(([, correct]) => !correct).map(([id]) => id);

  if (mistakeQuestionIds.length === 0) return { questions: [], countByPart: {} };

  const rows = await db.question.findMany({
    where: { id: { in: mistakeQuestionIds } },
    include: { options: { orderBy: { label: "asc" } }, passage: true },
  });

  const countByPart: Partial<Record<TestPart, number>> = {};
  for (const q of rows) countByPart[q.part] = (countByPart[q.part] ?? 0) + 1;

  const questions: MistakeQuestion[] = rows.map((q) => ({
    id: q.id,
    part: q.part,
    prompt: q.prompt,
    imageUrl: q.imageUrl,
    audioUrl: q.audioUrl,
    options: q.options.map((o) => ({ label: o.label, content: o.content })),
    correctLabel: q.correctLabel,
    explanationVi: q.explanationVi,
    passage: q.passage
      ? {
          title: q.passage.title,
          texts: q.passage.texts as { label: string; content: string }[],
          imageUrl: q.passage.imageUrl,
          audioUrl: q.passage.audioUrl,
        }
      : null,
  }));

  return { questions, countByPart };
}

export function partLabel(part: TestPart): string {
  return PART_META[part].shortLabel;
}

/** Cheap count-only version of getMistakeQuestions' logic, for a dashboard
 * banner that shouldn't pay for fetching full question/passage bodies. */
export async function getMistakeCount(userId: string): Promise<number> {
  const answers = await db.attemptAnswer.findMany({
    where: { attempt: { userId, status: "SUBMITTED" }, isCorrect: { not: null } },
    select: { questionId: true, isCorrect: true, attempt: { select: { submittedAt: true } } },
    orderBy: { attempt: { submittedAt: "desc" } },
  });
  const latestByQuestion = new Map<string, boolean>();
  for (const a of answers) {
    if (!latestByQuestion.has(a.questionId)) latestByQuestion.set(a.questionId, a.isCorrect === true);
  }
  return [...latestByQuestion.values()].filter((correct) => !correct).length;
}
