import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthedProfileOrNull } from "@/lib/auth";
import { MENTOR_MESSAGES_PAGE_SIZE as PAGE_SIZE } from "@/lib/data/mentor";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getAuthedProfileOrNull();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const conversation = await db.mentorConversation.findUnique({ where: { id }, select: { userId: true } });
  if (!conversation || conversation.userId !== profile.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const cursor = new URL(request.url).searchParams.get("cursor");

  const page = await db.mentorMessage.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: { id: true, role: true, content: true, attachments: true, createdAt: true },
  });

  const nextCursor = page.length === PAGE_SIZE ? page[page.length - 1].id : null;

  // Walked newest-first for cursor pagination, rendered oldest-first —
  // reverse just this page before returning it.
  return NextResponse.json({ messages: [...page].reverse(), nextCursor });
}
