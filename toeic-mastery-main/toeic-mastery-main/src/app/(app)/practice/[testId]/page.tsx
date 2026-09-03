import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Crown, ListChecks, Trophy, Users } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DIFFICULTY_LABEL_VI, PART_META } from "@/lib/constants/toeic";
import { startAttemptAction } from "@/lib/actions/attempts";

export async function generateMetadata({ params }: { params: Promise<{ testId: string }> }): Promise<Metadata> {
  const { testId } = await params;
  const test = await db.test.findUnique({ where: { id: testId }, select: { title: true } });
  return { title: test?.title ?? "Đề thi" };
}

export default async function TestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ testId: string }>;
  searchParams: Promise<{ limitReached?: string }>;
}) {
  const { testId } = await params;
  const { limitReached } = await searchParams;
  const profile = await requireUser();

  const test = await db.test.findUnique({
    where: { id: testId },
    include: {
      sections: { orderBy: { orderIndex: "asc" } },
      _count: { select: { attempts: true } },
    },
  });
  if (!test || test.status !== "PUBLISHED") notFound();

  const [pastAttempts, activeAttempt] = await Promise.all([
    db.attempt.findMany({
      where: { userId: profile.id, testId, status: "SUBMITTED" },
      orderBy: { submittedAt: "desc" },
      take: 5,
    }),
    db.attempt.findFirst({ where: { userId: profile.id, testId, status: "IN_PROGRESS" } }),
  ]);

  const bestScore = pastAttempts.reduce((max, a) => Math.max(max, a.totalScore ?? 0), 0) || null;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="secondary">{DIFFICULTY_LABEL_VI[test.difficulty]}</Badge>
              {test.isFullTest && <Badge variant="outline">Full Test</Badge>}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{test.title}</h1>
            {test.description && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{test.description}</p>}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <ListChecks className="size-4" /> {test.totalQuestions} câu hỏi
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-4" /> {test.durationMinutes} phút
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="size-4" /> {test._count.attempts} lượt làm
          </span>
          {bestScore !== null && (
            <span className="flex items-center gap-1.5">
              <Trophy className="size-4" /> Điểm cao nhất của bạn: {bestScore}
            </span>
          )}
        </div>

        {limitReached && (
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3.5 text-sm">
            <Crown className="size-5 shrink-0 text-primary" />
            <p className="flex-1">Bạn đã dùng hết lượt làm {test.isFullTest ? "Full Mock Test" : "Mini Test"} miễn phí hôm nay.</p>
            <Button asChild size="sm">
              <Link href="/pricing">Nâng cấp Pro</Link>
            </Button>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {activeAttempt ? (
            <Button size="lg" asChild>
              <Link href={`/exam/${activeAttempt.id}`}>Tiếp tục bài làm dở</Link>
            </Button>
          ) : (
            <>
              <form action={startAttemptAction.bind(null, test.id, "EXAM")}>
                <Button size="lg" type="submit">
                  Bắt đầu thi (chế độ Thi thử)
                </Button>
              </form>
              <form action={startAttemptAction.bind(null, test.id, "PRACTICE")}>
                <Button size="lg" variant="outline" type="submit">
                  Luyện tập (xem đáp án ngay)
                </Button>
              </form>
            </>
          )}
        </div>
      </div>

      {test.sections.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="mb-4 text-sm font-semibold text-muted-foreground">CẤU TRÚC ĐỀ THI</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {test.sections.map((section) => (
              <div key={section.id} className="rounded-xl border border-border p-3.5">
                <p className="text-xs font-medium text-muted-foreground">{PART_META[section.part].shortLabel}</p>
                <p className="mt-1 text-sm font-semibold">{section.questionCount} câu</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {pastAttempts.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="mb-4 text-sm font-semibold text-muted-foreground">LỊCH SỬ LÀM BÀI</h2>
          <div className="flex flex-col divide-y divide-border">
            {pastAttempts.map((attempt) => (
              <Link
                key={attempt.id}
                href={`/history/${attempt.id}`}
                className="flex items-center justify-between py-3 text-sm hover:text-primary"
              >
                <span className="text-muted-foreground">
                  {attempt.submittedAt?.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                </span>
                <span className="font-medium">{attempt.totalScore ?? "—"} điểm</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
