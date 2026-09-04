"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthDialog, type AuthDialogTab } from "@/components/auth/auth-dialog";

/** Header nav's "Đăng nhập" / "Bắt đầu miễn phí" — opens the popup instead
 * of navigating to /login (see AuthDialog for why /login still exists). */
export function HeaderAuthButtons() {
  const [open, setOpen] = React.useState(false);
  const [tab, setTab] = React.useState<AuthDialogTab>("login");

  function openWith(nextTab: AuthDialogTab) {
    setTab(nextTab);
    setOpen(true);
  }

  return (
    <>
      <Button variant="ghost" onClick={() => openWith("login")}>
        Đăng nhập
      </Button>
      <Button onClick={() => openWith("register")}>
        Bắt đầu miễn phí <ArrowRight />
      </Button>
      <AuthDialog open={open} onOpenChange={setOpen} tab={tab} onTabChange={setTab} />
    </>
  );
}

/** Hero section's "Tạo tài khoản miễn phí" / "Tôi đã có tài khoản". */
export function HeroAuthButtons() {
  const [open, setOpen] = React.useState(false);
  const [tab, setTab] = React.useState<AuthDialogTab>("register");

  function openWith(nextTab: AuthDialogTab) {
    setTab(nextTab);
    setOpen(true);
  }

  return (
    <>
      <Button size="lg" onClick={() => openWith("register")}>
        Tạo tài khoản miễn phí <ArrowRight />
      </Button>
      <Button size="lg" variant="outline" onClick={() => openWith("login")}>
        Tôi đã có tài khoản
      </Button>
      <AuthDialog open={open} onOpenChange={setOpen} tab={tab} onTabChange={setTab} />
    </>
  );
}
