import "server-only";
import { db } from "@/lib/db";
import { NEW_MEMBER_OFFER_WINDOW_DAYS } from "@/lib/constants/billing";
import type { Profile } from "@/generated/prisma/client";

export interface NewMemberOfferState {
  eligible: boolean;
  /** ISO string (serializable to a Client Component) — null when not eligible. */
  deadline: string | null;
}

/** Free accounts get the welcome discount on every visit until they actually
 * complete a purchase — a SUCCESS or REFUNDED payment permanently disqualifies
 * them (a completed purchase was made, refund or not), but a PENDING/FAILED
 * one does not, so an abandoned or cancelled checkout doesn't cost them the
 * offer. `deadline` is a rolling countdown (now + NEW_MEMBER_OFFER_WINDOW_DAYS),
 * not a one-shot window from signup — it's cosmetic urgency, not the actual
 * eligibility check. */
export async function getNewMemberOfferState(
  profile: Pick<Profile, "id" | "plan">
): Promise<NewMemberOfferState> {
  if (profile.plan !== "FREE") return { eligible: false, deadline: null };

  const completedPayment = await db.payment.findFirst({
    where: { userId: profile.id, status: { in: ["SUCCESS", "REFUNDED"] } },
    select: { id: true },
  });
  if (completedPayment) return { eligible: false, deadline: null };

  const deadline = new Date(Date.now() + NEW_MEMBER_OFFER_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  return { eligible: true, deadline: deadline.toISOString() };
}
