"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMentorSend } from "@/hooks/use-mentor-send";

type NextStepsError = Error & { upgradeRequired?: boolean };

async function requestNextSteps(conversationId: string): Promise<{ conversationId: string }> {
  const res = await fetch("/api/mentor/next-steps", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversationId }),
  });
  const body = await res.json();
  if (!res.ok) {
    const error: NextStepsError = new Error(body?.error ?? "Không lấy được gợi ý lúc này");
    error.upgradeRequired = !!body?.upgradeRequired;
    throw error;
  }
  return body;
}

/**
 * `nextStepsRemainingToday` is only ever a page-load snapshot (server
 * computed) — it's informational text on the button, not used to disable
 * it. The server is the source of truth for whether a request actually
 * succeeds; a spent daily cap surfaces as the mutation's own error message
 * (or, when triggered from natural chat rather than this button, as an
 * upgrade_nudge attachment in the thread — see mentor-message-bubble.tsx).
 * Tracking the count optimistically client-side would drift the moment a
 * suggestion comes from a normal chat reply instead of this button.
 */
export function MentorComposer({
  conversationId,
  nextStepsRemainingToday,
}: {
  conversationId: string;
  nextStepsRemainingToday: number | null;
}) {
  const [value, setValue] = React.useState("");
  const { send, isSending } = useMentorSend(conversationId);
  const queryClient = useQueryClient();

  const nextStepsMutation = useMutation({
    mutationFn: () => requestNextSteps(conversationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mentor-messages", conversationId] }),
  });
  const nextStepsError = nextStepsMutation.error as NextStepsError | null;

  function handleSend() {
    if (!value.trim() || isSending) return;
    const toSend = value;
    setValue("");
    void send(toSend);
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => nextStepsMutation.mutate()} disabled={nextStepsMutation.isPending}>
          <Sparkles className="size-3.5" />
          Gợi ý học tiếp
          {nextStepsRemainingToday !== null && ` (còn ${nextStepsRemainingToday} hôm nay)`}
        </Button>
        {nextStepsMutation.isError && (
          <span className="flex items-center gap-2 text-xs text-destructive">
            {nextStepsError?.message}
            {nextStepsError?.upgradeRequired && (
              <Link href="/pricing" className="font-medium underline">
                Nâng cấp Pro
              </Link>
            )}
          </span>
        )}
      </div>

      <div className="flex items-end gap-2">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Hỏi AI Mentor bất cứ điều gì về TOEIC..."
          rows={2}
          disabled={isSending}
          className="min-h-0 flex-1 resize-none"
        />
        <Button size="icon" onClick={handleSend} disabled={isSending || !value.trim()} aria-label="Gửi">
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
