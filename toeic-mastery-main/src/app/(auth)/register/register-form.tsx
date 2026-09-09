"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2, Mail, User } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { registerAction } from "../actions";
import { GoogleAuthButton } from "../google-auth-button";
import { AuthTabs } from "../auth-tabs";
import { IconInput, PasswordInput, AuthDivider } from "../auth-inputs";

/** Exported so AuthDialog (src/components/auth/auth-dialog.tsx) can reuse
 * this exact form inside the landing page's popup, not just this full page. */
export function EmailRegisterForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: RegisterInput) {
    const result = await registerAction(values);
    if (result?.error) toast.error(result.error);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fullName">Họ và tên</Label>
        <IconInput id="fullName" autoComplete="name" icon={<User className="size-4" />} placeholder="Nhập họ và tên..." {...register("fullName")} />
        {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <IconInput
          id="email"
          type="email"
          autoComplete="email"
          icon={<Mail className="size-4" />}
          placeholder="Nhập email..."
          {...register("email")}
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Mật khẩu</Label>
        <PasswordInput id="password" autoComplete="new-password" {...register("password")} />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">Nhập lại mật khẩu</Label>
        <PasswordInput id="confirmPassword" autoComplete="new-password" {...register("confirmPassword")} />
        {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-12 w-full rounded-full bg-gradient-to-r from-pink-600 to-rose-500 text-base font-semibold text-white shadow-md hover:opacity-95 disabled:opacity-60"
      >
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
        Đăng Ký Ngay
        {!isSubmitting && <ArrowRight className="size-4" />}
      </Button>
    </form>
  );
}

export function RegisterForm() {
  return (
    <div className="flex flex-col gap-6">
      <AuthTabs />

      <Suspense fallback={<div className="h-12 w-full animate-pulse rounded-full bg-muted" />}>
        <GoogleAuthButton />
      </Suspense>

      <AuthDivider label="Hoặc bằng tài khoản" />

      <EmailRegisterForm />

      <p className="text-center text-xs text-muted-foreground">
        Đã có tài khoản?{" "}
        <Link href="/login" className="font-semibold text-pink-600 hover:underline">
          Đăng nhập ngay tại đây
        </Link>
      </p>
    </div>
  );
}
