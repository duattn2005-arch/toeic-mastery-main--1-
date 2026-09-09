import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthedProfileOrNull } from "@/lib/auth";
import { getMentorAccess, hasReachedNextStepsLimit } from "@/lib/services/mentor/mentor-access";
import { buildMentorContext } from "@/lib/services/mentor/mentor-context";
import { streamMentorReply, getActiveChatModelId, MentorConfigError } from "@/lib/services/mentor/llm-client";
import { maybeSummarizeMemory } from "@/lib/services/mentor/memory-summarizer";
import { generateMentorTest } from "@/lib/services/mentor/mentor-test-generator";
import { getNextStepSuggestions } from "@/lib/services/mentor/next-steps";
import type { SkillDimensionType } from "@/generated/prisma/enums";

/**
 * Open-ended chat for every plan, streamed over SSE (see
 * docs/ai-mentor-architecture.md §2/§3.1 for the full sequence and why SSE
 * over a Route Handler rather than WebSocket or the Vercel AI SDK). General
 * conversation has no cap for either tier — the only gated surface is the
 * "next step" learning-path suggestion, handled below via the
 * RECOMMEND_NEXT_STEPS marker (see mentor-access.ts).
 */

/** Trailing directive markers the model is instructed to emit (see
 * mentor-context.ts's system prompt) instead of a native tool call —
 * hand-rolled since this project isn't using the Vercel AI SDK's
 * tool-calling plumbing. At most one marker per reply. */
const RECOMMEND_TEST_MARKER = /\n?\[\[RECOMMEND_TEST:(PART|GRAMMAR_TOPIC):([A-Za-z0-9_-]+)\]\]\s*$/;
const RECOMMEND_NEXT_STEPS_MARKER = /\n?\[\[RECOMMEND_NEXT_STEPS\]\]\s*$/;

type MentorAttachments =
  | { type: "mentor_test"; mentorTestId: string; questionCount: number }
  | { type: "next_steps"; items: Awaited<ReturnType<typeof getNextStepSuggestions>> }
  | { type: "upgrade_nudge"; message: string }
  | undefined;

export async function POST(request: Request) {
  const profile = await getAuthedProfileOrNull();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = getMentorAccess(profile);

  const body = (await request.json().catch(() => null)) as { conversationId?: unknown; content?: unknown } | null;
  const conversationId = typeof body?.conversationId === "string" ? body.conversationId : null;
  const content = typeof body?.content === "string" ? body.content.trim() : "";

  if (!conversationId || !content) {
    return NextResponse.json({ error: "conversationId và content là bắt buộc" }, { status: 400 });
  }

  const conversation = await db.mentorConversation.findUnique({
    where: { id: conversationId },
    select: { userId: true, originQuestionId: true, originAttemptId: true },
  });
  if (!conversation || conversation.userId !== profile.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Build context from history BEFORE persisting this turn's user message —
  // buildMentorContext's history query would otherwise pick up this exact
  // message and it'd end up duplicated when appended to `messages` below.
  const context = await buildMentorContext({
    userId: profile.id,
    conversationId,
    questionId: conversation.originQuestionId,
    attemptId: conversation.originAttemptId,
    latestUserMessage: content,
  });

  await db.mentorMessage.create({ data: { conversationId, role: "USER", content } });

  const encoder = new TextEncoder();
  const send = (controller: ReadableStreamDefaultController<Uint8Array>, event: string | null, data: unknown) => {
    controller.enqueue(encoder.encode(`${event ? `event: ${event}\n` : ""}data: ${JSON.stringify(data)}\n\n`));
  };

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let fullText = "";
      try {
        const gen = streamMentorReply({
          system: context.systemPrompt,
          messages: [...context.history, { role: "user", content }],
        });

        while (true) {
          const { value, done } = await gen.next();
          if (done) {
            const usage = value;
            const testMarker = fullText.match(RECOMMEND_TEST_MARKER);
            const nextStepsMarker = testMarker ? null : fullText.match(RECOMMEND_NEXT_STEPS_MARKER);
            const marker = testMarker ?? nextStepsMarker;
            const visibleText = marker ? fullText.slice(0, marker.index ?? fullText.length).trimEnd() : fullText;

            let attachments: MentorAttachments;

            if (testMarker) {
              try {
                const [, dimensionType, dimensionKey] = testMarker;
                const test = await generateMentorTest({
                  userId: profile.id,
                  dimensionType: dimensionType as SkillDimensionType,
                  dimensionKey,
                  conversationId,
                });
                attachments = { type: "mentor_test", mentorTestId: test.mentorTestId, questionCount: test.questionCount };
              } catch (err) {
                console.error("generateMentorTest from chat marker failed", err);
              }
            } else if (nextStepsMarker) {
              if (!access.unlimitedNextSteps && (await hasReachedNextStepsLimit(profile))) {
                attachments = {
                  type: "upgrade_nudge",
                  message:
                    "Bạn đã dùng hết lượt gợi ý lộ trình hôm nay (4 lần/ngày cho tài khoản Free). Nâng cấp Pro để nhận gợi ý lộ trình cá nhân hóa không giới hạn.",
                };
              } else {
                const items = await getNextStepSuggestions(profile.id, access.maxSuggestedItems);
                attachments = { type: "next_steps", items };
              }
            }

            const savedMessage = await db.mentorMessage.create({
              data: {
                conversationId,
                role: "ASSISTANT",
                content: visibleText,
                attachments,
                tokenCount: usage.outputTokens,
                modelId: getActiveChatModelId(),
              },
              select: { id: true },
            });
            await db.mentorConversation.update({ where: { id: conversationId }, data: { lastMessageAt: new Date() } });

            send(controller, "done", { messageId: savedMessage.id, attachments: attachments ?? null });
            break;
          }

          fullText += value;
          send(controller, null, { delta: value });
        }
      } catch (err) {
        console.error("mentor chat stream failed", err);
        // MentorConfigError's own message is safe to show (it only ever
        // names which env var is missing/invalid) and is far more
        // actionable for whoever manages the server than a generic retry
        // prompt — everything else stays generic so we never leak
        // unexpected internals (raw API responses, stack traces) to the
        // browser.
        const message = err instanceof MentorConfigError ? err.message : "AI Mentor tạm thời gặp sự cố, vui lòng thử lại.";
        send(controller, "error", { error: message });
      } finally {
        controller.close();
        void maybeSummarizeMemory(profile.id).catch((err) => console.error("maybeSummarizeMemory failed", err));
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
