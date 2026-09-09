"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";
import { requestPasswordResetAction } from "../actions";
import { IconInput } from "../auth-inputs";

export function ForgotPasswordForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } });

  async function onSubmit(values: ForgotPasswordInput) {
    const result = await requestPasswordResetAction(values);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Nếu email tồn tại, mã xác nhận đã được gửi tới hộp thư của bạn");
    router.push(`/reset-password?email=${encodeURIComponent(values.email)}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Quên mật khẩu</h1>
        <p className="mt-1 text-sm text-muted-foreground">Nhập email đã đăng ký, chúng tôi sẽ gửi mã xác nhận gồm 6 chữ số.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <IconInput
            id="email"
            type="email"
            autoComplete="email"
            icon={<Mail className="size-4" />}
            placeholder="Nhập email đã đăng ký..."
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full rounded-full bg-gradient-to-r from-pink-600 to-rose-500 text-base font-semibold text-white shadow-md hover:opacity-95 disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
          Gửi Mã Xác Nhận
          {!isSubmitting && <ArrowRight className="size-4" />}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        <Link href="/login" className="font-semibold text-pink-600 hover:underline">
          Quay lại đăng nhập
        </Link>
      </p>
    </div>
  );
}
