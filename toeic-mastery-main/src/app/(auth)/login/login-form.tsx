"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2, User } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { loginAction } from "../actions";
import { GoogleAuthButton } from "../google-auth-button";
import { AuthTabs } from "../auth-tabs";
import { IconInput, PasswordInput, AuthDivider } from "../auth-inputs";

/** Exported so AuthDialog (src/components/auth/auth-dialog.tsx) can reuse
 * this exact form inside the landing page's popup, not just this full page. */
export function EmailLoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  async function onSubmit(values: LoginInput) {
    const result = await loginAction(values);
    if (result?.error) toast.error(result.error);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <IconInput
          id="email"
          type="email"
          autoComplete="email"
          icon={<User className="size-4" />}
          placeholder="Nhập email đã đăng ký..."
          {...register("email")}
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Mật khẩu</Label>
          <Link href="/forgot-password" className="text-xs font-medium text-pink-600 hover:underline">
            Quên mật khẩu?
          </Link>
        </div>
        <PasswordInput id="password" autoComplete="current-password" {...register("password")} />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-12 w-full rounded-full bg-gradient-to-r from-pink-600 to-rose-500 text-base font-semibold text-white shadow-md hover:opacity-95 disabled:opacity-60"
      >
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
        Đăng Nhập Ngay
        {!isSubmitting && <ArrowRight className="size-4" />}
      </Button>
    </form>
  );
}

export function LoginForm() {
  return (
    <div className="flex flex-col gap-6">
      <AuthTabs />

      {/* GoogleAuthButton reads ?next= via useSearchParams, which requires a
          Suspense boundary in the App Router. */}
      <Suspense fallback={<div className="h-12 w-full animate-pulse rounded-full bg-muted" />}>
        <GoogleAuthButton />
      </Suspense>

      <AuthDivider label="Hoặc bằng tài khoản" />

      <EmailLoginForm />

      <p className="text-center text-xs text-muted-foreground">
        Chưa có tài khoản?{" "}
        <Link href="/register" className="font-semibold text-pink-600 hover:underline">
          Đăng ký ngay tại đây
        </Link>
      </p>
    </div>
  );
}
