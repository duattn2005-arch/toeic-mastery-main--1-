"use client";

import * as React from "react";
import Link from "next/link";
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

/**
 * Hero section's CTAs — real navigation into the app rather than opening the
 * auth dialog directly, so a logged-out visitor lands on the actual /practice
 * page (which shows an inline "log in to continue" prompt, see
 * login-required-gate.tsx) instead of a modal on top of the landing page.
 */
export function HeroAuthButtons() {
  return (
    <>
      <Button size="lg" asChild>
        <Link href="/practice">
          Bắt đầu luyện tập ngay <ArrowRight />
        </Link>
      </Button>
      <Button size="lg" variant="outline" asChild>
        <Link href="/practice?category=FULL">Làm bài test thử</Link>
      </Button>
    </>
  );
}
