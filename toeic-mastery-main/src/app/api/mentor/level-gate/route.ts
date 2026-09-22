import { NextResponse } from "next/server";
import { getAuthedProfileOrNull } from "@/lib/auth";
import { isEligibleForLevelGate, generateLevelGateTest, LevelGateNotEligibleError, LevelGateUnavailableError, type GateableLevel } from "@/lib/services/mentor/level-gate";

function asGateableLevel(level: string): GateableLevel | null {
  return level === "BEGINNER" || level === "INTERMEDIATE" ? level : null;
}

/**
 * GET: eligibility status for the learner's NEXT level gate — powers the
 * "Làm Gate Test" card (progress toward the sample-size bar, or already
 * eligible). Cấp A (mentorLevel already ADVANCED) has no further gate yet.
 */
export async function GET() {
  const profile = await getAuthedProfileOrNull();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentLevel = asGateableLevel(profile.mentorLevel);
  if (!currentLevel) {
    return NextResponse.json({ mentorLevel: profile.mentorLevel, hasNextGate: false });
  }

  const eligibility = await isEligibleForLevelGate(profile.id, currentLevel);
  return NextResponse.json({ mentorLevel: profile.mentorLevel, hasNextGate: true, ...eligibility });
}

/**
 * POST: the ONLY place a LEVEL_GATE MentorTest ever gets created — hit
 * exclusively by the learner clicking into the Gate Test once eligible
 * (mirrors placement-test/route.ts's same rule for the same reason: the AI
 * mentor may only ever mention/recommend this in chat, never trigger it).
 */
export async function POST(request: Request) {
  const profile = await getAuthedProfileOrNull();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentLevel = asGateableLevel(profile.mentorLevel);
  if (!currentLevel) {
    return NextResponse.json({ error: "Cấp độ hiện tại chưa có Gate Test tiếp theo." }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as { conversationId?: unknown } | null;
  const conversationId = typeof body?.conversationId === "string" ? body.conversationId : undefined;

  try {
    const result = await generateLevelGateTest({ userId: profile.id, currentLevel, conversationId });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof LevelGateNotEligibleError) {
      return NextResponse.json({ error: err.message, eligibility: err.eligibility }, { status: 403 });
    }
    if (err instanceof LevelGateUnavailableError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    throw err;
  }
}
