import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthedProfileOrNull } from "@/lib/auth";

export async function GET() {
  const profile = await getAuthedProfileOrNull();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const conversations = await db.mentorConversation.findMany({
    where: { userId: profile.id, status: "ACTIVE" },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
    select: { id: true, title: true, lastMessageAt: true, createdAt: true },
  });

  return NextResponse.json({ conversations });
}

/** Creates a new conversation — plan-agnostic, every account can chat. */
export async function POST(request: Request) {
  const profile = await getAuthedProfileOrNull();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { questionId?: unknown; attemptId?: unknown } | null;
  const originQuestionId = typeof body?.questionId === "string" ? body.questionId : null;
  const originAttemptId = typeof body?.attemptId === "string" ? body.attemptId : null;

  const conversation = await db.mentorConversation.create({
    data: { userId: profile.id, originQuestionId, originAttemptId },
    select: { id: true, createdAt: true },
  });

  return NextResponse.json({ conversation });
}
