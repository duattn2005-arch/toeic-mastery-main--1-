import "server-only";
import { db } from "@/lib/db";
import { isPro } from "@/lib/auth";
import { FREE_MENTOR_NEXT_STEPS_PER_DAY, FREE_MENTOR_SUGGESTED_ITEMS } from "@/lib/constants/limits";
import type { Profile } from "@/generated/prisma/client";

/**
 * AI Mentor chat is fully open for every plan — Free and Pro both get the
 * same conversational interface and can ask literally anything. The only
 * gated surface is the "next step" learning-path suggestion (Module 1/3 —
 * either the assistant proactively attaching one via the
 * RECOMMEND_NEXT_STEPS marker in /api/mentor/messages, or the standalone
 * /api/mentor/next-steps quick action): Free gets
 * FREE_MENTOR_NEXT_STEPS_PER_DAY of those per day, Pro is unlimited.
 */
export interface MentorAccess {
  maxSuggestedItems: number;
  /** True for Pro (or lifetime/admin-granted Pro) — no daily cap on next-step suggestions. */
  unlimitedNextSteps: boolean;
}

export function getMentorAccess(profile: Pick<Profile, "plan" | "proExpiresAt">): MentorAccess {
  return { maxSuggestedItems: FREE_MENTOR_SUGGESTED_ITEMS, unlimitedNextSteps: isPro(profile) };
}

/**
 * Counts today's next-step suggestions already served — both the chat
 * marker path and the standalone quick action write the exact same
 * `attachments: {type: "next_steps", ...}` shape, so counting by that
 * shape (rather than a separate counter table) covers both for free, same
 * convention as dictionary-limit.ts/reveal-limit.ts.
 */
async function countNextStepsUsedToday(userId: string): Promise<number> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  return db.mentorMessage.count({
    where: {
      role: "ASSISTANT",
      createdAt: { gte: startOfToday },
      conversation: { userId },
      attachments: { path: ["type"], equals: "next_steps" },
    },
  });
}

/** Remaining next-step suggestions for today — null means unlimited (Pro). */
export async function getNextStepsRemainingToday(profile: Pick<Profile, "id" | "plan" | "proExpiresAt">): Promise<number | null> {
  if (isPro(profile)) return null;
  const usedToday = await countNextStepsUsedToday(profile.id);
  return Math.max(0, FREE_MENTOR_NEXT_STEPS_PER_DAY - usedToday);
}

export async function hasReachedNextStepsLimit(profile: Pick<Profile, "id" | "plan" | "proExpiresAt">): Promise<boolean> {
  const remaining = await getNextStepsRemainingToday(profile);
  return remaining !== null && remaining <= 0;
}
