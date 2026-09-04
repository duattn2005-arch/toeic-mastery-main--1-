import "server-only";
import { db } from "@/lib/db";
import { NEW_MEMBER_OFFER_WINDOW_HOURS } from "@/lib/constants/billing";
import type { Profile } from "@/generated/prisma/client";

export interface NewMemberOfferState {
  eligible: boolean;
  /** ISO string (serializable to a Client Component) — null when not eligible. */
  deadline: string | null;
}

/** Free accounts get one shot at the welcome discount, within
 * NEW_MEMBER_OFFER_WINDOW_HOURS of signup — a hard, one-time deadline, not a
 * repeating cycle. A SUCCESS or REFUNDED payment disqualifies them early (a
 * completed purchase was made, refund or not), but a PENDING/FAILED one does
 * not, so an abandoned or cancelled checkout doesn't cost them the rest of
 * their window. */
export async function getNewMemberOfferState(
  profile: Pick<Profile, "id" | "plan" | "createdAt">
): Promise<NewMemberOfferState> {
  if (profile.plan !== "FREE") return { eligible: false, deadline: null };

  const deadline = new Date(profile.createdAt.getTime() + NEW_MEMBER_OFFER_WINDOW_HOURS * 60 * 60 * 1000);
  if (deadline <= new Date()) return { eligible: false, deadline: null };

  const completedPayment = await db.payment.findFirst({
    where: { userId: profile.id, status: { in: ["SUCCESS", "REFUNDED"] } },
    select: { id: true },
  });
  if (completedPayment) return { eligible: false, deadline: null };

  return { eligible: true, deadline: deadline.toISOString() };
}
