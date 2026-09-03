import "server-only";
import { db } from "@/lib/db";
import { NEW_MEMBER_OFFER_WINDOW_DAYS } from "@/lib/constants/billing";
import type { Profile } from "@/generated/prisma/client";

export interface NewMemberOfferState {
  eligible: boolean;
  /** ISO string (serializable to a Client Component) — null when not eligible. */
  deadline: string | null;
}

const WINDOW_MS = NEW_MEMBER_OFFER_WINDOW_DAYS * 24 * 60 * 60 * 1000;

/** Free accounts get the welcome discount until they actually complete a
 * purchase — a SUCCESS or REFUNDED payment permanently disqualifies them (a
 * completed purchase was made, refund or not), but a PENDING/FAILED one does
 * not, so an abandoned or cancelled checkout doesn't cost them the offer.
 *
 * `deadline` is a real, fixed countdown — not recomputed as "now + WINDOW_MS"
 * on every request, which would silently reset to a full window on every
 * reload and never actually reach zero. Instead it's the next
 * NEW_MEMBER_OFFER_WINDOW_DAYS-boundary after signup (createdAt + k *
 * WINDOW_MS for whichever k makes that boundary still in the future): fixed
 * within a window, so a reload mid-countdown shows the same true remaining
 * time, and once a window lapses without a purchase the next boundary kicks
 * in automatically — a fresh countdown rather than the offer disappearing. */
export async function getNewMemberOfferState(
  profile: Pick<Profile, "id" | "plan" | "createdAt">
): Promise<NewMemberOfferState> {
  if (profile.plan !== "FREE") return { eligible: false, deadline: null };

  const completedPayment = await db.payment.findFirst({
    where: { userId: profile.id, status: { in: ["SUCCESS", "REFUNDED"] } },
    select: { id: true },
  });
  if (completedPayment) return { eligible: false, deadline: null };

  const elapsedSinceSignup = Date.now() - profile.createdAt.getTime();
  const elapsedInWindow = ((elapsedSinceSignup % WINDOW_MS) + WINDOW_MS) % WINDOW_MS;
  const deadline = new Date(Date.now() + (WINDOW_MS - elapsedInWindow));
  return { eligible: true, deadline: deadline.toISOString() };
}
