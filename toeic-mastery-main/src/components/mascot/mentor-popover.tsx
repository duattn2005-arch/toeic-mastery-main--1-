"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MentorChatThread } from "@/components/mentor/mentor-chat-thread";
import { MentorComposer } from "@/components/mentor/mentor-composer";
import type { MentorMessagesPage } from "@/components/mentor/types";

interface MentorSession {
  conversationId: string;
  initialPage: MentorMessagesPage;
  nextStepsRemainingToday: number | null;
}

async function fetchMentorSession(): Promise<MentorSession> {
  const res = await fetch("/api/mentor/session");
  if (!res.ok) throw new Error("Không mở được AI Mentor");
  return res.json();
}

/**
 * The mascot's quick-access entry into AI Mentor — a slide-in panel instead
 * of navigating away to /mentor, so asking a question doesn't lose whatever
 * page (exam, dashboard, results) the learner was on. Has no server-rendered
 * props to seed it (it mounts on arbitrary client pages), so it fetches its
 * own bootstrap data from /api/mentor/session the first time it's opened.
 */
export function MentorPopover({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [session, setSession] = React.useState<MentorSession | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open || session) return;
    let cancelled = false;
    fetchMentorSession()
      .then((data) => {
        if (!cancelled) setSession(data);
      })
      .catch(() => {
        if (!cancelled) setError("Không mở được AI Mentor, vui lòng thử lại.");
      });
    return () => {
      cancelled = true;
    };
  }, [open, session]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border">
          <SheetTitle>AI Mentor</SheetTitle>
        </SheetHeader>

        {!session && !error && (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="flex flex-1 items-center justify-center px-4 text-center text-sm text-muted-foreground">{error}</div>
        )}

        {session && (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4">
            <MentorChatThread conversationId={session.conversationId} initialPage={session.initialPage} />
            <MentorComposer conversationId={session.conversationId} nextStepsRemainingToday={session.nextStepsRemainingToday} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
