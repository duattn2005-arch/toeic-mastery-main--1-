import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";

/**
 * Vercel Cron hits this once a day (see vercel.json) — a 10-day PENDING
 * window doesn't need per-minute precision. Flips any Commission whose
 * confirmAt has passed to WITHDRAWABLE, unless the underlying Payment was
 * refunded in the meantime (markPaymentRefundedAction normally cancels the
 * Commission immediately on refund; this is just a defensive second check
 * against that race).
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const candidates = await db.commission.findMany({
    where: { status: "PENDING", confirmAt: { lte: now } },
    include: { payment: { select: { status: true } } },
  });

  let confirmed = 0;
  let skipped = 0;

  for (const commission of candidates) {
    if (commission.payment.status === "REFUNDED") {
      skipped++;
      continue;
    }
    await db.commission.update({
      where: { id: commission.id },
      data: { status: "WITHDRAWABLE", confirmedAt: now },
    });
    confirmed++;
  }

  return NextResponse.json({ confirmed, skipped });
}
