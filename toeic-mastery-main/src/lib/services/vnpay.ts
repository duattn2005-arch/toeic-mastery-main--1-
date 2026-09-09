import "server-only";
import crypto from "node:crypto";

/**
 * VNPay's official signing convention (unchanged across their SDK samples for
 * years): sort params by key, URL-encode each value the same way a browser
 * form would (encodeURIComponent, then `%20` -> `+` for spaces), join as
 * `key=value&...`, then HMAC-SHA512 that exact string with the merchant's
 * hash secret. The redirect URL and the IPN verification both reuse this.
 */
function sortAndEncode(params: Record<string, string>): [string, string][] {
  return Object.keys(params)
    .sort()
    .map((key) => [key, encodeURIComponent(params[key]).replace(/%20/g, "+")]);
}

function signData(sorted: [string, string][]): string {
  return sorted.map(([key, value]) => `${key}=${value}`).join("&");
}

function hmacSign(data: string): string {
  const secret = process.env.VNPAY_HASH_SECRET;
  if (!secret) throw new Error("VNPAY_HASH_SECRET is not configured");
  return crypto.createHmac("sha512", secret).update(Buffer.from(data, "utf-8")).digest("hex");
}

function formatVnpDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

export interface BuildPaymentUrlInput {
  orderId: string;
  /** VND, whole units (e.g. 99000 for 99,000₫) — VNPay wants this * 100 internally. */
  amountVnd: number;
  orderInfo: string;
  ipAddr: string;
  returnUrl: string;
}

export function buildPaymentUrl({ orderId, amountVnd, orderInfo, ipAddr, returnUrl }: BuildPaymentUrlInput): string {
  const tmnCode = process.env.VNPAY_TMN_CODE;
  const paymentUrl = process.env.VNPAY_PAYMENT_URL;
  if (!tmnCode || !paymentUrl) throw new Error("VNPAY_TMN_CODE / VNPAY_PAYMENT_URL is not configured");

  const params: Record<string, string> = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: orderId,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: "other",
    vnp_Amount: String(amountVnd * 100),
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: formatVnpDate(new Date()),
  };

  const sorted = sortAndEncode(params);
  const data = signData(sorted);
  const secureHash = hmacSign(data);

  return `${paymentUrl}?${data}&vnp_SecureHash=${secureHash}`;
}

/** Verifies an IPN/return callback's signature against its own params.
 * `params` should be every `vnp_*` query param VNPay sent, unmodified. */
export function verifySignature(params: Record<string, string>): boolean {
  const vnp_SecureHash = params.vnp_SecureHash;
  if (!vnp_SecureHash) return false;

  const rest: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (key !== "vnp_SecureHash" && key !== "vnp_SecureHashType") rest[key] = value;
  }

  const sorted = sortAndEncode(rest);
  const data = signData(sorted);
  const expected = hmacSign(data);

  // Constant-time compare — this is a security boundary (an attacker who can
  // forge a valid signature could grant themselves Pro for free).
  const a = Buffer.from(vnp_SecureHash, "hex");
  const b = Buffer.from(expected, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
