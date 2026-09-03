import "server-only";
import { db } from "@/lib/db";
import { isPro } from "@/lib/auth";
import { FREE_ANSWER_REVEALS_PER_DAY } from "@/lib/constants/limits";
import type { Profile } from "@/generated/prisma/client";

/** Free-tier daily cap on "Chữa tức thì" (reveal answer + explanation) in
 * Practice mode — Pro is unlimited. Counts AnswerRevealLog rows rather than
 * a separate counter, mirroring hasReachedDictionaryLimit's pattern. */
export async function hasReachedRevealLimit(profile: Pick<Profile, "id" | "plan" | "proExpiresAt">): Promise<boolean> {
  if (isPro(profile)) return false;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const revealsToday = await db.answerRevealLog.count({
    where: { userId: profile.id, createdAt: { gte: startOfToday } },
  });
  return revealsToday >= FREE_ANSWER_REVEALS_PER_DAY;
}
