import "server-only";
import { db } from "@/lib/db";
import { completeMentorTask } from "./llm-client";

/** Re-summarize once at least this many new turns have piled up since the
 * last summary — keeps the background-model call infrequent (cheap) while
 * still keeping MentorMemory reasonably current. */
const SUMMARIZE_EVERY_N_MESSAGES = 20;

/**
 * Module 5 ("nhớ hôm qua user vướng ở đâu"): folds unsummarized
 * MentorMessage rows into the single rolling MentorMemory.summary, so the
 * next conversation's context (mentor-context.ts) stays a short paragraph
 * instead of replaying the full history. Fire-and-forget from the chat
 * route after each assistant turn — a missed/failed summarization just
 * means next turn's memory is one turn stale, never a hard failure.
 */
export async function maybeSummarizeMemory(userId: string): Promise<void> {
  const memory = await db.mentorMemory.findUnique({ where: { userId }, select: { summary: true, summarizedThrough: true } });

  const unsummarized = await db.mentorMessage.findMany({
    where: {
      conversation: { userId },
      role: { not: "SYSTEM" },
      ...(memory?.summarizedThrough ? { createdAt: { gt: memory.summarizedThrough } } : {}),
    },
    orderBy: { createdAt: "asc" },
    select: { role: true, content: true, createdAt: true },
  });

  if (unsummarized.length < SUMMARIZE_EVERY_N_MESSAGES) return;

  const transcript = unsummarized.map((m) => `${m.role === "ASSISTANT" ? "Mentor" : "Học viên"}: ${m.content}`).join("\n");

  const summary = await completeMentorTask({
    system:
      "Tóm tắt ngắn gọn (tối đa 6 câu, tiếng Việt) những điểm quan trọng cần nhớ cho lần trò chuyện tiếp theo với học viên này: đang vướng ở đâu, đã hẹn ôn lại gì, tiến độ tổng thể ra sao. Đây là trí nhớ dài hạn của một AI Mentor, không phải bản ghi lại đầy đủ cuộc trò chuyện.",
    messages: [
      {
        role: "user",
        content: `${memory?.summary ? `Tóm tắt trước đó:\n${memory.summary}\n\n` : ""}Đoạn hội thoại mới cần gộp vào:\n${transcript}`,
      },
    ],
    maxTokens: 400,
  });

  const summarizedThrough = unsummarized[unsummarized.length - 1].createdAt;

  await db.mentorMemory.upsert({
    where: { userId },
    create: { userId, summary, summarizedThrough },
    update: { summary, summarizedThrough },
  });
}
