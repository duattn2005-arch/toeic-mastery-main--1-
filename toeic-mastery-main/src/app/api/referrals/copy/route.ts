import { NextResponse } from "next/server";
import { getAuthedProfileOrNull } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Called by ReferralLinkCard right after navigator.clipboard.writeText()
 * succeeds — identity comes from the session cookie, never a client-supplied
 * id, so nobody can inflate someone else's count. Fire-and-forget from the
 * client: this only logs that the button was pressed, not that the link was
 * ever pasted anywhere (no website can see the clipboard after this point).
 */
export async function POST() {
  const profile = await getAuthedProfileOrNull();
  if (!profile) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  await db.profile.update({
    where: { id: profile.id },
    data: { referralLinkCopyCount: { increment: 1 } },
  });

  return NextResponse.json({ ok: true });
}
