"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gift, Sparkles, X, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { NEW_MEMBER_OFFER_PERCENT } from "@/lib/constants/billing";

const VIEW_COUNT_KEY = "welcome_offer_view_count_v2";
const MAX_VIEWS = 5;

/** Signals to UpgradeNudgeModal that this modal has resolved its decision
 * for the session (shown-and-dismissed, or determined it won't show at
 * all) — lets the generic nudge wait its turn instead of stacking on top
 * of the real discount offer. Session-scoped, not the lifetime view flag
 * above, since the nudge needs to know per-session, not forever. */
const WELCOME_OFFER_SESSION_DONE_KEY = "welcome_offer_session_done";

function markWelcomeOfferSessionDone() {
  try {
    sessionStorage.setItem(WELCOME_OFFER_SESSION_DONE_KEY, "true");
  } catch {
    // Fail open — worst case the nudge modal waits the full timeout.
  }
}

/** DashboardTour's own "done" flag (see use-tour-step.ts) — read directly
 * rather than through that hook, since this modal isn't part of the tour
 * and only needs a one-off check, not step tracking. */
const DASHBOARD_TOUR_DONE_KEY = "tour_dashboard_done";
/** How long to wait for the dashboard tour to finish before showing the
 * offer anyway — a fresh signup who abandons the tour mid-way (navigates
 * off before clicking "Bỏ qua" or finishing) would otherwise never see the
 * offer at all, since tour_dashboard_done would never flip to "true". */
const TOUR_WAIT_TIMEOUT_MS = 90_000;
const TOUR_POLL_INTERVAL_MS = 800;

function isDashboardTourDone(): boolean {
  try {
    return localStorage.getItem(DASHBOARD_TOUR_DONE_KEY) === "true";
  } catch {
    return true; // fail open — localStorage unavailable, don't block on it
  }
}

interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function toCountdown(ms: number): Countdown {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
  };
}

function CountdownBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex w-14 flex-col items-center gap-1 rounded-xl border border-white/15 bg-white/10 py-2 backdrop-blur-sm">
      <span className="text-xl font-bold tabular-nums text-white">{String(value).padStart(2, "0")}</span>
      <span className="text-[10px] font-medium uppercase tracking-wide text-white/70">{label}</span>
    </div>
  );
}

/** Shown up to MAX_VIEWS times per browser to eligible new Free accounts
 * (see getNewMemberOfferState — the real, server-checked eligibility this
 * modal only reflects). The countdown is a real per-account deadline read
 * from the server, not a per-visit reset, so closing and reopening the page
 * never buys extra time — only the *number of times it's shown* is tracked
 * client-side, via a view counter rather than the old "dismissed forever"
 * flag. */
