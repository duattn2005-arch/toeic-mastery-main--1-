"use client";

import * as React from "react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthDialog, type AuthDialogTab } from "@/components/auth/auth-dialog";

/**
 * Shown in place of gated content (see /practice) when a visitor reaches a
 * practice route without being logged in — lets them see the page shell and
 * sign up right there instead of being bounced straight to /login.
 */
export function LoginRequiredGate({
  title = "Đăng nhập để luyện đề",
  description = "Tính năng luyện đề yêu cầu đăng nhập để lưu tiến độ và kết quả của bạn.",
}: {
  title?: string;
  description?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [tab, setTab] = React.useState<AuthDialogTab>("register");

  function openWith(nextTab: AuthDialogTab) {
    setTab(nextTab);
    setOpen(true);
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card px-6 py-16 text-center shadow-soft">
      <span className="flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <LogIn className="size-6" />
      </span>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={() => openWith("register")}>Đăng ký miễn phí</Button>
        <Button variant="outline" onClick={() => openWith("login")}>
          Đăng nhập ngay
        </Button>
      </div>
      <AuthDialog open={open} onOpenChange={setOpen} tab={tab} onTabChange={setTab} />
    </div>
  );
}
