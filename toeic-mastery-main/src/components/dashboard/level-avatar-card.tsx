import { User as UserIcon, Rocket, Flame } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { AnimatedNumber } from "@/components/dashboard/animated-number";
import type { XpProgress } from "@/lib/services/xp";

export function LevelAvatarCard({
  avatarUrl,
  xpProgress,
  todayXp,
  streakCount,
}: {
  avatarUrl: string | null;
  xpProgress: XpProgress;
  todayXp: number;
  streakCount: number;
}) {
  const { level, nextLevel, percentToNext, xpToNext, xp } = xpProgress;

  return (
    <div className="flex w-full max-w-[280px] flex-col items-center gap-4 rounded-2xl bg-white/10 p-5 text-center backdrop-blur-sm">
      <div className="relative">
        <span className="absolute inset-0 -m-1.5 rounded-full bg-white/25 blur-lg" aria-hidden />
        <span className="relative flex size-24 items-center justify-center overflow-hidden rounded-full border-[3px] border-white/50 bg-white/20 shadow-lg">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="size-full object-cover" />
          ) : (
            <UserIcon className="size-9 text-white/80" />
          )}
        </span>
      </div>

      <div>
        <p className="text-xs font-bold tracking-[0.2em] text-white/70 uppercase">{level.name}</p>
        <p className="text-4xl font-bold tracking-tight text-white">
          <AnimatedNumber value={xp} />
        </p>
        <p className="text-xs font-medium text-white/70">XP</p>
      </div>

      <div className="w-full">
        <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold tracking-wide text-white/70 uppercase">
          <span>{level.name}</span>
          {nextLevel && <span className="text-white">{percentToNext}%</span>}
          <span>{nextLevel?.name ?? "Max"}</span>
        </div>
        <Progress value={percentToNext} className="h-2 bg-white/20" indicatorClassName="bg-white" />
      </div>

      {nextLevel && xpToNext !== null ? (
        <p className="flex items-center gap-1 text-xs text-white/85">
          Còn <span className="font-semibold text-white">{xpToNext}</span> XP để lên{" "}
          <span className="font-semibold text-white">{nextLevel.name}</span>! <Rocket className="size-3.5" />
        </p>
      ) : (
        <p className="text-xs text-white/85">Bạn đã đạt cấp cao nhất! 🏆</p>
      )}

      <div className="flex w-full items-center justify-around border-t border-white/15 pt-3">
        <div>
          <p className="text-[10px] font-semibold tracking-wide text-white/60 uppercase">Hôm nay</p>
          <p className="text-sm font-bold text-warning">+{todayXp} XP</p>
        </div>
        <div className="h-7 w-px bg-white/15" aria-hidden />
        <div>
          <p className="text-[10px] font-semibold tracking-wide text-white/60 uppercase">Chuỗi</p>
          <p className="flex items-center justify-center gap-1 text-sm font-bold text-white">
            <Flame className="glow-pulse size-3.5 text-orange-300" />
            {streakCount} ngày
          </p>
        </div>
      </div>
    </div>
  );
}
