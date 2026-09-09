import type { Metadata } from "next";
import { Clock3, ListChecks, TrendingDown, TrendingUp } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getAnalyticsData } from "@/lib/data/analytics";
import { StatCard } from "@/components/shared/stat-card";
import { SkillRadar } from "@/components/shared/skill-radar";
import { ScoreTrendChart } from "@/components/analytics/score-trend-chart";
import { StudyTimeChart } from "@/components/analytics/study-time-chart";
import { EmptyState } from "@/components/shared/empty-state";
import { formatStudyDuration } from "@/lib/utils";

export const metadata: Metadata = { title: "Thống kê" };

export default async function AnalyticsPage() {
  const profile = await requireUser();
  const data = await getAnalyticsData(profile.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Thống kê học tập</h1>
        <p className="mt-1 text-sm text-muted-foreground">Theo dõi tiến bộ điểm số và phân tích điểm mạnh, điểm yếu.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={ListChecks} label="Đề đã hoàn thành" value={data.overallStats.attemptsCompleted} />
        <StatCard icon={ListChecks} label="Câu đã làm" value={data.overallStats.questionsAnswered} />
        <StatCard icon={Clock3} label="Tổng giờ học" value={formatStudyDuration(data.overallStats.totalStudySeconds)} />
        <StatCard icon={TrendingUp} label="Độ chính xác" value={`${Math.round(data.overallStats.accuracy * 100)}%`} accent="success" />
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
        <h2 className="mb-1 text-sm font-semibold text-muted-foreground">TIẾN ĐỘ ĐIỂM SỐ THEO THỜI GIAN</h2>
        {data.scoreTrend.length === 0 ? (
          <EmptyState icon={TrendingUp} title="Chưa có dữ liệu điểm số" description="Hoàn thành một đề Full Test để bắt đầu theo dõi." />
        ) : (
          <ScoreTrendChart data={data.scoreTrend} />
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="mb-1 text-sm font-semibold text-muted-foreground">PHÂN TÍCH KỸ NĂNG THEO PART</h2>
          <SkillRadar data={data.partAccuracies} />
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">THỜI GIAN HỌC (14 NGÀY GẦN ĐÂY)</h2>
          <StudyTimeChart data={data.studyTimeTrend} />
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-success">
            <TrendingUp className="size-4" /> ĐIỂM MẠNH
          </h2>
          {data.strongParts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa đủ dữ liệu.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {data.strongParts.map((p) => (
                <li key={p.part} className="flex items-center justify-between text-sm">
                  <span>{p.label}</span>
                  <span className="font-semibold text-success">{Math.round(p.accuracy * 100)}%</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-destructive">
            <TrendingDown className="size-4" /> ĐIỂM YẾU
          </h2>
          {data.weakParts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa đủ dữ liệu.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {data.weakParts.map((p) => (
                <li key={p.part} className="flex items-center justify-between text-sm">
                  <span>{p.label}</span>
                  <span className="font-semibold text-destructive">{Math.round(p.accuracy * 100)}%</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
