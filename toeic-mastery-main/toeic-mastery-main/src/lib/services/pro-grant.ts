import "server-only";
import { db } from "@/lib/db";

/** Grants (or extends) Pro for a user — shared by the VNPay IPN handler,
 * manual bank-transfer approval, and the admin override, so "extend from
 * the existing expiry if it's still in the future, else from now" only
 * lives in one place. */
export async function grantProDays(userId: string, days: number): Promise<void> {
  const profile = await db.profile.findUniqueOrThrow({ where: { id: userId } });
  const now = new Date();
  const extendFrom = profile.proExpiresAt && profile.proExpiresAt > now ? profile.proExpiresAt : now;
  const proExpiresAt = new Date(extendFrom);
  proExpiresAt.setDate(proExpiresAt.getDate() + days);
  await db.profile.update({ where: { id: userId }, data: { plan: "PRO", proExpiresAt } });
}
