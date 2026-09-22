"use client";

import Link from "next/link";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MentorChatThread } from "./mentor-chat-thread";
import { MentorComposer } from "./mentor-composer";
import { MentorOnboardingCard } from "./mentor-onboarding-card";
import { MentorLevelGateCard } from "./mentor-level-gate-card";
import { MentorConversationSwitcher } from "./mentor-conversation-switcher";
import type { MentorMessagesPage } from "./types";
import type { MentorConversationSummary } from "@/lib/data/mentor";

export function MentorPageClient({
  conversationId,
  initialPage,
  conversations,
  nextStepsRemainingToday,
  showOnboarding,
}: {
  conversationId: string;
  initialPage: MentorMessagesPage;
  conversations: MentorConversationSummary[];
  /** null = unlimited (Pro) — see mentor-access.ts. */
  nextStepsRemainingToday: number | null;
  showOnboarding: boolean;
}) {
  // AppShell's <main> isn't itself height-bound (the app defaults to
  // page-level scroll), so the chat pane needs an explicit height to get
  // its own internal scroll region with a composer pinned at the bottom.
  // Matches AppShell's chrome (h-16 header + main's pt-6/pb-20 mobile or
  // pt-6/lg:pb-8 desktop — see app-shell.tsx) plus this page's own header
  // row + gap (~3.25rem).
  return (
    <div className="flex h-[calc(100svh-13.75rem)] flex-col gap-4 lg:h-[calc(100svh-10.75rem)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold tracking-tight">AI Mentor</h1>
        <div className="flex items-center gap-2">
          <MentorConversationSwitcher activeConversationId={conversationId} initialConversations={conversations} />
          <Button size="sm" variant="outline" asChild>
            <Link href="/mentor/path">
              <Calendar className="size-3.5" /> Lộ trình học
            </Link>
          </Button>
        </div>
      </div>

      {showOnboarding && <MentorOnboardingCard />}
      {!showOnboarding && <MentorLevelGateCard />}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card/50 p-4 shadow-soft">
        {/* Keyed on conversationId so switching conversations remounts fresh
         * — the thread's scroll/ref bookkeeping and the composer's draft
         * text are tied to *a* conversation, not meant to survive a switch
         * to a different one. */}
        <MentorChatThread key={`${conversationId}-thread`} conversationId={conversationId} initialPage={initialPage} />
        <MentorComposer key={`${conversationId}-composer`} conversationId={conversationId} nextStepsRemainingToday={nextStepsRemainingToday} />
      </div>
    </div>
  );
}
