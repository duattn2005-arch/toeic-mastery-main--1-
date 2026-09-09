import "server-only";
import { db } from "@/lib/db";
import { isPro } from "@/lib/auth";
import { FREE_ANSWER_REVEALS_PER_PART_PER_DAY } from "@/lib/constants/limits";
import type { Profile } from "@/generated/prisma/client";
import type { TestPart } from "@/generated/prisma/enums";

/** Free-tier daily cap on "Chữa tức thì" (reveal answer + explanation) in
 * Practice mode — Pro is unlimited. Scoped per TestPart, not a flat total
 * across the whole account, so it's counted via the question's own `part`
 * rather than a plain AnswerRevealLog count. */
export async function hasReachedRevealLimit(
  profile: Pick<Profile, "id" | "plan" | "proExpiresAt">,
  part: TestPart
): Promise<boolean> {
  if (isPro(profile)) return false;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const revealsToday = await db.answerRevealLog.count({
    where: { userId: profile.id, createdAt: { gte: startOfToday }, question: { part } },
  });
  return revealsToday >= FREE_ANSWER_REVEALS_PER_PART_PER_DAY;
}
