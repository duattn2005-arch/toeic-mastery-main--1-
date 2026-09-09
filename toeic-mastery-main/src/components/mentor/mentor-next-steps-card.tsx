import Link from "next/link";
import { ArrowRight, BookOpen, ClipboardList, Layers, SpellCheck2, type LucideIcon } from "lucide-react";
import type { NextStepSuggestionDTO } from "./types";

const KIND_ICON: Record<NextStepSuggestionDTO["kind"], LucideIcon> = {
  PART_PRACTICE: ClipboardList,
  VOCAB_REVIEW: Layers,
  GRAMMAR_LESSON: SpellCheck2,
  FULL_TEST: BookOpen,
};

export function MentorNextStepsCard({ items }: { items: NextStepSuggestionDTO[] }) {
  if (items.length === 0) return null;

  return (
    <div className="flex w-full flex-col gap-2">
      {items.map((item, i) => {
        const Icon = KIND_ICON[item.kind];
        return (
          <Link
            key={i}
            href={item.href}
            className="group flex items-start gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-accent/40"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Icon className="size-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
            <ArrowRight className="mt-1.5 size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        );
      })}
    </div>
  );
}
