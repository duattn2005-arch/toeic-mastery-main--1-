import Link from "next/link";
import { Clock, ListChecks, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DIFFICULTY_LABEL_VI } from "@/lib/constants/toeic";
import { cn } from "@/lib/utils";

const DIFFICULTY_VARIANT: Record<string, string> = {
  EASY: "bg-success/10 text-success",
  MEDIUM: "bg-warning/10 text-warning",
  HARD: "bg-destructive/10 text-destructive",
};

const DIFFICULTY_BAR: Record<string, string> = {
  EASY: "bg-success",
  MEDIUM: "bg-warning",
  HARD: "bg-destructive",
};

export function TestCard({
  title,
  difficulty,
  totalQuestions,
  durationMinutes,
  usersCompleted,
  bestScore,
  progressPercent,
  href,
  ctaLabel,
}: {
  title: string;
  difficulty: string;
  totalQuestions: number;
  durationMinutes: number;
  usersCompleted: number;
  bestScore: number | null;
  progressPercent?: number | null;
  href: string;
  ctaLabel: string;
}) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <span className={cn("absolute inset-x-0 top-0 h-1", DIFFICULTY_BAR[difficulty] ?? "bg-primary")} aria-hidden />
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-snug">{title}</h3>
        <Badge className={DIFFICULTY_VARIANT[difficulty] ?? ""} variant="secondary">
          {DIFFICULTY_LABEL_VI[difficulty] ?? difficulty}
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <ListChecks className="size-3.5" /> {totalQuestions} câu
        </span>
        <span className="flex items-center gap-1">
          <Clock className="size-3.5" /> {durationMinutes} phút
        </span>
        <span className="flex items-center gap-1">
          <Users className="size-3.5" /> {usersCompleted} lượt làm
        </span>
        {bestScore !== null && (
          <span className="flex items-center gap-1">
            <Trophy className="size-3.5" /> Điểm cao nhất {bestScore}
          </span>
        )}
      </div>

      {typeof progressPercent === "number" && progressPercent > 0 && (
        <div className="mt-3.5">
          <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
            <span>Tiến độ</span>
            <span>{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
        </div>
      )}

      <Button asChild className="mt-4">
        <Link href={href}>{ctaLabel}</Link>
      </Button>
    </div>
  );
}
