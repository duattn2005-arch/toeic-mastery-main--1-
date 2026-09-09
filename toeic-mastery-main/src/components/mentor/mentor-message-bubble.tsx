"use client";

import * as React from "react";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { MentorNextStepsCard } from "./mentor-next-steps-card";
import { MentorTestCard } from "./mentor-test-card";
import { MentorUpgradeNudgeCard } from "./mentor-upgrade-nudge-card";
import type { MentorMessage } from "./types";

/**
 * Memoized by message identity so a token arriving for the (separately
 * rendered, Zustand-driven) streaming bubble never re-renders every
 * finished bubble above it — see docs/ai-mentor-architecture.md §3.3.
 */
function MentorMessageBubbleImpl({ message }: { message: MentorMessage }) {
  const isUser = message.role === "USER";
  const attachments = message.attachments;

  return (
    <div className={cn("flex gap-2.5", isUser && "flex-row-reverse")}>
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
        )}
      >
        {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
      </span>
      <div className={cn("flex max-w-[85%] flex-col gap-2", isUser ? "items-end" : "items-start")}>
        {message.content && (
          <div
            className={cn(
              "whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
              isUser ? "rounded-tr-sm bg-primary text-primary-foreground" : "rounded-tl-sm border border-border bg-card text-foreground"
            )}
          >
            {message.content}
          </div>
        )}
        {attachments?.type === "next_steps" && <MentorNextStepsCard items={attachments.items} />}
        {attachments?.type === "mentor_test" && (
          <MentorTestCard mentorTestId={attachments.mentorTestId} questionCount={attachments.questionCount} />
        )}
        {attachments?.type === "upgrade_nudge" && <MentorUpgradeNudgeCard message={attachments.message} />}
      </div>
    </div>
  );
}

export const MentorMessageBubble = React.memo(MentorMessageBubbleImpl);
