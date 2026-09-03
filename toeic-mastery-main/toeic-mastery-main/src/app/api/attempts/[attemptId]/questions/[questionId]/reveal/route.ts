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

  if (await hasReachedRevealLimit(profile)) {
    return NextResponse.json({ error: "LIMIT_REACHED" }, { status: 403 });
  }

  const question = await db.question.findFirst({
    where: { id: questionId, testId: attempt.testId },
    include: { options: true },
  });
  if (!question) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
