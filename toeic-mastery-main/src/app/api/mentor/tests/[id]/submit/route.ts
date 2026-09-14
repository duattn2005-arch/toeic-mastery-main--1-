import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthedProfileOrNull } from "@/lib/auth";
import { recordMentorTestOutcomes, unlockNextDifficulty } from "@/lib/services/mentor/skill-mastery";
import { ScoreCalculator } from "@/lib/services/score-calculator";
import { LISTENING_PARTS } from "@/lib/constants/toeic";
import { generateLearningPath } from "@/lib/services/mentor/learning-path-generator";
import type { TestPart } from "@/generated/prisma/enums";

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
    include: { questions: { include: { question: { select: { correctLabel: true, part: true } } } } },
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
  const graded: { part: TestPart; isCorrect: boolean }[] = [];
  await Promise.all(
    mentorTest.questions.map((q) => {
      const selectedLabel = answerMap.get(q.questionId) ?? null;
      const isCorrect = selectedLabel !== null && selectedLabel === q.question.correctLabel;
      if (isCorrect) correctCount += 1;
      graded.push({ part: q.question.part, isCorrect });
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
  // A PLACEMENT test has no real "dimension" to unlock (dimensionKey is
  // just "ALL") and no pass/fail bar worth gating content behind — see the
  // estimated-score branch below for what it does instead.
  void recordMentorTestOutcomes(profile.id, mentorTestId).catch((err) => console.error("recordMentorTestOutcomes failed", err));
  if (passed && mentorTest.dimensionType !== "VOCAB_TOPIC" && mentorTest.dimensionType !== "PLACEMENT") {
    void unlockNextDifficulty(profile.id, mentorTest.dimensionType, mentorTest.dimensionKey, mentorTest.difficulty).catch((err) =>
      console.error("unlockNextDifficulty failed", err)
    );
  }

  let estimatedScore: { listening: number; reading: number; total: number } | null = null;
  let onboardingCompleted = false;

  if (mentorTest.dimensionType === "PLACEMENT") {
    const isListening = (part: TestPart) => (LISTENING_PARTS as string[]).includes(part);
    let listeningCorrect = 0;
    let listeningTotal = 0;
    let readingCorrect = 0;
    let readingTotal = 0;
    for (const g of graded) {
      if (isListening(g.part)) {
        listeningTotal += 1;
        if (g.isCorrect) listeningCorrect += 1;
      } else {
        readingTotal += 1;
        if (g.isCorrect) readingCorrect += 1;
      }
    }

    // This diagnostic is far shorter than the 100-question-per-skill real
    // exam the conversion table is calibrated for, so raw correct counts
    // are scaled up to a /100 rate before lookup — the same estimation
    // approach a short practice quiz uses anywhere else in the app.
    const scaledListening = listeningTotal > 0 ? Math.round((listeningCorrect / listeningTotal) * 100) : 0;
    const scaledReading = readingTotal > 0 ? Math.round((readingCorrect / readingTotal) * 100) : 0;
    const calculator = await ScoreCalculator.load();
    const result = calculator.calculate(scaledListening, scaledReading);
    estimatedScore = { listening: result.listening, reading: result.reading, total: result.total };

    // Mirrors attempts/[attemptId]/submit's completesOnboarding — a
    // placement test is just a much shorter way to reach the same "learner
    // now has a score baseline" moment a full mock attempt already reaches.
    onboardingCompleted = profile.onboardingStatus === "PLACEMENT_PENDING" && profile.targetScore !== null;

    await db.$transaction([
      db.scoreHistory.create({
        data: { userId: profile.id, listeningScore: result.listening, readingScore: result.reading, totalScore: result.total },
      }),
      db.profile.update({
        where: { id: profile.id },
        data: {
          currentScore: result.total,
          ...(onboardingCompleted ? { onboardingStatus: "READY" as const, onboardingCompletedAt: new Date() } : {}),
        },
      }),
    ]);

    if (onboardingCompleted) {
      void generateLearningPath({ userId: profile.id, targetScore: profile.targetScore!, examDate: profile.examDate }).catch((err) =>
        console.error("generateLearningPath failed", err)
      );
    }
  }

  return NextResponse.json({ mentorTestId, score, passed, correctCount, totalCount, estimatedScore, onboardingCompleted });
}
