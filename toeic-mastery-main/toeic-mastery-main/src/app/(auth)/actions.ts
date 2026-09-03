"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type LoginInput,
  type RegisterInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from "@/lib/validations/auth";

export interface ActionResult {
  error?: string;
  needsEmailConfirmation?: boolean;
}

const AUTH_ERROR_MESSAGES_VI: Record<string, string> = {
  "Invalid login credentials": "Email hoặc mật khẩu không đúng",
  "Email not confirmed": "Email chưa được xác nhận. Vui lòng kiểm tra hộp thư để xác nhận trước khi đăng nhập.",
  "User already registered": "Email này đã được đăng ký",
};

export async function signInAction(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: AUTH_ERROR_MESSAGES_VI[error.message] ?? error.message };
  }

  redirect("/dashboard");
}

export async function signUpAction(input: RegisterInput): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.fullName } },
  });
  if (error) {
    return { error: AUTH_ERROR_MESSAGES_VI[error.message] ?? error.message };
  }

  // Supabase's "Confirm email" setting (on by default) means signUp
  // succeeds without an active session until the user clicks the link in
  // their inbox. Redirecting to /dashboard here would just bounce them
  // straight back to /login, so surface the real state instead.
  if (!data.session) {
    return { needsEmailConfirmation: true };
  }

  redirect("/dashboard");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function forgotPasswordAction(input: ForgotPasswordInput): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/settings?reset=1`,
  });
  if (error) return { error: error.message };

  return {};
}

export async function resetPasswordAction(input: ResetPasswordInput): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.message };

  return {};
}
