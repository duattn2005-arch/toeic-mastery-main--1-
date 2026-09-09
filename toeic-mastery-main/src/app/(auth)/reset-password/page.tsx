import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Đặt lại mật khẩu — TOEIC Mastery" };

export default function ResetPasswordPage() {
  return (
    // ResetPasswordForm reads ?email= via useSearchParams, which requires a
    // Suspense boundary in the App Router.
    <Suspense fallback={<div className="h-64 w-full animate-pulse rounded-md bg-muted" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
