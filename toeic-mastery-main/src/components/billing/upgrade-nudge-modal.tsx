"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, Crown, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PRO_PLANS, planSavingsPercent } from "@/lib/constants/billing";

const SESSION_SHOWN_KEY = "upgrade_nudge_shown_session_v1";

/** WelcomeOfferModal's own flag — read directly rather than through that
 * component, same "one-off check, not step tracking" reasoning it uses for
 * DASHBOARD_TOUR_DONE_KEY. Lets this modal wait its turn on a session where
 * the account also qualifies for the real new-member discount, instead of
 * stacking two upsell dialogs at once. */
const WELCOME_OFFER_SESSION_DONE_KEY = "welcome_offer_session_done";
const DASHBOARD_TOUR_DONE_KEY = "tour_dashboard_done";
const WAIT_TIMEOUT_MS = 90_000;
const POLL_INTERVAL_MS = 800;

function readFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === "true";
  } catch {
    return true; // fail open — localStorage unavailable, don't block on it
  }
}

function sessionAlreadyShown(): boolean {
  try {
    return sessionStorage.getItem(SESSION_SHOWN_KEY) === "true";
  } catch {
    return false; // fail open — worst case it shows every load this session
  }
}

function markSessionShown() {
  try {
    sessionStorage.setItem(SESSION_SHOWN_KEY, "true");
  } catch {
    // Fail open — no persistence, just reappears next load.
  }
}

const HIGHLIGHTS = [
  "Không giới hạn Mock Test & Tra từ bôi đen",
  "Mở khóa toàn bộ Từ đồng nghĩa & Ví dụ chuyên sâu",
  "100% Không quảng cáo & Hỗ trợ ưu tiên",
];

/** Generic "upgrade to Pro" reminder for Free accounts — unlike
 * WelcomeOfferModal (a real, time-boxed 25% discount only for brand-new
 * signups), this carries no discount claim and no countdown: it shows the
 * regular price and exists purely to keep the upgrade path visible. Reappears
 * once per browser session (sessionStorage, not a lifetime view cap) for as
 * long as the account stays Free — the parent only mounts this component
 * while profile.plan === "FREE", so it stops appearing the moment the
 * account is upgraded, with no dismiss-forever escape hatch. */
export function UpgradeNudgeModal({ hasWelcomeOffer }: { hasWelcomeOffer: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const recommendedPlan = PRO_PLANS.THREE_MONTHS;

  React.useEffect(() => {
    if (sessionAlreadyShown()) return;

    function reveal() {
      markSessionShown();
      setOpen(true);
    }

    const clearToShow = () =>
      (pathname !== "/dashboard" || readFlag(DASHBOARD_TOUR_DONE_KEY)) &&
      (!hasWelcomeOffer || readFlag(WELCOME_OFFER_SESSION_DONE_KEY));

    if (clearToShow()) {
      reveal();
      return;
    }

    const startedAt = Date.now();
    const id = setInterval(() => {
      if (clearToShow() || Date.now() - startedAt > WAIT_TIMEOUT_MS) {
        clearInterval(id);
        reveal();
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function dismiss() {
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && dismiss()}>
      <DialogContent showCloseButton={false} className="max-w-md gap-0 overflow-hidden border-0 p-0 shadow-2xl">
        <div className="hero-ambient relative overflow-hidden px-6 pb-7 pt-6 text-white">
          <div className="hero-blob pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-white/15 blur-3xl" aria-hidden />

          <button
            type="button"
            onClick={dismiss}
            aria-label="Đóng"
            className="absolute right-3 top-3 z-10 rounded-full bg-black/15 p-1.5 transition-colors hover:bg-black/30"
          >
            <X className="size-4" />
          </button>

          <div className="relative flex flex-col items-center gap-3 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
              <Crown className="size-8 text-white" />
            </div>
            <DialogTitle className="text-xl font-bold leading-snug text-white">Nâng cấp lên Pro để học nhanh hơn</DialogTitle>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 px-6 py-6 text-center">
          <ul className="flex w-full flex-col gap-2 text-left text-sm">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col items-center gap-1">
            <p className="text-2xl font-bold">{recommendedPlan.amountVnd.toLocaleString("vi-VN")}đ</p>
            <p className="text-xs text-muted-foreground">
              Gói {recommendedPlan.label} • Tiết kiệm {planSavingsPercent("THREE_MONTHS")}% so với mua từng tháng
            </p>
          </div>

          <Button asChild size="lg" className="w-full text-base font-semibold" onClick={dismiss}>
            <Link href="/pricing">
              <Crown className="size-4" /> Xem các gói Pro
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
