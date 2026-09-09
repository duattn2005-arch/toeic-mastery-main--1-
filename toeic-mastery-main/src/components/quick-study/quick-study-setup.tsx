"use client";

import * as React from "react";
import Link from "next/link";
import { Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { startQuickStudySessionAction } from "@/lib/actions/quick-study";
import { QuickStudyRunner } from "@/components/quick-study/quick-study-runner";
import type { QuickStudyItem } from "@/lib/data/quick-study";

const FREE_MINUTES = 7;
const MIN_PRO_MINUTES = 5;
const MAX_PRO_MINUTES = 60;

export function QuickStudySetup({ isPro }: { isPro: boolean }) {
  const [minutes, setMinutes] = React.useState(isPro ? 15 : FREE_MINUTES);
  const [pending, startTransition] = React.useTransition();
  const [session, setSession] = React.useState<{ items: QuickStudyItem[]; durationSec: number } | null>(null);

  function handleStart() {
    startTransition(async () => {
      const result = await startQuickStudySessionAction(minutes);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setSession(result);
    });
  }

  if (session) {
    return (
      <QuickStudyRunner
        key={session.items.map((i) => (i.type === "question" ? i.id : i.vocabularyWordId)).join(",")}
        items={session.items}
        durationSec={session.durationSec}
        onRestart={() => setSession(null)}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Thời lượng ôn</p>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-lg font-bold text-primary">{minutes} phút</span>
      </div>

      <div className="relative">
        <Slider
          value={[minutes]}
          onValueChange={(v) => isPro && setMinutes(v[0])}
          min={isPro ? MIN_PRO_MINUTES : FREE_MINUTES}
          max={isPro ? MAX_PRO_MINUTES : FREE_MINUTES}
          step={5}
          disabled={!isPro}
          className={!isPro ? "opacity-60" : undefined}
        />
        {!isPro && (
          <button
            type="button"
            onClick={() => toast("Nâng cấp Pro để tùy chỉnh thời gian ôn (5–60 phút).")}
            className="absolute inset-0 flex cursor-pointer items-center justify-end pr-1"
            aria-label="Nâng cấp Pro để tùy chỉnh thời gian"
          >
            <Crown className="size-4 text-amber-500" />
          </button>
        )}
      </div>

      {isPro ? (
        <p className="text-xs text-muted-foreground">Kéo thanh trượt để chọn thời gian ôn từ {MIN_PRO_MINUTES} đến {MAX_PRO_MINUTES} phút.</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Gói Free cố định {FREE_MINUTES} phút/lượt.{" "}
          <Link href="/pricing" className="font-medium text-primary underline underline-offset-2">
            Nâng cấp Pro
          </Link>{" "}
          để tùy chỉnh 5–60 phút.
        </p>
      )}

      <Button onClick={handleStart} disabled={pending} size="lg">
        {pending && <Loader2 className="size-4 animate-spin" />}
        Bắt đầu
      </Button>
    </div>
  );
}
