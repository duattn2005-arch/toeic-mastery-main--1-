import "server-only";
import { db } from "@/lib/db";
import { getOverallStats } from "@/lib/data/skill-stats";
import { computeXp } from "@/lib/services/xp";

/** Spendable XP shop balance — the account's lifetime rank XP (see
 * src/lib/services/xp.ts's computeXp, the same total the dashboard/vocabulary
 * path show) minus everything ever redeemed. Spending never touches
 * xpSpent's counterpart on the rank side, so redeeming an item can't lower
 * the account's level. Clamped at 0: a streak reset can drop the raw
 * computeXp() total below what's already been spent. */
export async function getSpendableXp(userId: string): Promise<number> {
  const [profile, stats] = await Promise.all([
    db.profile.findUniqueOrThrow({ where: { id: userId }, select: { streakCount: true, xpSpent: true } }),
    getOverallStats(userId),
  ]);
  const totalXp = computeXp(stats, profile.streakCount);
  return Math.max(0, totalXp - profile.xpSpent);
}

export async function getOwnedShopItemIds(userId: string): Promise<Set<string>> {
  const rows = await db.userShopItem.findMany({ where: { userId }, select: { itemId: true } });
  return new Set(rows.map((r) => r.itemId));
}
