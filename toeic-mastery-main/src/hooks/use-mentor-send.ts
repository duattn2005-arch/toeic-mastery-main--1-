"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMentorChatStore } from "@/store/mentor-chat-store";
import type { MentorMessage, MentorMessagesPage } from "@/components/mentor/types";

interface InfiniteMessagesData {
  pages: MentorMessagesPage[];
  pageParams: (string | null)[];
}

function appendOptimisticMessage(queryClient: ReturnType<typeof useQueryClient>, conversationId: string, message: MentorMessage) {
  queryClient.setQueryData<InfiniteMessagesData>(["mentor-messages", conversationId], (old) => {
    if (!old || old.pages.length === 0) return old;
    const [firstPage, ...rest] = old.pages;
    return { ...old, pages: [{ ...firstPage, messages: [...firstPage.messages, message] }, ...rest] };
  });
}

/**
 * Sends one chat turn and relays the SSE stream into useMentorChatStore
 * token by token. Deliberately hand-rolled (fetch + ReadableStream reader,
 * not EventSource — see docs/ai-mentor-architecture.md §3.1 for why: POST
 * body + cookie auth, neither of which EventSource supports).
 *
 * Once the server reports `done`, this reconciles with the source of truth
 * (invalidate + await the refetch) BEFORE clearing the streaming buffer, so
 * the finished bubble is already in the query cache the instant the
 * streaming placeholder disappears — no flash of missing content.
 */
export function useMentorSend(conversationId: string) {
  const queryClient = useQueryClient();
  const startStreaming = useMentorChatStore((s) => s.startStreaming);
  const appendDelta = useMentorChatStore((s) => s.appendDelta);
  const finishStreaming = useMentorChatStore((s) => s.finishStreaming);
  const setError = useMentorChatStore((s) => s.setError);
  const isSending = useMentorChatStore((s) => s.conversationId === conversationId && s.isSending);

  const send = React.useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;

      appendOptimisticMessage(queryClient, conversationId, {
        id: `optimistic-${Date.now()}`,
        role: "USER",
        content: trimmed,
        attachments: null,
        createdAt: new Date().toISOString(),
      });
      startStreaming(conversationId);

      try {
        const res = await fetch("/api/mentor/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, content: trimmed }),
        });

        if (!res.ok || !res.body) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? "AI Mentor tạm thời không phản hồi.");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let sawDone = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() ?? "";

          for (const chunk of chunks) {
            if (!chunk.trim()) continue;
            let eventName: string | null = null;
            let dataLine: string | null = null;
            for (const line of chunk.split("\n")) {
              if (line.startsWith("event: ")) eventName = line.slice(7);
              else if (line.startsWith("data: ")) dataLine = line.slice(6);
            }
            if (!dataLine) continue;
            const payload = JSON.parse(dataLine) as { delta?: string; error?: string };

            if (eventName === "error") {
              throw new Error(payload.error ?? "AI Mentor tạm thời gặp sự cố.");
            }
            if (eventName === "done") {
              sawDone = true;
              await queryClient.invalidateQueries({ queryKey: ["mentor-messages", conversationId] });
              finishStreaming();
            } else if (typeof payload.delta === "string") {
              appendDelta(payload.delta);
            }
          }
        }

        if (!sawDone) {
          // Connection dropped before a "done" event — reconcile with the
          // server anyway so nothing already saved server-side is lost.
          await queryClient.invalidateQueries({ queryKey: ["mentor-messages", conversationId] });
          finishStreaming();
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "AI Mentor tạm thời gặp sự cố, vui lòng thử lại.";
        setError(message);
        toast.error(message);
      }
    },
    [conversationId, queryClient, startStreaming, appendDelta, finishStreaming, setError]
  );

  return { send, isSending };
}
