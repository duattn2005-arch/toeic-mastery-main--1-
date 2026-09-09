import Link from "next/link";
import { Lock, Star, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import type { getVocabularyPathOverview } from "@/lib/data/vocabulary-path";

type PathOverview = Awaited<ReturnType<typeof getVocabularyPathOverview>>;

/** The "20 ngày" tab's content — rank/XP widget, today's callout, and the
 * tier-grouped, horizontally-scrollable day rows. Pure presentational (data
 * fetched once in the /vocabulary page and passed down), so it can be
 * rendered inside the client-side tab switcher without itself needing to be
 * a Client Component. */
export function PathOverviewContent({ data }: { data: PathOverview }) {
  const { xpProgress } = data;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{data.title}</h2>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>
            {data.daysCompleted}/{data.totalDays} ngày · {data.totalWords} từ
          </span>
          <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">{xpProgress.level.name}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
        <div className="h-2 w-full overflow-hidden rounded-full bg-accent">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${xpProgress.percentToNext}%` }} />
        </div>
        <p className="mt-2 text-right text-xs text-muted-foreground">
          {xpProgress.nextLevel ? `→ ${xpProgress.nextLevel.name} (còn ${xpProgress.xpToNext} XP)` : "Đã đạt cấp cao nhất"}
        </p>
      </div>

      {data.currentDay && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <Target className="size-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Hôm nay</p>
              <p className="text-sm font-semibold">
                Ngày {data.currentDay.dayNumber} · {data.currentDay.stepsCompleted}/3 bước
              </p>
            </div>
          </div>
          <Link
            href={`/vocabulary/path/day/${data.currentDay.dayNumber}`}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
          >
            Học ngay →
          </Link>
        </div>
      )}

      {data.tiers.map((tier) => (
        <section key={tier.label} className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground">
              {tier.label} · Ngày {tier.days[0].dayNumber}-{tier.days[tier.days.length - 1].dayNumber}
            </h3>
            <span className="text-xs text-muted-foreground">
              {tier.days.filter((d) => d.isCompleted).length}/{tier.days.length}
            </span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {tier.days.map((day) => (
              <DayCard key={day.dayNumber} day={day} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function DayCard({
  day,
}: {
  day: {
    dayNumber: number;
    wordCount: number;
    topicNames: string[];
    stepsCompleted: number;
    stars: number;
    isCompleted: boolean;
    isUnlocked: boolean;
  };
}) {
  const shownTags = day.topicNames.slice(0, 2);
  const extraCount = day.topicNames.length - shownTags.length;

  const content = (
    <div
      className={cn(
        "flex w-64 shrink-0 flex-col gap-3 rounded-2xl border p-4 shadow-soft transition-all",
        day.isUnlocked ? "border-border bg-card hover:-translate-y-0.5 hover:border-primary/40" : "border-border/60 bg-card/40"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-lg text-sm font-bold",
              day.isCompleted ? "bg-success/15 text-success" : day.isUnlocked ? "bg-primary/15 text-primary" : "bg-accent text-muted-foreground"
            )}
          >
            {day.isUnlocked ? day.dayNumber : <Lock className="size-3.5" />}
          </span>
          <div>
            <p className={cn("text-sm font-semibold", !day.isUnlocked && "text-muted-foreground")}>Ngày {day.dayNumber}</p>
            <p className="text-xs text-muted-foreground">{day.wordCount} từ</p>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3].map((n) => (
            <Star key={n} className={cn("size-3.5", n <= day.stars ? "fill-warning text-warning" : "text-muted-foreground/25")} />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {shownTags.map((name) => (
          <span key={name} className={cn("rounded-full px-2 py-0.5 text-xs", day.isUnlocked ? "bg-accent text-accent-foreground" : "bg-accent/50 text-muted-foreground")}>
            {name}
          </span>
        ))}
        {extraCount > 0 && <span className="rounded-full bg-accent/50 px-2 py-0.5 text-xs text-muted-foreground">+{extraCount}</span>}
      </div>

      {day.isUnlocked ? (
        <span
          className={cn(
            "mt-1 rounded-xl px-3 py-2 text-center text-sm font-semibold",
            day.isCompleted ? "bg-success/15 text-success" : "bg-primary text-primary-foreground"
          )}
        >
          {day.isCompleted ? "Đã hoàn thành" : day.stepsCompleted > 0 ? `Tiếp tục (${day.stepsCompleted}/3)` : "Học ngay"}
        </span>
      ) : (
        <span className="mt-1 rounded-xl bg-accent/50 px-3 py-2 text-center text-sm font-medium text-muted-foreground">Chưa mở khóa</span>
      )}
    </div>
  );

  return day.isUnlocked ? <Link href={`/vocabulary/path/day/${day.dayNumber}`}>{content}</Link> : <div aria-disabled>{content}</div>;
}
