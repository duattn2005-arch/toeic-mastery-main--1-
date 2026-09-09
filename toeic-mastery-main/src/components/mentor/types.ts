export interface NextStepSuggestionDTO {
  title: string;
  description: string;
  href: string;
  kind: "PART_PRACTICE" | "VOCAB_REVIEW" | "GRAMMAR_LESSON" | "FULL_TEST";
}

export type MentorAttachments =
  | { type: "next_steps"; items: NextStepSuggestionDTO[] }
  | { type: "mentor_test"; mentorTestId: string; questionCount: number }
  | { type: "upgrade_nudge"; message: string }
  | null
  | undefined;

export interface MentorMessage {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  attachments: MentorAttachments;
  createdAt: string;
}

export interface MentorMessagesPage {
  messages: MentorMessage[];
  nextCursor: string | null;
}
