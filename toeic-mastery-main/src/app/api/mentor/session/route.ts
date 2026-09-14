import { NextResponse } from "next/server";
import { getAuthedProfileOrNull } from "@/lib/auth";
import { resolveMentorConversation, getInitialMentorMessages } from "@/lib/data/mentor";
import { getNextStepsRemainingToday } from "@/lib/services/mentor/mentor-access";

/**
 * Same bootstrap the /mentor page does server-side (resolve-or-create the
 * conversation to resume, its first message page, today's next-steps
 * quota), exposed as JSON for the mascot's chat popover — which opens from
 * arbitrary client pages and has no server-rendered props of its own to
 * seed with. Skips the conversation list the full page uses for its
 * switcher — the popover is a single-thread quick-access surface.
 */
export async function GET() {
  const profile = await getAuthedProfileOrNull();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const conversation = await resolveMentorConversation(profile.id, {});

  const [initialPage, nextStepsRemainingToday] = await Promise.all([
    getInitialMentorMessages(conversation.id),
    getNextStepsRemainingToday(profile),
  ]);

  return NextResponse.json({ conversationId: conversation.id, initialPage, nextStepsRemainingToday });
}
