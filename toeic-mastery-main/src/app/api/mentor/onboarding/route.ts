import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthedProfileOrNull } from "@/lib/auth";
import { generateLearningPath } from "@/lib/services/mentor/learning-path-generator";

/**
 * Captures the goal AI Mentor's onboarding chat collects (target score,
 * optional exam date). If the learner already has a score baseline
 * (`currentScore` — set by any submitted full-test attempt, placement or
 * otherwise), onboarding completes immediately and a LearningPath is
 * generated. Otherwise they're marked PLACEMENT_PENDING and the attempts
 * submit route (see completesOnboarding there) finishes the job the moment
 * their placement attempt is scored.
 */
export async function POST(request: Request) {
  const profile = await getAuthedProfileOrNull();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { targetScore?: unknown; examDate?: unknown } | null;
  const targetScore = typeof body?.targetScore === "number" ? Math.round(body.targetScore) : null;
  const examDate = typeof body?.examDate === "string" && body.examDate ? new Date(body.examDate) : null;

  if (targetScore === null || targetScore < 10 || targetScore > 990) {
    return NextResponse.json({ error: "targetScore phải là số từ 10 đến 990" }, { status: 400 });
  }
  if (examDate && Number.isNaN(examDate.getTime())) {
    return NextResponse.json({ error: "examDate không hợp lệ" }, { status: 400 });
  }

  const hasBaseline = profile.currentScore !== null;

  const updated = await db.profile.update({
    where: { id: profile.id },
    data: {
      targetScore,
      examDate,
      onboardingStatus: hasBaseline ? "READY" : "PLACEMENT_PENDING",
      onboardingCompletedAt: hasBaseline ? new Date() : null,
    },
    select: { onboardingStatus: true },
  });

  let pathId: string | null = null;
  if (hasBaseline) {
    const result = await generateLearningPath({ userId: profile.id, targetScore, examDate });
    pathId = result.pathId;
  }

  return NextResponse.json({
    onboardingStatus: updated.onboardingStatus,
    requiresPlacementTest: !hasBaseline,
    pathId,
  });
}
