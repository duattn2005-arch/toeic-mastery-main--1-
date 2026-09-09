import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthedProfileOrNull } from "@/lib/auth";
import { recordMentorTestOutcomes, unlockNextDifficulty } from "@/lib/services/mentor/skill-mastery";

interface SubmittedAnswer {
  questionId: string;
  selectedLabel: string;
}

function parseAnswers(body: unknown): SubmittedAnswer[] {
  if (!body || typeof body !== "object" || !Array.isArray((body as { answers?: unknown }).answers)) return [];
  const answers = (body as { answers: unknown[] }).answers;
  return answers.filter(
    (a): a is SubmittedAnswer =>
      !!a && typeof a === "object" && typeof (a as SubmittedAnswer).questionId === "string" && typeof (a as SubmittedAnswer).selectedLabel === "string"
  );
}

/**
 * Grades a MentorTest against the same correctLabel every other Question in
 * the bank uses — no separate answer key. Passing (score >= passThreshold)
 * unlocks the next difficulty tier for this dimension (Module 3's
 * gate); it does NOT auto-complete a LearningPathDay item — the frontend
 * calls /api/mentor/learning-path/items/[id]/complete itself once it sees
 * `passed: true`, so a failed test never silently advances anything.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getAuthedProfileOrNull();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: mentorTestId } = await params;

  const mentorTest = await db.mentorTest.findUnique({
    where: { id: mentorTestId },
    include: { questions: { include: { question: { select: { correctLabel: true } } } } },
  });
  if (!mentorTest || mentorTest.userId !== profile.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (mentorTest.status === "PASSED" || mentorTest.status === "FAILED") {
    return NextResponse.json({ error: "Bài test này đã được nộp trước đó" }, { status: 400 });
  }

  const answers = parseAnswers(await request.json().catch(() => null));
  const answerMap = new Map(answers.map((a) => [a.questionId, a.selectedLabel]));

  let correctCount = 0;
  await Promise.all(
    mentorTest.questions.map((q) => {
      const selectedLabel = answerMap.get(q.questionId) ?? null;
      const isCorrect = selectedLabel !== null && selectedLabel === q.question.correctLabel;
      if (isCorrect) correctCount += 1;
      return db.mentorTestQuestion.update({ where: { id: q.id }, data: { selectedLabel, isCorrect, answeredAt: new Date() } });
    })
  );

  const totalCount = mentorTest.questions.length;
  const score = totalCount > 0 ? correctCount / totalCount : 0;
  const passed = score >= mentorTest.passThreshold;

  await db.mentorTest.update({
    where: { id: mentorTestId },
    data: { status: passed ? "PASSED" : "FAILED", score, completedAt: new Date() },
  });

  // Fire-and-forget: fold this test's outcomes back into SkillMastery, and
  // on a pass, record that this dimension's tested tier is now cleared.
  void recordMentorTestOutcomes(profile.id, mentorTestId).catch((err) => console.error("recordMentorTestOutcomes failed", err));
  if (passed && mentorTest.dimensionType !== "VOCAB_TOPIC") {
    void unlockNextDifficulty(profile.id, mentorTest.dimensionType, mentorTest.dimensionKey, mentorTest.difficulty).catch((err) =>
      console.error("unlockNextDifficulty failed", err)
    );
  }

  return NextResponse.json({ mentorTestId, score, passed, correctCount, totalCount });
}
