import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthedProfileOrNull } from "@/lib/auth";
import { getMentorAccess, hasReachedNextStepsLimit } from "@/lib/services/mentor/mentor-access";
import { getNextStepSuggestions } from "@/lib/services/mentor/next-steps";
import type { Prisma } from "@/generated/prisma/client";

/** Prisma's Json input type requires structural compatibility our narrow
 * interfaces don't declare (no index signature) — this is a plain data cast. */
function toJsonInput<T>(value: T): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

/**
 * "Gợi ý học tiếp" quick action — the same suggestion the chat marker
 * RECOMMEND_NEXT_STEPS produces (see /api/mentor/messages), reachable
 * without typing a question. Available to every plan; Free is capped at
 * FREE_MENTOR_NEXT_STEPS_PER_DAY/day, Pro is unlimited (mentor-access.ts).
 * When `conversationId` is given, the request/response pair is appended to
 * that thread like a normal chat turn; otherwise a fresh conversation is
 * created (used by the standalone entry point before any chat exists yet).
 */
export async function POST(request: Request) {
  const profile = await getAuthedProfileOrNull();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = getMentorAccess(profile);

  if (!access.unlimitedNextSteps && (await hasReachedNextStepsLimit(profile))) {
    return NextResponse.json(
      {
        error: "Bạn đã dùng hết lượt gợi ý lộ trình hôm nay (4 lần/ngày cho tài khoản Free). Nâng cấp Pro để nhận gợi ý không giới hạn.",
        upgradeRequired: true,
      },
      { status: 429 }
    );
  }

  const body = (await request.json().catch(() => null)) as { conversationId?: unknown } | null;
  const requestedConversationId = typeof body?.conversationId === "string" ? body.conversationId : null;

  let conversationId = requestedConversationId;
  if (conversationId) {
    const conversation = await db.mentorConversation.findUnique({ where: { id: conversationId }, select: { userId: true } });
    if (!conversation || conversation.userId !== profile.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  } else {
    const created = await db.mentorConversation.create({ data: { userId: profile.id, title: "Gợi ý học tiếp" }, select: { id: true } });
    conversationId = created.id;
  }

  const suggestions = await getNextStepSuggestions(profile.id, access.maxSuggestedItems);

  const summaryText =
    suggestions.length > 0
      ? `Dựa trên tiến độ gần đây, đây là ${suggestions.length} việc nên làm tiếp theo:\n` +
        suggestions.map((s, i) => `${i + 1}. ${s.title} — ${s.description}`).join("\n")
      : "Chưa đủ dữ liệu để đưa ra gợi ý — hãy hoàn thành ít nhất một bài luyện tập trước.";

  await db.mentorMessage.create({ data: { conversationId, role: "USER", content: "[Yêu cầu gợi ý học tiếp]" } });
  const assistantMessage = await db.mentorMessage.create({
    data: {
      conversationId,
      role: "ASSISTANT",
      content: summaryText,
      attachments: toJsonInput({ type: "next_steps", items: suggestions }),
    },
    select: { id: true },
  });
  await db.mentorConversation.update({ where: { id: conversationId }, data: { lastMessageAt: new Date() } });

  return NextResponse.json({ conversationId, messageId: assistantMessage.id, suggestions });
}
