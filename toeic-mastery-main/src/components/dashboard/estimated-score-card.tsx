import Link from "next/link";
import { ArrowRight, Target } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Replaces the plain "Điểm ước tính" StatCard when the user has no score
 * yet (never finished a full test and hasn't set a manual current score) —
 * there's nothing to estimate from, so the card becomes a CTA into a mock
 * test instead of just showing an empty dash.
 */
export function EstimatedScoreCard({ score, className }: { score: number | null; className?: string }) {
  if (score != null) {
    return (
      <div className={cn("rounded-2xl border border-border bg-card p-4 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg", className)}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Điểm ước tính</span>
          <span className="flex size-9 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Target className="size-4" />
          </span>
        </div>
        <p className="mt-2.5 text-2xl font-semibold tracking-tight">{score}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">/ 990</p>
      </div>
    );
  }

  return (
    <Link
      href="/practice/start"
      className={cn(
        "col-span-2 flex flex-col justify-between gap-2 rounded-2xl border border-primary/30 bg-primary/5 p-4 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:col-span-1",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Điểm ước tính</span>
        <span className="flex size-9 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Target className="size-4" />
        </span>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Chưa có dữ liệu để ước tính điểm</p>
        <p className="mt-1.5 flex items-center gap-1 text-sm font-semibold text-primary">
          Làm bài test thử <ArrowRight className="size-3.5" />
        </p>
      </div>
    </Link>
  );
}
