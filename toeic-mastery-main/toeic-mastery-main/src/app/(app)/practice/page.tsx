import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ClipboardList, ListX } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { getTestList, type TestListFilters } from "@/lib/data/tests";
import { getMistakeCount } from "@/lib/data/mistakes";
import { PracticeFilters } from "@/components/practice/practice-filters";
import { TestCard } from "@/components/practice/test-card";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Luyện đề" };

const VALID_CATEGORIES = new Set(["ALL", "FULL", "LISTENING", "READING", "PART1", "PART2", "PART3", "PART4", "PART5", "PART6", "PART7"]);

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const profile = await requireUser();
  const params = await searchParams;

  const rawCategory = typeof params.category === "string" ? params.category : "ALL";
  const filters: TestListFilters = {
    category: VALID_CATEGORIES.has(rawCategory) ? (rawCategory as TestListFilters["category"]) : "ALL",
    difficulty: (typeof params.difficulty === "string" ? params.difficulty : undefined) as TestListFilters["difficulty"],
    completion: (typeof params.completion === "string" ? params.completion : "ALL") as TestListFilters["completion"],
    sort: (typeof params.sort === "string" ? params.sort : "NEWEST") as TestListFilters["sort"],
  };

  const [tests, mistakeCount] = await Promise.all([getTestList(profile.id, filters), getMistakeCount(profile.id)]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Luyện đề</h1>
        <p className="mt-1 text-sm text-muted-foreground">Chọn đề thi phù hợp với mục tiêu của bạn.</p>
      </div>

      {mistakeCount > 0 && (
        <Link
          href="/practice/mistakes"
          className="flex items-center justify-between rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-4 transition-colors hover:bg-destructive/10"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <ListX className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">Ngân hàng lỗi sai</p>
              <p className="text-xs text-muted-foreground">Bạn có {mistakeCount} câu làm sai gần nhất — luyện lại ngay.</p>
            </div>
          </div>
          <span className="text-sm font-medium text-destructive">Luyện ngay →</span>
        </Link>
      )}

      <Suspense>
        <PracticeFilters />
      </Suspense>

      {tests.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Không tìm thấy đề thi phù hợp" description="Hãy thử thay đổi bộ lọc." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tests.map((test) => (
            <TestCard
              key={test.id}
              title={test.title}
              difficulty={test.difficulty}
              totalQuestions={test.totalQuestions}
              durationMinutes={test.durationMinutes}
              usersCompleted={test.usersCompleted}
              bestScore={test.bestScore}
              progressPercent={test.progressPercent}
              href={test.resumeAttemptId ? `/exam/${test.resumeAttemptId}` : `/practice/${test.id}`}
              ctaLabel={test.resumeAttemptId ? "Tiếp tục" : test.isCompleted ? "Làm lại" : "Bắt đầu"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
