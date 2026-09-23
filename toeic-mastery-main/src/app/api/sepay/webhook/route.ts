import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { grantProDays } from "@/lib/services/pro-grant";
import { recordReferralCommission } from "@/lib/services/referral-commission";

/**
 * SePay's bank-transaction webhook — the personal-MB-Bank-account
 * counterpart to /api/vnpay/ipn for learners who pay via the plain
 * VietQR bank-transfer flow (declareBankTransferAction) instead of a real
 * payment gateway. SePay watches the connected MB Bank account and POSTs
 * here for every incoming transaction; this only ever acts on ones whose
 * transfer content contains one of our own orderIds (see
 * declareBankTransferAction's `TOEIC...` format) — anything else (an
 * unrelated deposit into the same personal account) is acknowledged but
 * ignored, not an error.
 *
 * Auth: SePay sends whatever fixed string you configure as this webhook's
 * "Authorization" header (Dashboard → Công ty → Webhooks) on every call —
 * set the same value as SEPAY_WEBHOOK_API_KEY here. This is a shared
 * secret, not a per-request signature, so treat it like one (long/random,
 * never logged).
 *
 * Payload shape is SePay's documented webhook format as of when this was
 * written — verify against a real "Test webhook" payload from their
 * dashboard if any field names below don't match what actually arrives.
 */
interface SePayWebhookPayload {
  id?: number;
  gateway?: string;
  transactionDate?: string;
  accountNumber?: string;
  content?: string;
  transferType?: "in" | "out";
  transferAmount?: number;
  referenceCode?: string;
}

function requireWebhookApiKey(): string {
  const key = process.env.SEPAY_WEBHOOK_API_KEY;
  if (!key) throw new Error("SEPAY_WEBHOOK_API_KEY is not set");
  return key;
}

export async function POST(request: NextRequest) {
  let apiKey: string;
  try {
    apiKey = requireWebhookApiKey();
  } catch {
    console.error("SePay webhook called but SEPAY_WEBHOOK_API_KEY is not configured");
    return NextResponse.json({ success: false, message: "Webhook chưa được cấu hình" }, { status: 500 });
  }

  // SePay's own docs send this as `Authorization: Apikey <key>` — accept
  // either that or a bare key so a dashboard variation doesn't silently
  // break this.
  const authHeader = request.headers.get("authorization") ?? "";
  const providedKey = authHeader.replace(/^Apikey\s+/i, "").trim();
  if (providedKey !== apiKey) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as SePayWebhookPayload | null;
  if (!body) {
    return NextResponse.json({ success: false, message: "Invalid payload" }, { status: 400 });
  }

  // Only money coming IN matters here — an outgoing transfer (e.g. a
  // withdrawal payout, see admin-withdrawals) is never a Pro purchase.
  if (body.transferType !== "in") {
    return NextResponse.json({ success: true, message: "Ignored (not incoming)" });
  }

  const content = body.content ?? "";
  // Our own orderIds are `TOEIC<digits><6 uppercase alnum>` — matched as a
  // substring since the bank/SePay may prepend or append its own text
  // around whatever the payer's banking app actually sent as the note.
  const orderIdMatch = content.match(/TOEIC[0-9A-Z]+/);
  if (!orderIdMatch) {
    // A real transaction into this account that just isn't one of ours
    // (or the payer typed the note wrong) — not an error on SePay's side.
    return NextResponse.json({ success: true, message: "No matching order in content" });
  }

  const payment = await db.payment.findUnique({ where: { orderId: orderIdMatch[0] } });
  if (!payment) {
    return NextResponse.json({ success: true, message: "Order not found" });
  }

  // Idempotent: SePay may redeliver the same event, and a redelivery after
  // we've already granted Pro must not extend the expiry a second time.
  if (payment.status === "SUCCESS") {
    return NextResponse.json({ success: true, message: "Already confirmed" });
  }

  if (body.transferAmount !== payment.amount) {
    console.error("SePay webhook amount mismatch", { orderId: payment.orderId, expected: payment.amount, received: body.transferAmount });
    return NextResponse.json({ success: true, message: "Amount mismatch" });
  }

  const updatedPayment = await db.payment.update({
    where: { orderId: payment.orderId },
    data: {
      status: "SUCCESS",
      vnpTransactionNo: body.referenceCode ?? null,
      paidAt: new Date(),
    },
  });

  await grantProDays(payment.userId, payment.planDurationDays);
  await recordReferralCommission(updatedPayment);

  return NextResponse.json({ success: true });
}
