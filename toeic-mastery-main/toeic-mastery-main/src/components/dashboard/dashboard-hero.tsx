import { Flame } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { StreakHeatmap } from "@/components/dashboard/streak-heatmap";
import { MotivationalQuote } from "@/components/dashboard/motivational-quote";
import { LevelAvatarCard } from "@/components/dashboard/level-avatar-card";
import type { XpProgress } from "@/lib/services/xp";

export function DashboardHero({
  greeting,
  firstName,
  avatarUrl,
  xpProgress,
  todayXp,
  streakCount,
  weeklyStudyMinutes,
  weeklyGoalMinutes,
  activityHeatmap,
}: {
  greeting: string;
  firstName: string;
  avatarUrl: string | null;
  xpProgress: XpProgress;
  todayXp: number;
  streakCount: number;
  weeklyStudyMinutes: number;
  weeklyGoalMinutes: number;
  activityHeatmap: { date: string; minutes: number }[];
}) {
  const weeklyPercent = weeklyGoalMinutes > 0 ? Math.min(100, Math.round((weeklyStudyMinutes / weeklyGoalMinutes) * 100)) : 0;

  return (
    <section className="hero-ambient relative overflow-hidden rounded-3xl p-6 text-white shadow-soft sm:p-8">
      <div className="hero-blob pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-white/10 blur-3xl" aria-hidden />
      <div
        className="hero-blob pointer-events-none absolute -bottom-20 -left-10 size-56 rounded-full bg-[#17a673]/30 blur-3xl"
        style={{ animationDelay: "-6s" }}
        aria-hidden
      />
      <div
        className="hero-blob pointer-events-none absolute top-1/3 right-1/4 size-40 rounded-full bg-[#f5a524]/20 blur-3xl"
        style={{ animationDelay: "-11s" }}
        aria-hidden
      />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {greeting}, {firstName} 👋
            </h1>
            <div className="mt-2 max-w-md">
              <MotivationalQuote />
            </div>
          </div>

          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium backdrop-blur-sm">
            <Flame className="glow-pulse size-4 text-orange-300" />
            {streakCount} ngày liên tiếp
          </span>

          <div className="max-w-xs">
            <div className="mb-1.5 flex items-center justify-between text-xs text-white/80">
              <span>Mục tiêu tuần</span>
              <span>
                {weeklyStudyMinutes}p / {weeklyGoalMinutes}p
              </span>
            </div>
            <Progress value={weeklyPercent} className="h-2 bg-white/20" indicatorClassName="bg-white" />
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-white/70">HOẠT ĐỘNG 14 NGÀY QUA</p>
            <StreakHeatmap data={activityHeatmap} />
          </div>
        </div>

        <LevelAvatarCard avatarUrl={avatarUrl} xpProgress={xpProgress} todayXp={todayXp} streakCount={streakCount} />
      </div>
    </section>
  );
}
