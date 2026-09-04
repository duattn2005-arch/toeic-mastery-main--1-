import Link from "next/link";
import { BookOpenCheck } from "lucide-react";
import { TestCard } from "@/components/practice/test-card";
import { PartPracticeHero } from "@/components/skills/part-practice-hero";
import { EmptyState } from "@/components/shared/empty-state";
import { PART_META } from "@/lib/constants/toeic";
import type { TestPart } from "@/generated/prisma/enums";
import { getPartTests } from "@/lib/data/skill-hub";
import { db } from "@/lib/db";

function practicePoolSlug(part: TestPart): string {
  return `practice-pool-${part.toLowerCase()}`;
}

const PART_TIPS: Record<TestPart, string[]> = {
  PART1: ["Chú ý động từ mô tả hành động, không chỉ danh từ trong ảnh.", "Cẩn thận với các từ đồng âm dễ gây nhiễu."],
  PART2: ["Tập trung vào từ để hỏi đầu câu (Who/What/When/Where/Why/How).", "Câu trả lời gián tiếp thường là đáp án đúng."],
  PART3: ["Đọc trước câu hỏi khi có thể để biết cần nghe thông tin gì.", "Chú ý thái độ, ý định của người nói (inference)."],
  PART4: ["Xác định loại bài nói (thông báo, quảng cáo, hướng dẫn...) ngay từ đầu.", "Nắm ý chính trước, chi tiết sau."],
  PART5: ["Xác định loại từ cần điền: danh từ, động từ, tính từ hay trạng từ.", "Chú ý các collocation cố định (by + thời điểm, in charge of...)."],
  PART6: ["Đọc toàn đoạn trước khi chọn đáp án để hiểu mạch văn.", "Câu điền cả câu cần dựa vào ngữ cảnh câu trước/sau."],
  PART7: ["Đọc câu hỏi trước để biết cần tìm thông tin gì trong bài.", "Với bài đôi/ba đoạn, chú ý câu hỏi yêu cầu liên kết thông tin."],
};

export async function PartDetailView({ part, userId }: { part: TestPart; userId: string }) {
  const meta = PART_META[part];
  const basePath = meta.skill === "LISTENING" ? "listening" : "reading";

  const [tests, attempts] = await Promise.all([
    getPartTests(part),
    db.attempt.findMany({
      where: { userId, status: "SUBMITTED", test: { sections: { some: { part } } } },
      select: { id: true, testId: true, totalScore: true },
    }),
  ]);

  const attemptsByTest = new Map<string, { count: number; best: number | null }>();
  for (const a of attempts) {
    const entry = attemptsByTest.get(a.testId) ?? { count: 0, best: null };
    entry.count += 1;
    if (a.totalScore !== null) entry.best = Math.max(entry.best ?? 0, a.totalScore);
    attemptsByTest.set(a.testId, entry);
  }

  // The part's own practice pool (see src/lib/services/practice-pool.ts) is
  // the primary, dedicated content for this page — every other Test that
  // merely happens to include this part (e.g. a full mock test) is only a
  // secondary suggestion, not something to feature at equal weight.
  const poolSlug = practicePoolSlug(part);
  const poolTest = tests.find((t) => t.slug === poolSlug && t.totalQuestions > 0);
  const suggestedTests = tests.filter((t) => t.id !== poolTest?.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium text-primary">
          <Link href={`/${basePath}`} className="hover:underline">
            {meta.skill === "LISTENING" ? "Listening" : "Reading"}
          </Link>{" "}
          / {meta.shortLabel}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{meta.label}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{meta.questionCount} câu trong đề đầy đủ.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h2 className="mb-2.5 text-sm font-semibold text-muted-foreground">MẸO LÀM BÀI</h2>
        <ul className="flex flex-col gap-1.5 text-sm text-foreground/90">
          {PART_TIPS[part].map((tip) => (
            <li key={tip} className="flex items-start gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {poolTest ? (
        <PartPracticeHero
          partLabel={meta.label}
          totalQuestions={poolTest.totalQuestions}
          durationMinutes={poolTest.durationMinutes}
          usersCompleted={poolTest._count.attempts}
          bestScore={attemptsByTest.get(poolTest.id)?.best ?? null}
          href={`/practice/${poolTest.id}`}
          ctaLabel={attemptsByTest.has(poolTest.id) ? "Làm lại" : "Bắt đầu"}
        />
      ) : (
        suggestedTests.length === 0 && (
          <EmptyState
            icon={BookOpenCheck}
            title="Chưa có đề luyện tập riêng cho Part này"
            description="Hãy thử làm Full Test để luyện tất cả các Part."
            actionLabel="Xem Full Test"
            actionHref="/practice?category=FULL"
          />
        )
      )}

      {suggestedTests.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            {poolTest ? "GỢI Ý THÊM CHO BẠN" : `ĐỀ LUYỆN TẬP ${meta.shortLabel.toUpperCase()}`}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {suggestedTests.map((test) => {
              const stats = attemptsByTest.get(test.id);
              return (
                <TestCard
                  key={test.id}
                  title={test.title}
                  difficulty={test.difficulty}
                  totalQuestions={test.totalQuestions}
                  durationMinutes={test.durationMinutes}
                  usersCompleted={test._count.attempts}
                  bestScore={stats?.best ?? null}
                  href={`/practice/${test.id}`}
                  ctaLabel={stats ? "Làm lại" : "Bắt đầu"}
                />
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
