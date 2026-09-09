import "server-only";
import { db } from "@/lib/db";
import type { MentorMessage, MentorMessagesPage } from "@/components/mentor/types";

/** Must match PAGE_SIZE in src/app/api/mentor/conversations/[id]/messages/route.ts
 * — the client's useInfiniteQuery uses this same page size for every page
 * after the first, so the initial server-rendered page has to match or the
 * "load older" cursor math would be inconsistent. */
export const MENTOR_MESSAGES_PAGE_SIZE = 30;

export interface MentorConversationSummary {
  id: string;
  title: string | null;
  lastMessageAt: string;
}

/** For the conversation switcher dropdown — every ACTIVE conversation,
 * newest first. Same query/shape as GET /api/mentor/conversations, called
 * directly here since this always runs from a Server Component. */
export async function listMentorConversations(userId: string): Promise<MentorConversationSummary[]> {
  const conversations = await db.mentorConversation.findMany({
    where: { userId, status: "ACTIVE" },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
    select: { id: true, title: true, lastMessageAt: true },
  });
  return conversations.map((c) => ({ ...c, lastMessageAt: c.lastMessageAt.toISOString() }));
}

/**
 * Resolves which conversation `/mentor` should open, in priority order:
 * 1. An explicit `conversationId` (switching via the conversation
 *    dropdown) — used only if it's actually this user's own conversation;
 *    a stale/bad id silently falls through to the rest of this list rather
 *    than 404ing the whole page.
 * 2. A question-scoped visit ("Hỏi AI Mentor" from a review screen) always
 *    starts a fresh conversation — the origin context has to be right for
 *    that specific question, so it can't reuse whatever the learner was
 *    chatting about before.
 * 3. `forceNew` (the conversation dropdown's "Cuộc trò chuyện mới") always
 *    starts a fresh one even if an ACTIVE conversation exists.
 * 4. Otherwise, resumes the most recently active conversation (Module 5:
 *    "nhớ hôm qua vướng ở đâu"), or starts a brand-new one for a
 *    first-time visitor.
 */
export async function resolveMentorConversation(
  userId: string,
  options: { questionId?: string | null; attemptId?: string | null; conversationId?: string | null; forceNew?: boolean }
): Promise<{ id: string }> {
  if (options.conversationId) {
    const existing = await db.mentorConversation.findUnique({
      where: { id: options.conversationId },
      select: { id: true, userId: true },
    });
    if (existing && existing.userId === userId) return { id: existing.id };
  }

  if (options.questionId) {
    return db.mentorConversation.create({
      data: { userId, originQuestionId: options.questionId, originAttemptId: options.attemptId ?? null },
      select: { id: true },
    });
  }

  if (!options.forceNew) {
    const active = await db.mentorConversation.findFirst({
      where: { userId, status: "ACTIVE" },
      orderBy: { lastMessageAt: "desc" },
      select: { id: true },
    });
    if (active) return active;
  }

  return db.mentorConversation.create({ data: { userId }, select: { id: true } });
}

/** Server-rendered first page, in the same shape the client's paginated
 * fetch (GET .../messages) returns for every subsequent page. */
export async function getInitialMentorMessages(conversationId: string): Promise<MentorMessagesPage> {
  const page = await db.mentorMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: MENTOR_MESSAGES_PAGE_SIZE,
    select: { id: true, role: true, content: true, attachments: true, createdAt: true },
  });

  const nextCursor = page.length === MENTOR_MESSAGES_PAGE_SIZE ? page[page.length - 1].id : null;
  // Prisma's Json column comes back as `unknown` from the client's own
  // typings; every value actually written here is one of MentorAttachments'
  // shapes (see /api/mentor/messages and /api/mentor/next-steps, the only
  // writers), so this cast just reasserts what's already true at runtime.
  const messages = [...page].reverse().map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })) as unknown as MentorMessage[];

  return { messages, nextCursor };
}
