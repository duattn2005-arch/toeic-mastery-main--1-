import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { resolveMentorConversation, getInitialMentorMessages, listMentorConversations } from "@/lib/data/mentor";
import { getNextStepsRemainingToday } from "@/lib/services/mentor/mentor-access";
import { MentorPageClient } from "@/components/mentor/mentor-page-client";

export const metadata: Metadata = { title: "AI Mentor" };

export default async function MentorPage({
  searchParams,
}: {
  searchParams: Promise<{ questionId?: string; attemptId?: string; conversationId?: string; new?: string }>;
}) {
  const profile = await requireUser();
  const { questionId, attemptId, conversationId, new: forceNewParam } = await searchParams;

  const conversation = await resolveMentorConversation(profile.id, {
    questionId,
    attemptId,
    conversationId,
    forceNew: !!forceNewParam,
  });

  const [initialPage, conversations, nextStepsRemainingToday] = await Promise.all([
    getInitialMentorMessages(conversation.id),
    listMentorConversations(profile.id),
    getNextStepsRemainingToday(profile),
  ]);

  return (
    <MentorPageClient
      conversationId={conversation.id}
      initialPage={initialPage}
      conversations={conversations}
      nextStepsRemainingToday={nextStepsRemainingToday}
      showOnboarding={profile.onboardingStatus === "NOT_STARTED"}
    />
  );
}
