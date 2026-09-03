"use client";

import * as React from "react";
import Link from "next/link";
import { Gift, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { NEW_MEMBER_OFFER_PERCENT } from "@/lib/constants/billing";

const DISMISSED_KEY = "welcome_offer_dismissed_v1";

function formatRemaining(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000));
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  return `${days} ngày ${hours} giờ ${minutes} phút`;
}

/** Shown once per browser to eligible new Free accounts (see
 * getNewMemberOfferState — the real, server-checked eligibility this modal
 * only reflects). The countdown is a real per-account deadline read from
 * the server, not a per-visit reset, so closing and reopening the page
 * never buys extra time. */
export function WelcomeOfferModal({ deadline }: { deadline: string }) {
  const deadlineMs = React.useMemo(() => new Date(deadline).getTime(), [deadline]);
  const [open, setOpen] = React.useState(false);
  const [remainingMs, setRemainingMs] = React.useState(() => deadlineMs - Date.now());

  React.useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISSED_KEY) === "1";
    } catch {
      // localStorage unavailable (private mode, blocked storage) — fail open, just show it.
    }
    // One-time sync with the browser's localStorage, not app state — same
    // pattern as theme-toggle.tsx's mounted flag.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!dismissed) setOpen(true);
  }, []);

  React.useEffect(() => {
    const id = setInterval(() => setRemainingMs(deadlineMs - Date.now()), 1000);
    return () => clearInterval(id);
  }, [deadlineMs]);

  function dismiss() {
    setOpen(false);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // ignore — worst case the modal reappears next visit
    }
  }

  if (remainingMs <= 0) return null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && dismiss()}>
      <DialogContent showCloseButton={false} className="max-w-sm gap-0 overflow-hidden p-0">
        <div className="relative bg-gradient-to-br from-primary to-primary/70 px-6 py-5 text-primary-foreground">
          <button
            type="button"
            onClick={dismiss}
            aria-label="Đóng"
            className="absolute right-3 top-3 rounded-full bg-black/10 p-1 hover:bg-black/20"
          >
            <X className="size-4" />
          </button>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold">
            <Gift className="size-3.5" /> KHUYẾN MÃI
          </span>
          <DialogTitle className="mt-3 text-xl font-bold leading-snug text-primary-foreground">
            Ưu đãi chào mừng thành viên mới
          </DialogTitle>
        </div>

        <div className="flex flex-col items-center gap-4 px-6 py-5 text-center">
          <div className="flex w-full flex-col items-center gap-1 rounded-2xl border border-border bg-muted/40 py-4">
            <span className="text-sm text-muted-foreground">Giảm ngay</span>
            <span className="text-3xl font-bold text-primary">{NEW_MEMBER_OFFER_PERCENT}%</span>
          </div>

          <p className="text-sm text-muted-foreground">
            Cảm ơn bạn đã đăng ký tài khoản! Để chào mừng thành viên mới, bạn được giảm ngay {NEW_MEMBER_OFFER_PERCENT}% khi nâng cấp gói Pro trong vài
            ngày đầu tiên. Cơ hội có hạn, nâng cấp ngay để học tập hiệu quả hơn nhé!
          </p>

          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary" /> Còn lại: <span className="font-medium text-foreground">{formatRemaining(remainingMs)}</span>
          </p>

          <Button asChild size="lg" className="w-full" onClick={dismiss}>
            <Link href="/pricing">Đăng ký ngay để nhận ưu đãi</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
