import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthedProfileOrNull } from "@/lib/auth";
import { generateMentorTest } from "@/lib/services/mentor/mentor-test-generator";

/**
 * Generates the MentorTest behind a MINI_TEST LearningPathItem — curated
 * from the day's first focus Part, at whatever difficulty SkillUnlock says
 * this learner is currently on (see generateMentorTest). The frontend then
 * runs it via the same MentorTestRunnerDialog chat uses, and calls
 * .../items/[id]/complete only once it reports `passed: true`.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getAuthedProfileOrNull();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: itemId } = await params;

  const item = await db.learningPathItem.findUnique({
    where: { id: itemId },
    select: {
      itemType: true,
      day: { select: { focusParts: true, path: { select: { userId: true } } } },
    },
  });
  if (!item || item.day.path.userId !== profile.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (item.itemType !== "MINI_TEST") {
    return NextResponse.json({ error: "Item này không phải bài kiểm tra" }, { status: 400 });
  }
  if (item.day.focusParts.length === 0) {
    return NextResponse.json({ error: "Ngày học này chưa có Part trọng tâm để tạo bài kiểm tra" }, { status: 400 });
  }

  const test = await generateMentorTest({
    userId: profile.id,
    dimensionType: "PART",
    dimensionKey: item.day.focusParts[0],
  });

  return NextResponse.json({ mentorTestId: test.mentorTestId, questionCount: test.questionCount });
}
