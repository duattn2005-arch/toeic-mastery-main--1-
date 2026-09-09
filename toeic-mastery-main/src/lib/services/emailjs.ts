import "server-only";

const EMAILJS_API_URL = "https://api.emailjs.com/api/v1.0/email/send";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set. Copy .env.example to .env and configure it.`);
  return value;
}

/** Sends a transactional email via EmailJS's REST API — a plain HTTPS POST,
 * no SDK needed server-side. Requires "Allow EmailJS API for non-browser
 * applications" enabled in the EmailJS account's Security settings: this
 * call has no browser Origin header for EmailJS to check against. */
async function sendEmailJs(templateId: string, templateParams: Record<string, string>): Promise<void> {
  const response = await fetch(EMAILJS_API_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      service_id: requireEnv("EMAILJS_SERVICE_ID"),
      template_id: templateId,
      user_id: requireEnv("EMAILJS_PUBLIC_KEY"),
      accessToken: process.env.EMAILJS_PRIVATE_KEY || undefined,
      template_params: templateParams,
    }),
  });

  if (!response.ok) {
    throw new Error(`EmailJS send failed (${response.status}): ${await response.text()}`);
  }
}

/** Fired from grantProDays() (src/lib/services/pro-grant.ts) right after a
 * Pro purchase/grant lands, regardless of which path granted it (VNPay IPN,
 * manual bank-transfer approval, activation code, admin override). Template
 * variables: to_email, to_name, plan_name, expires_at. */
export async function sendProConfirmationEmail(params: {
  toEmail: string;
  toName: string;
  planName: string;
  expiresAt: string;
}): Promise<void> {
  const templateId = process.env.EMAILJS_TEMPLATE_ID_PRO_CONFIRM;
  if (!templateId) return; // Not configured yet — a missing template must never block granting Pro.
  await sendEmailJs(templateId, {
    to_email: params.toEmail,
    to_name: params.toName,
    plan_name: params.planName,
    expires_at: params.expiresAt,
  });
}

/** Forgot-password OTP email — see requestPasswordResetAction in
 * src/app/(auth)/actions.ts. Template variables: to_email, to_name,
 * otp_code, expires_minutes. Unlike sendProConfirmationEmail, a missing
 * template/failed send here throws: the whole point of the request is
 * delivering the code, so the caller needs to know it didn't go out. */
export async function sendPasswordResetCodeEmail(params: {
  toEmail: string;
  toName: string;
  otpCode: string;
  expiresMinutes: number;
}): Promise<void> {
  const templateId = requireEnv("EMAILJS_TEMPLATE_ID_PASSWORD_RESET");
  await sendEmailJs(templateId, {
    to_email: params.toEmail,
    to_name: params.toName,
    otp_code: params.otpCode,
    expires_minutes: String(params.expiresMinutes),
  });
}
