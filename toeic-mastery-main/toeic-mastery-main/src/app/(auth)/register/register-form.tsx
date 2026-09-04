"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { signUpAction } from "../actions";
import { GoogleAuthButton } from "../google-auth-button";

export function RegisterForm() {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterInput) {
    setServerError(null);
    const result = await signUpAction(values);
    if (result?.error) {
      setServerError(result.error);
      toast.error(result.error);
      return;
    }
    if (result?.needsEmailConfirmation) {
      setSubmittedEmail(values.email);
    }
  }

  if (submittedEmail) {
    return (
      <div className="flex flex-col items-start gap-3">
        <MailCheck className="size-8 text-success" />
        <h1 className="text-xl font-semibold">Kiểm tra email của bạn</h1>
        <p className="text-sm text-muted-foreground">
          Chúng tôi đã gửi một liên kết xác nhận đến <span className="font-medium text-foreground">{submittedEmail}</span>.
          Vui lòng bấm vào liên kết đó để kích hoạt tài khoản trước khi đăng nhập.
        </p>
        <Link href="/login" className="text-sm font-medium text-primary hover:underline">
          Đã xác nhận? Đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tạo tài khoản</h1>
        <p className="mt-1 text-sm text-muted-foreground">Miễn phí, bắt đầu luyện thi trong 30 giây.</p>
      </div>

      <GoogleAuthButton />

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        HOẶC
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fullName">Họ và tên</Label>
          <Input id="fullName" autoComplete="name" placeholder="Nguyễn Văn A" {...register("fullName")} />
          {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="ban@vidu.com" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Mật khẩu</Label>
          <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
          <Input id="confirmPassword" type="password" autoComplete="new-password" {...register("confirmPassword")} />
          {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
        </div>

        {serverError && <p className="text-sm text-destructive">{serverError}</p>}

        <Button type="submit" disabled={isSubmitting} className="mt-2">
          {isSubmitting && <Loader2 className="animate-spin" />}
          Tạo tài khoản
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Đã có tài khoản?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
