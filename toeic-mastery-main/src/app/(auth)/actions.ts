"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { SESSION_COOKIE, sessionCookieOptions, signSessionToken } from "@/lib/auth/session";
import { hashPassword, verifyPassword, generateResetCode, hashResetCode, verifyResetCode } from "@/lib/auth/password";
import { sendPasswordResetCodeEmail } from "@/lib/services/emailjs";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type RegisterInput,
  type LoginInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from "@/lib/validations/auth";

export interface ActionResult {
  error?: string;
}

const RESET_CODE_TTL_MINUTES = 15;

async function establishSession(profile: { id: string; email: string }): Promise<void> {
  const token = await signSessionToken({ sub: profile.id, email: profile.email });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions);
}

export async function signOutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}

/** Email+password sign-up — sits alongside Google sign-in (src/lib/auth/google.ts),
 * not a replacement for it. Fails on an existing email rather than silently
 * signing the visitor into someone else's account. */
export async function registerAction(input: RegisterInput): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  const { fullName, email, password } = parsed.data;

  const passwordHash = await hashPassword(password);

  try {
    const profile = await db.profile.create({ data: { email, fullName, passwordHash } });
    await establishSession(profile);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Email này đã được đăng ký" };
    }
    throw err;
  }

  redirect("/dashboard");
}

/** Email+password sign-in. An account created via Google (no passwordHash)
 * gets a clear "use Google" message instead of a generic wrong-password
 * error, since there's no password for it to type. */
export async function loginAction(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  const { email, password } = parsed.data;

  const profile = await db.profile.findUnique({ where: { email } });
  if (!profile) return { error: "Email hoặc mật khẩu không đúng" };
  if (!profile.passwordHash) return { error: "Tài khoản này đăng nhập bằng Google — hãy dùng nút \"Đăng nhập với Google\"" };

  const valid = await verifyPassword(password, profile.passwordHash);
  if (!valid) return { error: "Email hoặc mật khẩu không đúng" };

  await establishSession(profile);
  redirect("/dashboard");
}

/** Step 1 of forgot-password: issues a 6-digit code (15-minute expiry) and
 * emails it via EmailJS. Always returns success even for an unknown email
 * or a Google-only account — revealing which emails exist/have a password
 * would let anyone enumerate the user base. */
export async function requestPasswordResetAction(input: ForgotPasswordInput): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  const { email } = parsed.data;

  const profile = await db.profile.findUnique({ where: { email } });
  if (!profile || !profile.passwordHash) return {};

  const code = generateResetCode();
  const resetCodeExpiresAt = new Date(Date.now() + RESET_CODE_TTL_MINUTES * 60 * 1000);
  await db.profile.update({
    where: { id: profile.id },
    data: { resetCodeHash: hashResetCode(code), resetCodeExpiresAt },
  });

  try {
    await sendPasswordResetCodeEmail({
      toEmail: profile.email,
      toName: profile.fullName ?? profile.email,
      otpCode: code,
      expiresMinutes: RESET_CODE_TTL_MINUTES,
    });
  } catch {
    return { error: "Không thể gửi email lúc này. Vui lòng thử lại sau." };
  }

  return {};
}

/** Step 2: verifies the emailed code and sets the new password. Clears the
 * code either way it's consumed (success) so it can't be reused. */
export async function resetPasswordAction(input: ResetPasswordInput): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  const { email, code, password } = parsed.data;

  const profile = await db.profile.findUnique({ where: { email } });
  if (!profile || !profile.resetCodeHash || !profile.resetCodeExpiresAt) {
    return { error: "Mã xác nhận không đúng hoặc đã hết hạn" };
  }
  if (profile.resetCodeExpiresAt < new Date()) {
    return { error: "Mã xác nhận đã hết hạn. Vui lòng yêu cầu mã mới." };
  }
  if (!verifyResetCode(code, profile.resetCodeHash)) {
    return { error: "Mã xác nhận không đúng hoặc đã hết hạn" };
  }

  const passwordHash = await hashPassword(password);
  const updated = await db.profile.update({
    where: { id: profile.id },
    data: { passwordHash, resetCodeHash: null, resetCodeExpiresAt: null },
  });

  await establishSession(updated);
  redirect("/dashboard");
}