export function WelcomeOfferModal({ deadline }: { deadline: string }) {
  const pathname = usePathname();
  const deadlineMs = React.useMemo(() => new Date(deadline).getTime(), [deadline]);
  const [open, setOpen] = React.useState(false);
  const [viewNumber, setViewNumber] = React.useState<number | null>(null);
  const [remainingMs, setRemainingMs] = React.useState(() => deadlineMs - Date.now());

  React.useEffect(() => {
    let count = MAX_VIEWS + 1;
    try {
      count = Number(localStorage.getItem(VIEW_COUNT_KEY) ?? "0") + 1;
      localStorage.setItem(VIEW_COUNT_KEY, String(count));
    } catch {
      // localStorage unavailable (private mode, blocked storage) — fail open, just show it once.
      count = 1;
    }
    if (count > MAX_VIEWS) {
      markWelcomeOfferSessionDone();
      return;
    }

    // On /dashboard, DashboardTour's own welcome dialog can be open at the
    // exact same moment this effect runs — both are separate portal-rendered
    // dialogs with no shared parent to sequence them, so without this check
    // they stack (confirmed via screenshot: the tour's spotlight ends up
    // hidden behind this modal). Wait for the tour to finish/skip before
    // opening here; give up and show anyway after TOUR_WAIT_TIMEOUT_MS so an
    // abandoned tour (closed tab, navigated away mid-tour) can't silently
    // swallow the offer for the rest of its eligibility window.
    if (pathname !== "/dashboard" || isDashboardTourDone()) {
      // One-time sync with the browser's localStorage, not app state — same
      // pattern as theme-toggle.tsx's mounted flag.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setViewNumber(count);
      setOpen(true);
      return;
    }

    const startedAt = Date.now();
    const id = setInterval(() => {
      if (isDashboardTourDone() || Date.now() - startedAt > TOUR_WAIT_TIMEOUT_MS) {
        clearInterval(id);
        setViewNumber(count);
        setOpen(true);
      }
    }, TOUR_POLL_INTERVAL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const id = setInterval(() => setRemainingMs(deadlineMs - Date.now()), 1000);
    return () => clearInterval(id);
  }, [deadlineMs]);

  function dismiss() {
    setOpen(false);
    markWelcomeOfferSessionDone();
  }

  if (remainingMs <= 0) return null;
  const countdown = toCountdown(remainingMs);
  const isLastView = viewNumber === MAX_VIEWS;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && dismiss()}>
      <DialogContent
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="max-w-md gap-0 overflow-hidden border-0 p-0 shadow-2xl"
      >
        <div className="hero-ambient relative overflow-hidden px-6 pb-7 pt-6 text-white">
          <div className="hero-blob pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-white/15 blur-3xl" aria-hidden />
          <div
            className="hero-blob pointer-events-none absolute -bottom-16 -left-8 size-40 rounded-full bg-[#f5a524]/25 blur-3xl"
            style={{ animationDelay: "-6s" }}
            aria-hidden
          />

          <button
            type="button"
            onClick={dismiss}
            aria-label="Đóng"
            className="absolute right-3 top-3 z-10 rounded-full bg-black/15 p-1.5 transition-colors hover:bg-black/30"
          >
            <X className="size-4" />
          </button>

          <div className="relative flex flex-col items-center gap-4 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              <span className="notify-dot size-1.5 rounded-full bg-emerald-300" />
              ƯU ĐÃI DÀNH RIÊNG CHO THÀNH VIÊN MỚI
            </span>

            <div className="relative flex size-32 items-center justify-center">
              <div
                className="spin-slow absolute inset-0 rounded-full opacity-70"
                style={{
                  background: "conic-gradient(from 0deg, transparent, rgba(255,255,255,0.5), transparent 40%)",
                }}
                aria-hidden
              />
              <div className="absolute inset-2 rounded-full bg-white/10 backdrop-blur-sm" aria-hidden />
              <Sparkles className="absolute -left-1 top-2 size-4 text-white/70" aria-hidden />
              <Sparkles className="absolute -right-2 bottom-4 size-5 text-white/60" aria-hidden />
              <div className="relative flex flex-col items-center leading-none">
                <span className="text-4xl font-extrabold drop-shadow-sm">-{NEW_MEMBER_OFFER_PERCENT}%</span>
                <span className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-white/80">Giảm ngay</span>
              </div>
            </div>

            <DialogTitle className="text-xl font-bold leading-snug text-white">Chào mừng bạn đến với TOEIC Mastery! 🎉</DialogTitle>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 px-6 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Cảm ơn bạn đã đăng ký tài khoản! Đây là món quà chào mừng dành riêng cho thành viên mới — giảm ngay{" "}
            <span className="font-semibold text-foreground">{NEW_MEMBER_OFFER_PERCENT}%</span> khi nâng cấp Pro trong những ngày đầu tiên.
          </p>

          <div className="flex flex-col items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Zap className="size-3.5 text-warning" /> Ưu đãi kết thúc sau
            </span>
            <div className="flex gap-2 rounded-2xl bg-gradient-to-br from-primary to-primary/70 px-3 py-2.5 shadow-soft">
              <CountdownBox value={countdown.days} label="Ngày" />
              <CountdownBox value={countdown.hours} label="Giờ" />
              <CountdownBox value={countdown.minutes} label="Phút" />
              <CountdownBox value={countdown.seconds} label="Giây" />
            </div>
          </div>

          {isLastView && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
              🔥 Đây là lần cuối ưu đãi này xuất hiện — đừng bỏ lỡ!
            </p>
          )}

          <Button asChild size="lg" className="glow-pulse-primary w-full text-base font-semibold" onClick={dismiss}>
            <Link href="/pricing">
              <Gift className="size-4" /> Nhận ưu đãi ngay
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
