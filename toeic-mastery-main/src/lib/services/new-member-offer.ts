import "server-only";
import { db } from "@/lib/db";
import { NEW_MEMBER_OFFER_WINDOW_DAYS } from "@/lib/constants/billing";
import type { Profile } from "@/generated/prisma/client";

export interface NewMemberOfferState {
  eligible: boolean;
  /** ISO string (serializable to a Client Component) — null when not eligible. */
  deadline: string | null;
}

/** Free accounts get one shot at the welcome discount, within
 * NEW_MEMBER_OFFER_WINDOW_DAYS of signup and only before they've ever
 * declared a payment — once a Payment row exists (even PENDING/unpaid),
 * they've already used their shot, so a cancelled or abandoned checkout
 * can't be replayed for a fresh discount. */
export async function getNewMemberOfferState(
  profile: Pick<Profile, "id" | "plan" | "createdAt">
): Promise<NewMemberOfferState> {
  if (profile.plan !== "FREE") return { eligible: false, deadline: null };

  const deadline = new Date(profile.createdAt.getTime() + NEW_MEMBER_OFFER_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  if (deadline <= new Date()) return { eligible: false, deadline: null };

  const existingPayment = await db.payment.findFirst({ where: { userId: profile.id }, select: { id: true } });
  if (existingPayment) return { eligible: false, deadline: null };

  return { eligible: true, deadline: deadline.toISOString() };
}
