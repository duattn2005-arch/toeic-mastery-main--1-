import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthedProfileOrNull, isPro } from "@/lib/auth";
import { generatePlacementTest, PlacementTestUnavailableError } from "@/lib/services/mentor/mentor-test-generator";

/** A placement test is a one-shot diagnostic, not something worth retaking
 * daily — one free attempt per day is plenty of room for "oops, wrong
 * answers, let me try again" without opening it up as a free way to keep
 * re-rolling the question sample. Pro is unlimited, same as every other
 * free-tier cap in the app. */
const FREE_PLACEMENT_TESTS_PER_DAY = 1;

/**
 * The ONLY place a placement-test MentorTest ever gets created — hit
 * exclusively by the learner clicking "Làm bài kiểm tra đầu vào" (see
 * MentorOnboardingCard), never by the AI merely mentioning/recommending one
 * mid-chat. That distinction is deliberate: creating the row here is what
 * the free-tier daily cap below counts against, so a learner who's just
 * asking about it and hasn't actually clicked in is never charged for it.
 */
export async function POST(request: Request) {
  const profile = await getAuthedProfileOrNull();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isPro(profile)) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const takenToday = await db.mentorTest.count({
      where: { userId: profile.id, dimensionType: "PLACEMENT", createdAt: { gte: startOfToday } },
    });
    if (takenToday >= FREE_PLACEMENT_TESTS_PER_DAY) {
      return NextResponse.json({ error: "Bạn đã dùng hết lượt làm bài kiểm tra đầu vào miễn phí hôm nay." }, { status: 403 });
    }
  }

  const body = (await request.json().catch(() => null)) as { conversationId?: unknown } | null;
  const conversationId = typeof body?.conversationId === "string" ? body.conversationId : undefined;

  try {
    const result = await generatePlacementTest({ userId: profile.id, conversationId });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof PlacementTestUnavailableError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    throw err;
  }
}
