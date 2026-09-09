import Link from "next/link";
import { Calendar, Lock, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { PART_META } from "@/lib/constants/toeic";
import type { LearningPathOverview, LearningPathDaySummary } from "@/lib/data/learning-path";

export function LearningPathOverviewContent({ data }: { data: LearningPathOverview }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Lộ trình học cá nhân hóa</h1>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>
            {data.daysCompleted}/{data.totalDays} ngày · Mục tiêu {data.targetScore} điểm
          </span>
          {data.examDate && (
            <span className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
              <Calendar className="size-3" /> Thi ngày {new Date(data.examDate).toLocaleDateString("vi-VN")}
            </span>
          )}
        </div>
      </div>

      {data.rationale && <div className="rounded-2xl border border-border bg-card p-4 text-sm text-foreground/90 shadow-soft">{data.rationale}</div>}

      {data.currentDay && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <Target className="size-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Hôm nay</p>
              <p className="text-sm font-semibold">
                Ngày {data.currentDay.dayNumber} · {data.currentDay.focusParts.map((p) => PART_META[p].shortLabel).join(", ") || "—"}
              </p>
            </div>
          </div>
          <Link
            href={`/mentor/path/day/${data.currentDay.dayNumber}`}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
          >
            {data.currentDay.itemsDone > 0 ? `Tiếp tục (${data.currentDay.itemsDone}/${data.currentDay.itemsTotal})` : "Học ngay"} →
          </Link>
        </div>
      )}

      {data.weeks.map((week) => (
        <section key={week.label} className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground">{week.label}</h3>
            <span className="text-xs text-muted-foreground">
              {week.days.filter((d) => d.status === "COMPLETED").length}/{week.days.length}
            </span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {week.days.map((day) => (
              <DayCard key={day.dayNumber} day={day} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function DayCard({ day }: { day: LearningPathDaySummary }) {
  const locked = day.status === "LOCKED";
  const completed = day.status === "COMPLETED";

  const content = (
    <div
      className={cn(
        "flex w-56 shrink-0 flex-col gap-3 rounded-2xl border p-4 shadow-soft transition-all",
        !locked ? "border-border bg-card hover:-translate-y-0.5 hover:border-primary/40" : "border-border/60 bg-card/40"
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-lg text-sm font-bold",
            completed ? "bg-success/15 text-success" : !locked ? "bg-primary/15 text-primary" : "bg-accent text-muted-foreground"
          )}
        >
          {locked ? <Lock className="size-3.5" /> : day.dayNumber}
        </span>
        <div>
          <p className={cn("text-sm font-semibold", locked && "text-muted-foreground")}>Ngày {day.dayNumber}</p>
          <p className="text-xs text-muted-foreground">{new Date(day.scheduledDate).toLocaleDateString("vi-VN")}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {day.focusParts.map((part) => (
          <span
            key={part}
            className={cn("rounded-full px-2 py-0.5 text-xs", !locked ? "bg-accent text-accent-foreground" : "bg-accent/50 text-muted-foreground")}
          >
            {PART_META[part].shortLabel}
          </span>
        ))}
      </div>

      {locked ? (
        <span className="mt-1 rounded-xl bg-accent/50 px-3 py-2 text-center text-sm font-medium text-muted-foreground">Chưa mở khóa</span>
      ) : (
        <span
          className={cn(
            "mt-1 rounded-xl px-3 py-2 text-center text-sm font-semibold",
            completed ? "bg-success/15 text-success" : "bg-primary text-primary-foreground"
          )}
        >
          {completed ? "Đã hoàn thành" : `${day.itemsDone}/${day.itemsTotal} mục`}
        </span>
      )}
    </div>
  );

  return locked ? <div aria-disabled>{content}</div> : <Link href={`/mentor/path/day/${day.dayNumber}`}>{content}</Link>;
}
