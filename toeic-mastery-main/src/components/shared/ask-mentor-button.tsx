import Link from "next/link";
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Entry point into the "Tôi không hiểu câu hỏi này" flow (see
 * docs/ai-mentor-architecture.md §2) — deep-links into /mentor with this
 * question (and, when known, the attempt it was answered in) as the new
 * conversation's origin, so the first reply has full context without
 * asking the learner to repeat it.
 */
export function AskMentorButton({ questionId, attemptId }: { questionId: string; attemptId?: string }) {
  const params = new URLSearchParams({ questionId });
  if (attemptId) params.set("attemptId", attemptId);

  return (
    <Button size="sm" variant="outline" asChild>
      <Link href={`/mentor?${params.toString()}`}>
        <Bot className="size-3.5" /> Hỏi AI Mentor
      </Link>
    </Button>
  );
}
