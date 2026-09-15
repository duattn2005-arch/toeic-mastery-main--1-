import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthedProfileOrNull } from "@/lib/auth";
import { hasReachedRevealLimit } from "@/lib/services/reveal-limit";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ attemptId: string; questionId: string }> }
) {
  const profile = await getAuthedProfileOrNull();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { attemptId, questionId } = await params;

  const attempt = await db.attempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.userId !== profile.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Correct answers only ever leave the server for a practice-mode attempt
  // (immediate review) or once the attempt has been submitted — never mid-exam.
  if (attempt.mode !== "PRACTICE" && attempt.status !== "SUBMITTED") {
    return NextResponse.json({ error: "Đáp án chỉ hiển thị ở chế độ luyện tập hoặc sau khi nộp bài" }, { status: 403 });
  }

  // Explicit questionIds (a "retry just these questions" attempt) takes
  // priority — membership is checked directly since combining it with an
  // `id: questionId` equality filter in one `where` would just overwrite
  // itself. Otherwise falls back to the usual testId+parts scoping.
  if (attempt.questionIds.length > 0 && !attempt.questionIds.includes(questionId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const question = await db.question.findFirst({
    where: {
      id: questionId,
      ...(attempt.questionIds.length === 0
        ? { testId: attempt.testId, ...(attempt.parts.length > 0 ? { part: { in: attempt.parts } } : {}) }
        : {}),
    },
    include: { options: true },
  });
  if (!question) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (await hasReachedRevealLimit(profile, question.part)) {
    return NextResponse.json({ error: "LIMIT_REACHED" }, { status: 403 });
  }

  await db.answerRevealLog.create({ data: { userId: profile.id, questionId } });

  return NextResponse.json({
    correctLabel: question.correctLabel,
    explanationVi: question.explanationVi,
    grammarTopicSlug: question.grammarTopicSlug,
    vocabularyFocus: question.vocabularyFocus,
    transcript: question.transcript,
    evidenceText: question.evidenceText,
    options: question.options.map((o) => ({ label: o.label, distractorExplanation: o.distractorExplanation })),
  });
}
