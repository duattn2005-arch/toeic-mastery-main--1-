import type { Metadata } from "next";
import { BookOpen, CheckCircle2, Clock3, Layers, Lightbulb, ListChecks, PlayCircle, Radar as RadarIcon, Target } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/data/dashboard";
import { getSiteThemeId } from "@/lib/data/site-theme";
import { StatCard } from "@/components/shared/stat-card";
import { SkillRadar } from "@/components/shared/skill-radar";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionHeader } from "@/components/shared/section-header";
import { TestCard } from "@/components/practice/test-card";
import { ContinueLearningCard } from "@/components/dashboard/continue-learning-card";
import { RecommendationList } from "@/components/dashboard/recommendation-list";
import { DueWordList } from "@/components/vocabulary/due-word-list";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { DashboardTour } from "@/components/dashboard/dashboard-tour";
import { StudyMascot } from "@/components/mascot/study-mascot";
import type { MascotState } from "@/components/mascot/types";
import type { DashboardData } from "@/lib/data/dashboard";
import { formatStudyDuration, toDateOnlyUTC } from "@/lib/utils";

export const metadata: Metadata = { title: "Tổng quan" };

/** Dashboard has no live "activity" to react to, so the mascot reflects
 * today's study state instead: already studied today, has a streak to
 * protect, or just a plain greeting for a first-time/inactive user. */
function getDashboardMascotState(profile: DashboardData["profile"]): MascotState {
  const today = toDateOnlyUTC(new Date());
  const last = profile.lastStudyDate ? toDateOnlyUTC(new Date(profile.lastStudyDate)) : null;
  const studiedToday = last !== null && last.getTime() === today.getTime();

  if (studiedToday) return "encouraging";
  if (profile.streakCount > 0) return "reminder";
  return "idle";
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "Chào buổi sáng";
  if (hour < 14) return "Chào buổi trưa";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

/**
 * Staggered fade+slide entrance — pure CSS (tw-animate-css), no client JS.
 * Class strings must stay static/literal so Tailwind's build-time scanner
 * can find them; interpolating the delay value would produce a class name
 * Tailwind never generates CSS for.
 */
const REVEAL = [
  "animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both",
  "animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75 fill-mode-both",
  "animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 fill-mode-both",
  "animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-both",
  "animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 fill-mode-both",
] as const;

export default async function DashboardPage() {
  const profile = await requireUser();
  const [data, siteThemeId] = await Promise.all([getDashboardData(profile.id), getSiteThemeId(profile.id)]);
  const firstName = (data.profile.fullName ?? "bạn").split(" ").pop() ?? "bạn";
  const score = data.predictedScore?.total ?? data.profile.currentScore;

  return (
    <div className="flex flex-col gap-6">
      <div className={REVEAL[0]}>
        <DashboardHero
          greeting={getGreeting()}
          firstName={firstName}
          avatarUrl={data.profile.avatarUrl}
          xpProgress={data.xpProgress}
          todayXp={data.todayXp}
          streakCount={data.profile.streakCount}
          weeklyStudyMinutes={data.weeklyStudyMinutes}
          weeklyGoalMinutes={data.profile.dailyStudyTargetMinutes * 7}
          activityHeatmap={data.activityHeatmap}
          themeId={siteThemeId}
        />
      </div>

      <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 ${REVEAL[1]}`}>
        <StatCard icon={Target} label="Điểm ước tính" value={score ?? "—"} hint="/ 990" accent="primary" />
        <StatCard icon={CheckCircle2} label="Độ chính xác" value={`${Math.round(data.overallStats.accuracy * 100)}%`} accent="success" />
        <StatCard icon={ListChecks} label="Đề đã hoàn thành" value={data.overallStats.attemptsCompleted} accent="info" />
        <StatCard icon={Layers} label="Từ vựng đã học" value={data.overallStats.vocabularyLearned} accent="warning" />
        <StatCard icon={Clock3} label="Tổng giờ học" value={formatStudyDuration(data.overallStats.totalStudySeconds)} />
      </div>

      <div className={`grid grid-cols-1 gap-4 lg:grid-cols-2 ${REVEAL[2]}`}>
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <SectionHeader icon={RadarIcon} title="Phân tích kỹ năng" />
          <SkillRadar data={data.partAccuracies} />
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <SectionHeader icon={Layers} title="Từ cần ôn hôm nay" />
          {(data.vocabularyReminder.dueTodayCount > 0 || data.vocabularyReminder.dueTomorrowCount > 0) && (
            <p className="mb-3 rounded-lg bg-accent/50 px-3 py-2 text-xs text-accent-foreground">
              {data.vocabularyReminder.dueTodayCount > 0 && <>Hôm nay bạn có <strong>{data.vocabularyReminder.dueTodayCount}</strong> từ cần ôn tập. </>}
              {data.vocabularyReminder.dueTomorrowCount > 0 && <>Ngày mai bạn còn <strong>{data.vocabularyReminder.dueTomorrowCount}</strong> từ cần ôn.</>}
            </p>
          )}
          <DueWordList words={data.dueVocabulary} />
        </section>
      </div>

      <section className={REVEAL[3]}>
        <SectionHeader icon={PlayCircle} title="Tiếp tục học" />
        {data.continueAttempt ? (
          <ContinueLearningCard
            testTitle={data.continueAttempt.test.title}
            currentQuestionIndex={data.continueAttempt.currentQuestionIndex}
            totalQuestions={data.continueAttempt.test.totalQuestions}
            attemptId={data.continueAttempt.id}
          />
        ) : (
          <EmptyState
            icon={ListChecks}
            title="Chưa có bài làm dở"
            description="Bắt đầu một đề luyện tập để tiếp tục ở đây."
            actionLabel="Xem đề thi"
            actionHref="/practice"
          />
        )}
      </section>

      <section className={REVEAL[4]}>
        <SectionHeader icon={Lightbulb} title="Gợi ý cho bạn" />
        <RecommendationList recommendations={data.recommendations} />
        {data.suggestedTests.length > 0 && (
          <>
            <p className="mb-3 mt-5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <BookOpen className="size-3.5" /> ĐỀ THI GỢI Ý
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.suggestedTests.map((test) => (
                <TestCard
                  key={test.id}
                  title={test.title}
                  difficulty={test.difficulty}
                  totalQuestions={test.totalQuestions}
                  durationMinutes={test.durationMinutes}
                  usersCompleted={test.usersCompleted}
                  bestScore={test.bestScore}
                  href={`/practice/${test.id}`}
                  ctaLabel="Làm đề"
                />
              ))}
            </div>
          </>
        )}
      </section>

      <StudyMascot state={getDashboardMascotState(data.profile)} character="rabbit" />
      <DashboardTour />
    </div>
  );
}
