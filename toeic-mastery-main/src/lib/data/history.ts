import "server-only";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { TEST_PARTS } from "@/lib/constants/toeic";
import { computeAttemptXp } from "@/lib/services/xp";
import type { TestPart } from "@/generated/prisma/enums";

export async function getAttemptResult(attemptId: string, userId: string) {
  const attempt = await db.attempt.findUnique({
    where: { id: attemptId },
    include: { test: true },
  });
  if (!attempt || attempt.userId !== userId) notFound();

  const questions = await db.question.findMany({
    where: { testId: attempt.testId },
    orderBy: { orderIndex: "asc" },
    include: {
      options: { orderBy: { label: "asc" } },
      passage: true,
    },
  });

  const answers = await db.attemptAnswer.findMany({ where: { attemptId } });
  const answerByQuestion = new Map(answers.map((a) => [a.questionId, a]));

  const bookmarks = await db.bookmark.findMany({
    where: { userId, type: "QUESTION", questionId: { in: questions.map((q) => q.id) } },
    select: { questionId: true },
  });
  const bookmarkedQuestionIds = new Set(bookmarks.map((b) => b.questionId));

  const partBuckets = new Map<TestPart, { correct: number; total: number }>();
  for (const part of TEST_PARTS) partBuckets.set(part, { correct: 0, total: 0 });

  const questionReviews = questions.map((q) => {
    const answer = answerByQuestion.get(q.id) ?? null;
    const bucket = partBuckets.get(q.part)!;
    bucket.total += 1;
    if (answer?.isCorrect) bucket.correct += 1;

    return {
      id: q.id,
      part: q.part,
      orderIndex: q.orderIndex,
      prompt: q.prompt,
      imageUrl: q.imageUrl,
      audioUrl: q.audioUrl,
      transcript: q.transcript,
      evidenceText: q.evidenceText,
      explanationVi: q.explanationVi,
      grammarTopicSlug: q.grammarTopicSlug,
      vocabularyFocus: q.vocabularyFocus,
      correctLabel: q.correctLabel,
      selectedLabel: answer?.selectedLabel ?? null,
      isCorrect: answer?.isCorrect ?? false,
      isFlagged: answer?.isFlagged ?? false,
      isBookmarked: bookmarkedQuestionIds.has(q.id),
      options: q.options.map((o) => ({ label: o.label, content: o.content, isCorrect: o.isCorrect, distractorExplanation: o.distractorExplanation })),
      passage: q.passage
        ? {
            id: q.passage.id,
            title: q.passage.title,
            texts: q.passage.texts as unknown as { label: string; content: string }[],
            audioUrl: q.passage.audioUrl,
            imageUrl: q.passage.imageUrl,
            transcript: q.passage.transcript,
          }
        : null,
    };
  });

  const partBreakdown = TEST_PARTS.map((part) => {
    const bucket = partBuckets.get(part)!;
    return { part, correct: bucket.correct, total: bucket.total, accuracy: bucket.total > 0 ? bucket.correct / bucket.total : 0 };
  }).filter((p) => p.total > 0);

  const timeUsedSec = attempt.allowedDurationSec - attempt.remainingSec;
  // XP earned from this specific attempt (correct answers + completion
  // bonus) — same per-unit weights as the lifetime total on the dashboard,
  // so "just now" and "all-time" always add up consistently.
  const xpEarned = computeAttemptXp(attempt.correctCount ?? 0);

  return {
    attempt,
    questionReviews,
    partBreakdown,
    timeUsedSec,
    xpEarned,
  };
}

export type AttemptResult = Awaited<ReturnType<typeof getAttemptResult>>;
export type QuestionReview = AttemptResult["questionReviews"][number];
