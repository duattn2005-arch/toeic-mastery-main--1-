import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RotateCcw, Sparkles, Target } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getAttemptResult } from "@/lib/data/history";
import { Button } from "@/components/ui/button";
import { ScoreResultHeader } from "@/components/history/score-result-header";
import { ScoreChart } from "@/components/shared/score-chart";
import { QuestionReviewList } from "@/components/history/question-review-list";
import { ResultCelebration } from "@/components/history/result-celebration";
import { StudyMascot } from "@/components/mascot/study-mascot";
import { HistoryResultTour } from "@/components/history/history-result-tour";

export const metadata: Metadata = { title: "Kết quả bài thi" };

export default async function AttemptResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const profile = await requireUser();

  const { attempt, questionReviews, partBreakdown, timeUsedSec, xpEarned } = await getAttemptResult(attemptId, profile.id);

  if (attempt.status === "IN_PROGRESS") redirect(`/exam/${attemptId}`);

  const correctCount = attempt.correctCount ?? 0;
  const wrongCount = attempt.wrongCount ?? 0;
  const skippedCount = attempt.skippedCount ?? 0;
  const accuracy = correctCount + wrongCount > 0 ? correctCount / (correctCount + wrongCount) : 0;
  const achievedTarget = !!profile.targetScore && !!attempt.totalScore && attempt.totalScore >= profile.targetScore;

  return (
    <div className="flex flex-col gap-6">
      <ResultCelebration attemptId={attemptId} achievedTarget={achievedTarget} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{attempt.test.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Nộp bài lúc {attempt.submittedAt?.toLocaleString("vi-VN")} · Chế độ {attempt.mode === "EXAM" ? "Thi thử" : "Luyện tập"}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-3.5 py-1.5 text-sm font-semibold text-warning">
          <Sparkles className="size-4" />+{xpEarned} XP từ bài này
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg">
          <Link href={`/history/${attemptId}/retry?scope=all`}>
            <RotateCcw className="size-4" />
            Luyện tập lại tất cả
          </Link>
        </Button>
        {wrongCount + skippedCount > 0 && (
          <Button asChild size="lg" variant="destructive">
            <Link href={`/history/${attemptId}/retry?scope=mistakes`}>
              <Target className="size-4" />
              Luyện tập lại câu sai ({wrongCount + skippedCount})
            </Link>
          </Button>
        )}
      </div>

      <div data-tour="history-result-score">
        <ScoreResultHeader
          isEstimated
          totalScore={attempt.totalScore}
          listeningScore={attempt.listeningScore}
          readingScore={attempt.readingScore}
          correctCount={correctCount}
          wrongCount={wrongCount}
          skippedCount={skippedCount}
          accuracy={accuracy}
          timeUsedSec={timeUsedSec}
        />
      </div>

      {partBreakdown.length > 1 && (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
          <h2 className="mb-1 text-sm font-semibold text-muted-foreground">PHÂN TÍCH THEO PART</h2>
          <ScoreChart data={partBreakdown} />
        </section>
      )}

      <section data-tour="history-result-questions">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">XEM LẠI ĐÁP ÁN</h2>
        <QuestionReviewList reviews={questionReviews} attemptId={attemptId} />
      </section>

      <StudyMascot state="success" character="rabbit" message={`Bạn vừa nhận +${xpEarned} XP từ bài này! 🎉`} />
      <HistoryResultTour />
    </div>
  );
}
