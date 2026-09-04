import { cn } from "@/lib/utils";

const WEEKDAY_VI = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function intensityClass(minutes: number) {
  if (minutes <= 0) return "bg-white/10";
  if (minutes < 15) return "bg-white/35";
  if (minutes < 30) return "bg-white/60";
  if (minutes < 60) return "bg-white/85";
  return "bg-white";
}

/** 14-day study-activity heatmap, styled for the dark hero surface. */
export function StreakHeatmap({ data }: { data: { date: string; minutes: number }[] }) {
  return (
    <div className="flex items-end gap-1.5">
      {data.map((d) => {
        const day = new Date(`${d.date}T00:00:00`);
        const label = `${WEEKDAY_VI[day.getDay()]} ${day.getDate()}/${day.getMonth() + 1} · ${d.minutes} phút`;
        return (
          <div key={d.date} className="flex flex-col items-center gap-1" title={label}>
            <span
              className={cn("size-3.5 rounded-[4px] transition-transform hover:scale-125", intensityClass(d.minutes))}
              aria-hidden
            />
          </div>
        );
      })}
    </div>
  );
}
