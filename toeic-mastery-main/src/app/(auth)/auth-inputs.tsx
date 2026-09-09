"use client";

import * as React from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Pill-shaped input with a leading icon — the "Email hoặc Tên tài khoản" /
 * "Họ và tên" style fields. Wraps Input rather than styling it directly so
 * every auth form gets the same rounded/icon-padded look from one place. */
export const IconInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input"> & { icon: React.ReactNode }>(
  function IconInput({ icon, className, ...props }, ref) {
    return (
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted-foreground">{icon}</span>
        <Input ref={ref} className={cn("h-12 rounded-full pl-10", className)} {...props} />
      </div>
    );
  }
);

/** Same pill/icon treatment as IconInput, plus a show/hide toggle — used for
 * every password field across login/register/reset-password. */
export const PasswordInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(function PasswordInput(
  { className, ...props },
  ref
) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input ref={ref} type={visible ? "text" : "password"} className={cn("h-12 rounded-full pr-11 pl-10", className)} {...props} />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        className="absolute top-1/2 right-3.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
});

/** "─── hoặc bằng tài khoản ───" separator between the Google button and the
 * email/password form. */
export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">{label}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
