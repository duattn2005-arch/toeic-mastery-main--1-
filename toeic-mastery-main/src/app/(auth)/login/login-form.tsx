"use client";

import { Suspense } from "react";
import { GoogleAuthButton } from "../google-auth-button";

export function LoginForm() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Đăng nhập</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tiếp tục hành trình luyện thi TOEIC của bạn.</p>
      </div>

      {/* GoogleAuthButton reads ?next= via useSearchParams, which requires a
          Suspense boundary in the App Router. */}
      <Suspense fallback={<div className="h-10 w-full animate-pulse rounded-md bg-muted" />}>
        <GoogleAuthButton />
      </Suspense>

      <p className="text-center text-xs text-muted-foreground">Đăng nhập lần đầu sẽ tự động tạo tài khoản cho bạn.</p>
    </div>
  );
}
