import "server-only";
import { db } from "@/lib/db";
import { isPro } from "@/lib/auth";
import { FREE_DICTIONARY_LOOKUPS_PER_DAY } from "@/lib/constants/limits";
import type { Profile } from "@/generated/prisma/client";

/** Free-tier daily cap on dictionary lookups ("Tra từ khi bôi đen") — Pro is
 * unlimited. Shared by both lookup paths: the selection-popup API route and
 * the full /dictionary/[word] page, which otherwise bypasses that route
 * entirely (server-side lookup). Counts DictionaryHistory rows rather than a
 * separate counter table, since every lookup already logs one there. */
export async function hasReachedDictionaryLimit(profile: Pick<Profile, "id" | "plan" | "proExpiresAt">): Promise<boolean> {
  if (isPro(profile)) return false;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const lookupsToday = await db.dictionaryHistory.count({
    where: { userId: profile.id, createdAt: { gte: startOfToday } },
  });
  return lookupsToday >= FREE_DICTIONARY_LOOKUPS_PER_DAY;
}
