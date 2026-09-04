import Link from "next/link";
import { PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export function ContinueLearningCard({
  testTitle,
  currentQuestionIndex,
  totalQuestions,
  attemptId,
}: {
  testTitle: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  attemptId: string;
}) {
  const progressPercent = Math.round((currentQuestionIndex / totalQuestions) * 100);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-gradient-to-br from-accent/60 to-card p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <span className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <span className="absolute inset-0 animate-ping rounded-2xl bg-primary/40" aria-hidden />
          <PlayCircle className="relative size-6" />
        </span>
        <div>
          <p className="text-sm font-semibold">{testTitle}</p>
          <p className="text-xs text-muted-foreground">
            Câu {currentQuestionIndex + 1} / {totalQuestions} · {progressPercent}% hoàn thành
          </p>
          <Progress value={progressPercent} className="mt-2 h-1.5 w-48" />
        </div>
      </div>
      <Button asChild>
        <Link href={`/exam/${attemptId}`}>Tiếp tục</Link>
      </Button>
    </div>
  );
}
