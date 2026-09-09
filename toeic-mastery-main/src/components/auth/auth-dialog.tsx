"use client";

import { Suspense } from "react";
import { Sparkles, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { GoogleAuthButton } from "@/app/(auth)/google-auth-button";
import { AuthDivider } from "@/app/(auth)/auth-inputs";
import { EmailLoginForm } from "@/app/(auth)/login/login-form";
import { EmailRegisterForm } from "@/app/(auth)/register/register-form";

export type AuthDialogTab = "login" | "register";

const COPY: Record<AuthDialogTab, { title: string; subtitle: string }> = {
  login: { title: "Đăng Nhập", subtitle: "Chào mừng bạn quay trở lại hành trình luyện thi TOEIC." },
  register: { title: "Đăng Ký", subtitle: "Tạo tài khoản miễn phí và bắt đầu chinh phục điểm TOEIC mục tiêu." },
};

/** Landing-page popup version of the login/register flow (see the reference
 * screenshot this was built to match) — reuses the exact same form/action
 * components as the full-page /login and /register routes (which still
 * exist on their own for direct links and the auth proxy's redirect), just
 * inside a Dialog with a gradient header and an in-place tab switch instead
 * of a page navigation. */
export function AuthDialog({
  open,
  onOpenChange,
  tab,
  onTabChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fully controlled by the caller (see landing-auth-buttons.tsx) rather
   * than defaulted-then-synced internally — that "sync a prop into state
   * via useEffect" shape causes an extra render on every open and is exactly
   * what React's docs recommend against; the caller already tracks which
   * tab a given trigger button should open, so it's the source of truth. */
  tab: AuthDialogTab;
  onTabChange: (tab: AuthDialogTab) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0" showCloseButton={false}>
        <DialogTitle className="sr-only">{COPY[tab].title}</DialogTitle>

        <div className="relative bg-gradient-to-br from-pink-600 via-fuchsia-600 to-rose-500 px-6 pt-6 pb-8 text-center text-white">
          <DialogClose
            className="absolute top-3 right-3 flex size-7 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
            aria-label="Đóng"
          >
            <X className="size-4" />
          </DialogClose>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
            <Sparkles className="size-3.5" /> TOEIC Mastery
          </span>
          <h2 className="mt-3 text-2xl font-bold">{COPY[tab].title}</h2>
          <p className="mt-1 text-sm text-white/85">{COPY[tab].subtitle}</p>
        </div>

        <div className="flex flex-col gap-6 px-6 py-6">
          <div className="flex rounded-full bg-muted p-1">
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onTabChange(t)}
                className={cn(
                  "flex-1 rounded-full py-2.5 text-center text-sm font-semibold transition-colors",
                  tab === t ? "bg-card text-pink-600 shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t === "login" ? "Đăng Nhập" : "Đăng Ký"}
              </button>
            ))}
          </div>

          {/* GoogleAuthButton reads ?next= via useSearchParams, which
              requires a Suspense boundary in the App Router. */}
          <Suspense fallback={<div className="h-12 w-full animate-pulse rounded-full bg-muted" />}>
            <GoogleAuthButton />
          </Suspense>

          <AuthDivider label="Hoặc bằng tài khoản" />

          {tab === "login" ? <EmailLoginForm /> : <EmailRegisterForm />}

          <p className="text-center text-xs text-muted-foreground">
            {tab === "login" ? (
              <>
                Chưa có tài khoản?{" "}
                <button type="button" onClick={() => onTabChange("register")} className="font-semibold text-pink-600 hover:underline">
                  Đăng ký ngay tại đây
                </button>
              </>
            ) : (
              <>
                Đã có tài khoản?{" "}
                <button type="button" onClick={() => onTabChange("login")} className="font-semibold text-pink-600 hover:underline">
                  Đăng nhập ngay tại đây
                </button>
              </>
            )}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
