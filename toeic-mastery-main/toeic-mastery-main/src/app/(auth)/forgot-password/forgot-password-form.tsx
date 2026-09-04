"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";
import { forgotPasswordAction } from "../actions";

export function ForgotPasswordForm() {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [sent, setSent] = React.useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordInput) {
    setServerError(null);
    const result = await forgotPasswordAction(values);
    if (result?.error) setServerError(result.error);
    else setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col items-start gap-3">
        <CheckCircle2 className="size-8 text-success" />
        <h1 className="text-xl font-semibold">Kiểm tra email của bạn</h1>
        <p className="text-sm text-muted-foreground">
          Nếu email này đã đăng ký, chúng tôi đã gửi liên kết đặt lại mật khẩu. Liên kết có hiệu lực trong 1 giờ.
        </p>
        <Link href="/login" className="text-sm font-medium text-primary hover:underline">
          Quay lại đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Quên mật khẩu?</h1>
        <p className="mt-1 text-sm text-muted-foreground">Nhập email để nhận liên kết đặt lại mật khẩu.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="ban@vidu.com" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        {serverError && <p className="text-sm text-destructive">{serverError}</p>}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          Gửi liên kết đặt lại
        </Button>
      </form>

      <Link href="/login" className="text-center text-sm font-medium text-primary hover:underline">
        Quay lại đăng nhập
      </Link>
    </div>
  );
}
