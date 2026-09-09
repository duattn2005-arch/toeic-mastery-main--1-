import "server-only";
import { db } from "@/lib/db";
import { PRO_PLANS } from "@/lib/constants/billing";
import { sendProConfirmationEmail } from "@/lib/services/emailjs";

/** Matches `days` back to a PRO_PLANS label for the confirmation email —
 * falls back to a plain day count for grants that don't line up with a
 * sold plan (activation codes, the admin override's flat 30 days). */
function planLabelForDays(days: number): string {
  const plan = Object.values(PRO_PLANS).find((p) => p.durationDays === days);
  return plan?.label ?? `${days} ngày`;
}

/** Grants (or extends) Pro for a user — shared by the VNPay IPN handler,
 * manual bank-transfer approval, activation-code redemption, and the admin
 * override, so "extend from the existing expiry if it's still in the
 * future, else from now" only lives in one place. Also the single place a
 * Pro confirmation email fires, so every grant path emails the user the
 * same way without each caller remembering to. */
export async function grantProDays(userId: string, days: number): Promise<void> {
  const profile = await db.profile.findUniqueOrThrow({ where: { id: userId } });
  const now = new Date();
  const extendFrom = profile.proExpiresAt && profile.proExpiresAt > now ? profile.proExpiresAt : now;
  const proExpiresAt = new Date(extendFrom);
  proExpiresAt.setDate(proExpiresAt.getDate() + days);
  await db.profile.update({ where: { id: userId }, data: { plan: "PRO", proExpiresAt } });

  try {
    await sendProConfirmationEmail({
      toEmail: profile.email,
      toName: profile.fullName ?? profile.email,
      planName: planLabelForDays(days),
      expiresAt: proExpiresAt.toLocaleDateString("vi-VN"),
    });
  } catch (err) {
    // A failed confirmation email must never undo/block a Pro grant that
    // already happened — log and move on.
    console.error("Failed to send Pro confirmation email", err);
  }
}
