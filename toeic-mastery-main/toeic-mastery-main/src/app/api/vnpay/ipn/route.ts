import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifySignature } from "@/lib/services/vnpay";
import { grantProDays } from "@/lib/services/pro-grant";
import { recordReferralCommission } from "@/lib/services/referral-commission";

/**
 * VNPay's server-to-server IPN callback — the only source of truth for
 * granting Pro. The browser return redirect (`/upgrade/return`) is
 * spoofable/not guaranteed to fire, so it's display-only; this route is what
 * actually flips `Profile.plan`. VNPay requires this exact `{RspCode,
 * Message}` JSON response shape, and calls this as a GET with query params.
 */
export async function GET(request: NextRequest) {
  const params: Record<string, string> = {};
  request.nextUrl.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  if (!verifySignature(params)) {
    return NextResponse.json({ RspCode: "97", Message: "Invalid signature" });
  }

  const orderId = params.vnp_TxnRef;
  const payment = await db.payment.findUnique({ where: { orderId } });
  if (!payment) {
    return NextResponse.json({ RspCode: "01", Message: "Order not found" });
  }

  const paidAmountVnd = Number(params.vnp_Amount) / 100;
  if (paidAmountVnd !== payment.amount) {
    return NextResponse.json({ RspCode: "04", Message: "Invalid amount" });
  }

  // Idempotent: VNPay may retry the IPN call, and a retry after we've
  // already granted Pro must not extend the expiry a second time.
  if (payment.status === "SUCCESS") {
    return NextResponse.json({ RspCode: "02", Message: "Order already confirmed" });
  }

  const isSuccess = params.vnp_ResponseCode === "00" && params.vnp_TransactionStatus === "00";

  const updatedPayment = await db.payment.update({
    where: { orderId },
    data: {
      status: isSuccess ? "SUCCESS" : "FAILED",
      vnpTransactionNo: params.vnp_TransactionNo ?? null,
      paidAt: isSuccess ? new Date() : null,
    },
  });

  if (isSuccess) {
    await grantProDays(payment.userId, payment.planDurationDays);
    await recordReferralCommission(updatedPayment);
  }

  return NextResponse.json({ RspCode: "00", Message: "Confirm Success" });
}
