import type { Metadata } from "next";
import Link from "next/link";
import { History as HistoryIcon } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { HistoryTour } from "@/components/history/history-tour";

export const metadata: Metadata = { title: "Lịch sử làm bài" };

export default async function HistoryPage() {
  const profile = await requireUser();

  const attempts = await db.attempt.findMany({
    where: { userId: profile.id, status: "SUBMITTED" },
    orderBy: { submittedAt: "desc" },
    include: { test: { select: { title: true } } },
    take: 50,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Lịch sử làm bài</h1>
        <p className="mt-1 text-sm text-muted-foreground">Xem lại các đề đã hoàn thành và điểm số theo thời gian.</p>
      </div>

      {attempts.length === 0 ? (
        <EmptyState
          icon={HistoryIcon}
          title="Chưa có bài làm nào"
          description="Hoàn thành một đề luyện tập để xem lịch sử tại đây."
          actionLabel="Luyện đề ngay"
          actionHref="/practice"
        />
      ) : (
        <div data-tour="history-list-items" className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card shadow-soft">
          {attempts.map((attempt) => (
            <Link
              key={attempt.id}
              href={`/history/${attempt.id}`}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-accent/40"
            >
              <div>
                <p className="text-sm font-medium">{attempt.test.title}</p>
                <p className="text-xs text-muted-foreground">
                  {attempt.submittedAt?.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })} ·{" "}
                  {attempt.mode === "EXAM" ? "Thi thử" : "Luyện tập"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {attempt.totalScore !== null && <Badge variant="secondary">{attempt.totalScore} / 990</Badge>}
                <span className="text-xs text-muted-foreground">
                  {attempt.correctCount}/{(attempt.correctCount ?? 0) + (attempt.wrongCount ?? 0) + (attempt.skippedCount ?? 0)} đúng
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <HistoryTour />
    </div>
  );
}
