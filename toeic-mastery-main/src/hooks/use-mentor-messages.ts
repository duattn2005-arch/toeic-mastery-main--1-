"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import type { MentorMessagesPage } from "@/components/mentor/types";

async function fetchMentorMessagesPage(conversationId: string, cursor: string | null): Promise<MentorMessagesPage> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  const res = await fetch(`/api/mentor/conversations/${conversationId}/messages${query}`);
  if (!res.ok) throw new Error("Không tải được lịch sử trò chuyện");
  return res.json();
}

/**
 * Cursor walks backward in time ("next page" = older messages), seeded with
 * the server-rendered first page so the initial view never shows a loading
 * spinner — see src/lib/data/mentor.ts's getInitialMentorMessages, which
 * produces the exact same page shape.
 */
export function useMentorMessages(conversationId: string, initialPage: MentorMessagesPage) {
  return useInfiniteQuery({
    queryKey: ["mentor-messages", conversationId],
    queryFn: ({ pageParam }) => fetchMentorMessagesPage(conversationId, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialData: { pages: [initialPage], pageParams: [null] },
  });
}
