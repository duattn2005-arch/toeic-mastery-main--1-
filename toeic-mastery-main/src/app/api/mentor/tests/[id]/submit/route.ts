import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthedProfileOrNull } from "@/lib/auth";
import { recordMentorTestOutcomes, unlockNextDifficulty } from "@/lib/services/mentor/skill-mastery";
import { ScoreCalculator } from "@/lib/services/score-calculator";
import { LISTENING_PARTS } from "@/lib/constants/toeic";
import { generateLearningPath } from "@/lib/services/mentor/learning-path-generator";
import { refreshLearningPathForUser } from "@/lib/services/mentor/learning-path-replanner";
import {
  evaluateLevelGate,
  recordLevelAdvance,
  generateRemediationTest,
  gradeRemediationTest,
  checkExtraAdvanceRequirements,
  type GradedGateQuestion,
  type GateableLevel,
  type CoreLabel,
  type ExtraAdvanceRequirements,
} from "@/lib/services/mentor/level-gate";
import type { TestPart, MentorLevel } from "@/generated/prisma/enums";

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
    include: {
      questions: { include: { question: { select: { correctLabel: true, part: true, grammarTopicSlug: true, strategicLabelSlugs: true } } } },
    },
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
  const graded: GradedGateQuestion[] = [];
  await Promise.all(
    mentorTest.questions.map((q) => {
      const selectedLabel = answerMap.get(q.questionId) ?? null;
      const isCorrect = selectedLabel !== null && selectedLabel === q.question.correctLabel;
      if (isCorrect) correctCount += 1;
      graded.push({
        part: q.question.part,
        grammarTopicSlug: q.question.grammarTopicSlug,
        strategicLabelSlugs: q.question.strategicLabelSlugs,
        isCorrect,
      });
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
  let levelGateResult = mentorTest.dimensionType === "LEVEL_GATE" ? evaluateLevelGate(graded) : null;
  // Gate Test score alone isn't the whole ADVANCE bar per the B/I source
  // docs — "từ vựng đã nhớ ≥70%" (both docs) and, for I→A specifically,
  // "Placement test ≥80%" must also hold. Re-check and downgrade to
  // REMEDIATE BEFORE `passed`/status get persisted below, so a learner who
  // clears the Gate Test but hasn't reviewed enough vocabulary never gets
  // recorded as having passed it.
  let extraRequirements: ExtraAdvanceRequirements | null = null;
  if (levelGateResult?.branch === "ADVANCE") {
    extraRequirements = await checkExtraAdvanceRequirements(profile.id, mentorTest.dimensionKey as MentorLevel);
    if (!extraRequirements.allOk) {
      levelGateResult = { ...levelGateResult, branch: "REMEDIATE" };
    }
  }
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
  const UNLOCKABLE_DIMENSIONS = new Set(["VOCAB_TOPIC", "PLACEMENT", "LEVEL_GATE", "REMEDIATION"]);
  if (passed && !UNLOCKABLE_DIMENSIONS.has(mentorTest.dimensionType)) {
    void unlockNextDifficulty(profile.id, mentorTest.dimensionType, mentorTest.dimensionKey, mentorTest.difficulty).catch((err) =>
      console.error("unlockNextDifficulty failed", err)
    );
  }

  // Every MentorTest submission moves SkillMastery (recordMentorTestOutcomes
  // above), so the "sống" (alive) LearningPath's still-LOCKED upcoming days
  // should reflect that immediately — previously only a full Attempt submit
  // (attempts/[attemptId]/submit/route.ts) triggered this, so passing/
  // failing an AI Mentor quiz (including a LEVEL_GATE Gate Test) never
  // visibly changed anything for the learner afterward. Fire-and-forget,
  // same as the calls above — a failure here must never fail the test
  // submission itself.
  void refreshLearningPathForUser(profile.id).catch((err) => console.error("refreshLearningPathForUser failed", err));

  let estimatedScore: { listening: number; reading: number; total: number } | null = null;
  let onboardingCompleted = false;
  let levelGate:
    | {
        branch: "ADVANCE" | "REMEDIATE" | "RESTART";
        fromLevel: string;
        toLevel: string;
        weakLabels: string[];
        hongLabels: string[];
        remediationTestId: string | null;
        /** Only set when the Gate Test itself scored ADVANCE-worthy — null
         * for a REMEDIATE/RESTART driven purely by the Gate Test score, so
         * the UI can tell "close but vocab/placement not there yet" apart
         * from "score too low". */
        extraRequirements: ExtraAdvanceRequirements | null;
      }
    | null = null;
  let remediation: { labelResults: { dimensionKey: string; score: number; cleared: boolean }[]; allCleared: boolean } | null = null;

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

    // "Học bù" tự động (mục 4 tài liệu PDF nguồn): ngay khi rớt gate,
    // curate luôn một MentorTest REMEDIATION cho tối đa 3 nhãn yếu nhất
    // (REMEDIATE) hoặc toàn bộ nhãn Hổng (RESTART) — người học không phải
    // tự quay lại xin bài tập, thấy CTA ngay trên kết quả Gate Test.
    let remediationTestId: string | null = null;
    if (result.branch !== "ADVANCE") {
      const labelsToBu = result.branch === "REMEDIATE" ? result.weakLabels : result.hongLabels;
      const remediationResult = await generateRemediationTest({
        userId: profile.id,
        sourceLevelGateTestId: mentorTestId,
        // A LEVEL_GATE test only ever gets created while mentorLevel is
        // BEGINNER/INTERMEDIATE (see asGateableLevel in
        // /api/mentor/level-gate), and nothing but a successful ADVANCE
        // branch above changes it — so at this point it's still one of
        // those two.
        fromLevel: fromLevel as GateableLevel,
        toLevel: toLevel as typeof profile.mentorLevel,
        labels: labelsToBu.map((l) => ({ dimensionType: l.dimensionType, dimensionKey: l.dimensionKey })),
      }).catch((err) => {
        console.error("generateRemediationTest failed", err);
        return null;
      });
      remediationTestId = remediationResult?.mentorTestId ?? null;
    }

    levelGate = {
      branch: result.branch,
      fromLevel,
      toLevel,
      weakLabels: result.weakLabels.map((l) => l.dimensionKey),
      hongLabels: result.hongLabels.map((l) => l.dimensionKey),
      remediationTestId,
      extraRequirements,
    };
  }

  // Chấm một bài học bù: mỗi nhãn được coi "đã bù" riêng (không phải một
  // điểm tổng duy nhất) — UI dùng `allCleared` để mời làm lại Gate Test.
  // `remediationLabels` là danh sách nhãn THỰC SỰ cần bù (không tính các
  // câu ôn thêm generateRemediationTest chèn vào) — allCleared chỉ xét
  // đúng tập này.
  if (mentorTest.dimensionType === "REMEDIATION") {
    const targetLabels = (mentorTest.remediationLabels as CoreLabel[] | null) ?? [];
    const result = gradeRemediationTest(graded, targetLabels);
    remediation = { labelResults: result.labelResults.map((l) => ({ dimensionKey: l.dimensionKey, score: l.score, cleared: l.cleared })), allCleared: result.allCleared };
  }

  return NextResponse.json({ mentorTestId, score, passed, correctCount, totalCount, estimatedScore, onboardingCompleted, levelGate, remediation });
}
