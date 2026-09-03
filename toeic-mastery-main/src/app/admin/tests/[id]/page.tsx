import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { TestForm } from "@/components/admin/test-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteTestAction } from "@/lib/actions/admin-tests";
import { PART_META } from "@/lib/constants/toeic";

export const metadata: Metadata = { title: "Chỉnh sửa đề thi" };

export default async function EditTestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const test = await db.test.findUnique({
    where: { id },
    include: { questions: { orderBy: [{ part: "asc" }, { orderIndex: "asc" }], select: { id: true, part: true, prompt: true, status: true } } },
  });
  if (!test) notFound();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{test.title}</h1>
        <DeleteButton
          label="Xóa đề thi"
          description="Toàn bộ câu hỏi liên kết trực tiếp và lịch sử làm bài sẽ bị xóa. Không thể hoàn tác."
          action={deleteTestAction.bind(null, test.id)}
          redirectTo="/admin/tests"
        />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <TestForm
          testId={test.id}
          defaultValues={{
            title: test.title,
            slug: test.slug,
            description: test.description ?? "",
            thumbnailUrl: test.thumbnailUrl ?? "",
            difficulty: test.difficulty,
            status: test.status,
            isFullTest: test.isFullTest,
            durationMinutes: test.durationMinutes,
            listeningQuestions: test.listeningQuestions,
            readingQuestions: test.readingQuestions,
            allowReplay: test.allowReplay,
          }}
        />
      </div>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">CÂU HỎI TRONG ĐỀ ({test.questions.length})</h2>
          <Link href={`/admin/questions/new?testId=${test.id}`} className="text-sm font-medium text-primary hover:underline">
            + Thêm câu hỏi
          </Link>
        </div>
        {test.questions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có câu hỏi nào. Tạo câu hỏi mới và gán vào đề thi này.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {test.questions.map((q) => (
              <Link key={q.id} href={`/admin/questions/${q.id}`} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-primary">
                <span className="flex items-center gap-2">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {PART_META[q.part].shortLabel}
                  </span>
                  <span className="truncate">{q.prompt || "(không có văn bản — câu hỏi nghe)"}</span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{q.status}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
