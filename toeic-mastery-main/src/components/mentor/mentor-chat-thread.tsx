"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { useMentorMessages } from "@/hooks/use-mentor-messages";
import { useMentorChatStore } from "@/store/mentor-chat-store";
import { MentorMessageBubble } from "./mentor-message-bubble";
import type { MentorMessagesPage } from "./types";

const NEAR_BOTTOM_THRESHOLD_PX = 200;

export function MentorChatThread({ conversationId, initialPage }: { conversationId: string; initialPage: MentorMessagesPage }) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useMentorMessages(conversationId, initialPage);
  const streamingText = useMentorChatStore((s) => (s.conversationId === conversationId ? s.streamingText : null));

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = React.useRef<number | null>(null);
  const pageCountRef = React.useRef(data.pages.length);
  const lastMessageCountRef = React.useRef(0);

  // pages[0] holds the newest chunk (cursor pagination walks backward in
  // time), each page already oldest-first internally — reverse the page
  // order, keep each page's own order, to get one oldest-to-newest list.
  const messages = React.useMemo(() => [...data.pages].reverse().flatMap((p) => p.messages), [data.pages]);

  // Loading an older page prepends content above the current viewport —
  // without correcting scrollTop by exactly how much the content grew, the
  // browser keeps the visual scroll *offset* fixed, which yanks the view
  // down to a completely different point in the conversation.
  React.useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && data.pages.length > pageCountRef.current && prevScrollHeightRef.current !== null) {
      el.scrollTop += el.scrollHeight - prevScrollHeightRef.current;
    }
    pageCountRef.current = data.pages.length;
    prevScrollHeightRef.current = null;
  }, [data.pages.length]);

  function handleLoadOlder() {
    prevScrollHeightRef.current = scrollRef.current?.scrollHeight ?? null;
    void fetchNextPage();
  }

  // Auto-scroll to the newest message — but only when the viewer is already
  // near the bottom, so someone scrolled up to reread older messages isn't
  // yanked back down by an incoming reply.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const grew = messages.length > lastMessageCountRef.current;
    lastMessageCountRef.current = messages.length;
    if (!grew) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_THRESHOLD_PX;
    if (nearBottom) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el || streamingText === null) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_THRESHOLD_PX;
    if (nearBottom) el.scrollTop = el.scrollHeight;
  }, [streamingText]);

  return (
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-1">
      <div className="flex flex-col gap-4 py-4">
        {hasNextPage && (
          <button
            type="button"
            onClick={handleLoadOlder}
            disabled={isFetchingNextPage}
            className="mx-auto flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent/40"
          >
            {isFetchingNextPage && <Loader2 className="size-3 animate-spin" />}
            Xem tin nhắn cũ hơn
          </button>
        )}

        {messages.map((message) => (
          <MentorMessageBubble key={message.id} message={message} />
        ))}

        {streamingText !== null && (
          <MentorMessageBubble
            message={{
              id: "__streaming__",
              role: "ASSISTANT",
              content: streamingText || "…",
              attachments: null,
              createdAt: new Date().toISOString(),
            }}
          />
        )}
      </div>
    </div>
  );
}
