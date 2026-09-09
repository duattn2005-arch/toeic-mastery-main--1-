import Link from "next/link";
import { ArrowRight, Lightbulb } from "lucide-react";
import type { Recommendation } from "@/lib/services/recommendation";

export function RecommendationList({ recommendations }: { recommendations: Recommendation[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {recommendations.map((rec) => (
        <Link
          key={rec.title}
          href={rec.href}
          className="group flex items-start gap-3 rounded-xl border border-border bg-card p-3.5 transition-colors hover:border-primary/40 hover:bg-accent/40"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Lightbulb className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{rec.title}</p>
            <p className="text-xs text-muted-foreground">{rec.description}</p>
          </div>
          <ArrowRight className="mt-1.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
      ))}
    </div>
  );
}
