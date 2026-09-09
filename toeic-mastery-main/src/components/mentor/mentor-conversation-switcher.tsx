"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, MessageSquarePlus, MessagesSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { MentorConversationSummary } from "@/lib/data/mentor";

async function fetchConversations(): Promise<MentorConversationSummary[]> {
  const res = await fetch("/api/mentor/conversations");
  if (!res.ok) throw new Error("Không tải được danh sách hội thoại");
  const body = (await res.json()) as { conversations: MentorConversationSummary[] };
  return body.conversations;
}

/**
 * Every past hội thoại is a real conversation (chat, "Gợi ý học tiếp"
 * quick actions, question-scoped chats) — switching navigates via the
 * `conversationId` query param, "Cuộc trò chuyện mới" via `new=1` (see
 * resolveMentorConversation in src/lib/data/mentor.ts for how the page
 * resolves both).
 */
export function MentorConversationSwitcher({
  activeConversationId,
  initialConversations,
}: {
  activeConversationId: string;
  initialConversations: MentorConversationSummary[];
}) {
  const router = useRouter();
  const { data: conversations } = useQuery({
    queryKey: ["mentor-conversations"],
    queryFn: fetchConversations,
    initialData: initialConversations,
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline">
          <MessagesSquare className="size-3.5" /> Hội thoại <ChevronDown className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuItem onSelect={() => router.push("/mentor?new=1")}>
          <MessageSquarePlus className="size-4" /> Cuộc trò chuyện mới
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {conversations.length === 0 ? (
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Chưa có hội thoại nào</DropdownMenuLabel>
        ) : (
          conversations.map((c) => (
            <DropdownMenuItem
              key={c.id}
              onSelect={() => router.push(`/mentor?conversationId=${c.id}`)}
              className={cn(c.id === activeConversationId && "bg-accent text-accent-foreground")}
            >
              <span className="truncate">{c.title || `Hội thoại ${new Date(c.lastMessageAt).toLocaleDateString("vi-VN")}`}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
