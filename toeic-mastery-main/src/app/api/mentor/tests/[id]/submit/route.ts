import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthedProfileOrNull } from "@/lib/auth";
import { recordMentorTestOutcomes, unlockNextDifficulty } from "@/lib/services/mentor/skill-mastery";
import { ScoreCalculator } from "@/lib/services/score-calculator";
import { LISTENING_PARTS } from "@/lib/constants/toeic";
import { generateLearningPath } from "@/lib/services/mentor/learning-path-generator";
import { evaluateLevelGate, recordLevelAdvance } from "@/lib/services/mentor/level-gate";
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
    include: { questions: { include: { question: { select: { correctLabel: true, part: true, grammarTopicSlug: true } } } } },
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
  const graded: { part: TestPart; grammarTopicSlug: string | null; isCorrect: boolean }[] = [];
  await Promise.all(
    mentorTest.questions.map((q) => {
      const selectedLabel = answerMap.get(q.questionId) ?? null;
      const isCorrect = selectedLabel !== null && selectedLabel === q.question.correctLabel;
      if (isCorrect) correctCount += 1;
      graded.push({ part: q.question.part, grammarTopicSlug: q.question.grammarTopicSlug, isCorrect });
      return db.mentorTestQuestion.update({ where: { id: q.id }, data: { selectedLabel, isCorrect, answeredAt: new Date() } });
    })
  );

  const totalCount = mentorTest.questions.length;
  const score = totalCount > 0 ? correctCount / totalCount : 0;

  // A LEVEL_GATE test's real pass/fail is the 3-branch outcome (ADVANCE vs
  // REMEDIATE/RESTART), not the plain score>=passThreshold check every
  // other MentorTest uses — those disagree exactly when the overall score
  // clears 80% but a core label is still "Hổng" (evaluateLevelGate calls
  // that REMEDIATE, not a pass). Compute the branch up front so `passed`
  // and the stored `status` stay consistent with it instead of the
  // generic threshold.
  const levelGateResult = mentorTest.dimensionType === "LEVEL_GATE" ? evaluateLevelGate(graded) : null;
  const passed = levelGateResult ? levelGateResult.branch === "ADVANCE" : score >= mentorTest.passThreshold;

  await db.mentorTest.update({
    where: { id: mentorTestId },
    data: { status: passed ? "PASSED" : "FAILED", score, completedAt: new Date() },
  });

  // Fire-and-forget: fold this test's outcomes back into SkillMastery, and
  // on a pass, record that this dimension's tested tier is now cleared. A
  // PLACEMENT or LEVEL_GATE test has no real single "dimension" to unlock
  // (dimensionKey is "ALL" / a target MentorLevel, not a SkillUnlock key)
  // — see the estimated-score/levelGate branches below for what they do
  // instead.
  void recordMentorTestOutcomes(profile.id, mentorTestId).catch((err) => console.error("recordMentorTestOutcomes failed", err));
  if (passed && mentorTest.dimensionType !== "VOCAB_TOPIC" && mentorTest.dimensionType !== "PLACEMENT" && mentorTest.dimensionType !== "LEVEL_GATE") {
    void unlockNextDifficulty(profile.id, mentorTest.dimensionType, mentorTest.dimensionKey, mentorTest.difficulty).catch((err) =>
      console.error("unlockNextDifficulty failed", err)
    );
  }

  let estimatedScore: { listening: number; reading: number; total: number } | null = null;
  let onboardingCompleted = false;
  let levelGate: { branch: "ADVANCE" | "REMEDIATE" | "RESTART"; fromLevel: string; toLevel: string; weakLabels: string[]; hongLabels: string[] } | null = null;

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

  // AI Mentor level gate (mục 10 trong docs/ai-mentor-architecture.md):
  // dimensionKey on a LEVEL_GATE test is the target MentorLevel being
  // tested for ("INTERMEDIATE"/"ADVANCED") — evaluateLevelGate re-derives
  // the 3-branch outcome straight from this submission's own graded
  // questions rather than lifetime SkillMastery, so the result reflects
  // exactly what the learner just did on this Gate Test.
  if (levelGateResult) {
    const fromLevel = profile.mentorLevel;
    const toLevel = mentorTest.dimensionKey;
    const result = levelGateResult;

    if (result.branch === "ADVANCE") {
      void recordLevelAdvance({
        userId: profile.id,
        fromLevel,
        toLevel: toLevel as typeof profile.mentorLevel,
        overallScore: result.overallScore,
        labelScores: result.labelScores,
      }).catch((err) => console.error("recordLevelAdvance failed", err));
    }

    levelGate = {
      branch: result.branch,
      fromLevel,
      toLevel,
      weakLabels: result.weakLabels.map((l) => l.dimensionKey),
      hongLabels: result.hongLabels.map((l) => l.dimensionKey),
    };
  }

  return NextResponse.json({ mentorTestId, score, passed, correctCount, totalCount, estimatedScore, onboardingCompleted, levelGate });
}
