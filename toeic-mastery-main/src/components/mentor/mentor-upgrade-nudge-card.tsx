import Link from "next/link";
import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Rendered when the RECOMMEND_NEXT_STEPS marker fires but the Free daily
 * cap is already spent (see mentor-access.ts) — the conversational reply
 * itself is never blocked, only this one feature nudges toward Pro. */
export function MentorUpgradeNudgeCard({ message }: { message: string }) {
  return (
    <div className="flex w-full items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-3.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-warning/20 text-warning">
        <Crown className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground/90">{message}</p>
        <Button asChild size="sm" className="mt-2">
          <Link href="/pricing">Nâng cấp Pro</Link>
        </Button>
      </div>
    </div>
  );
}
