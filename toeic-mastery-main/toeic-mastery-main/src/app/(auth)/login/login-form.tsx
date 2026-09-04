"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { signInAction } from "../actions";
import { GoogleAuthButton } from "../google-auth-button";

export function LoginForm() {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    const result = await signInAction(values);
    if (result?.error) {
      setServerError(result.error);
      toast.error(result.error);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Đăng nhập</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tiếp tục hành trình luyện thi TOEIC của bạn.</p>
      </div>

      <GoogleAuthButton />

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        HOẶC
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="ban@vidu.com" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Mật khẩu</Label>
            <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              Quên mật khẩu?
            </Link>
          </div>
          <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        {serverError && <p className="text-sm text-destructive">{serverError}</p>}

        <Button type="submit" disabled={isSubmitting} className="mt-2">
          {isSubmitting && <Loader2 className="animate-spin" />}
          Đăng nhập
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Chưa có tài khoản?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Đăng ký ngay
        </Link>
      </p>
    </div>
  );
}
