import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { TestForm } from "@/components/admin/test-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { TestQuestionsFilterBar } from "@/components/admin/test-questions-filter-bar";
import { deleteTestAction } from "@/lib/actions/admin-tests";
import { deleteQuestionAction } from "@/lib/actions/admin-questions";
import { clusterQuestionsByPassage } from "@/lib/services/question-grouping";
import { PART_META } from "@/lib/constants/toeic";
import { TEST_PART_VALUES } from "@/lib/validations/admin";
import type { ContentStatus, TestPart } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Chỉnh sửa đề thi" };

const STATUS_VALUES: ContentStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

export default async function EditTestPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ part?: string; status?: string }>;
}) {
  const { id } = await params;
  const { part: partParam, status: statusParam } = await searchParams;
  const part = TEST_PART_VALUES.find((p) => p === partParam) as TestPart | undefined;
  const status = STATUS_VALUES.find((s) => s === statusParam);

  const [test, allQuestionsCount] = await Promise.all([
    db.test.findUnique({
      where: { id },
      include: {
        questions: {
          where: { ...(part ? { part } : {}), ...(status ? { status } : {}) },
          orderBy: [{ part: "asc" }, { orderIndex: "asc" }],
          select: { id: true, part: true, prompt: true, status: true, passage: { select: { id: true, title: true } } },
        },
      },
    }),
    db.question.count({ where: { testId: id } }),
  ]);
  if (!test) notFound();

  const blocks = clusterQuestionsByPassage(test.questions);
  const filtered = Boolean(part || status);

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
            isPro: test.isPro,
            durationMinutes: test.durationMinutes,
            listeningQuestions: test.listeningQuestions,
            readingQuestions: test.readingQuestions,
            allowReplay: test.allowReplay,
          }}
        />
      </div>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            CÂU HỎI TRONG ĐỀ ({filtered ? `${test.questions.length}/${allQuestionsCount}` : allQuestionsCount})
          </h2>
          <Link href={`/admin/questions/new?testId=${test.id}`} className="text-sm font-medium text-primary hover:underline">
            + Thêm câu hỏi
          </Link>
        </div>

        <div className="mb-3">
          <TestQuestionsFilterBar />
        </div>

        {test.questions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {allQuestionsCount === 0 ? "Chưa có câu hỏi nào. Tạo câu hỏi mới và gán vào đề thi này." : "Không có câu hỏi nào khớp bộ lọc."}
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {blocks.map((block) =>
              block.passage ? (
                <Fragment key={block.passage.id}>
                  <div className="flex items-center justify-between gap-3 bg-muted/40 px-1 py-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Nhóm · {PART_META[block.rows[0].part].shortLabel} · {block.rows.length} câu
                      {block.passage.title ? ` — ${block.passage.title}` : ""}
                    </span>
                    <Link href={`/admin/questions/groups/${block.passage.id}/edit`} className="text-xs font-medium text-primary hover:underline">
                      Sửa cả nhóm →
                    </Link>
                  </div>
                  {block.rows.map((q) => (
                    <QuestionRow key={q.id} question={q} indent />
                  ))}
                </Fragment>
              ) : (
                block.rows.map((q) => <QuestionRow key={q.id} question={q} />)
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function QuestionRow({
  question: q,
  indent = false,
}: {
  question: { id: string; prompt: string; part: TestPart; status: ContentStatus };
  indent?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-3 py-2.5 text-sm ${indent ? "pl-4" : ""}`}>
      <Link href={`/admin/questions/${q.id}`} className="flex min-w-0 flex-1 items-center gap-2 hover:text-primary">
        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{PART_META[q.part].shortLabel}</span>
        <span className="truncate">{q.prompt || "(không có văn bản — câu hỏi nghe)"}</span>
      </Link>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-xs text-muted-foreground">{q.status}</span>
        <DeleteButton
          label="Xóa"
          description="Câu hỏi này (và các lựa chọn, dấu trang, báo lỗi liên quan) sẽ bị xóa vĩnh viễn. Không thể hoàn tác."
          action={deleteQuestionAction.bind(null, q.id)}
        />
      </div>
    </div>
  );
}
