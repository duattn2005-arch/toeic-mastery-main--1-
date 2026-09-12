import type { Metadata } from "next";
import { Fragment } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImportQuestionsDialog } from "@/components/admin/import-questions-dialog";
import { PublishButton } from "@/components/admin/publish-button";
import { AdminQuestionsFilterBar } from "@/components/admin/admin-questions-filter-bar";
import { PART_META } from "@/lib/constants/toeic";
import { TEST_PART_VALUES } from "@/lib/validations/admin";
import { publishQuestionAction } from "@/lib/actions/admin-questions";
import type { ContentStatus, TestPart } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Quản lý câu hỏi" };

const STATUS_VALUES: ContentStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ part?: string; status?: string; testId?: string }>;
}) {
  const params = await searchParams;
  const part = TEST_PART_VALUES.find((p) => p === params.part) as TestPart | undefined;
  const status = STATUS_VALUES.find((s) => s === params.status);
  const testId = params.testId || undefined;
  const filtered = Boolean(part || status || testId);

  const [questions, tests] = await Promise.all([
    db.question.findMany({
      where: {
        ...(part ? { part } : {}),
        ...(status ? { status } : {}),
        ...(testId ? { testId } : {}),
      },
      // Once a specific test is picked, its own question order is far more
      // useful for reviewing/editing structure than recency; otherwise keep
      // showing the newest additions across the whole site first.
      orderBy: testId ? { orderIndex: "asc" } : { createdAt: "desc" },
      take: 200,
      include: { test: { select: { title: true } }, passage: { select: { id: true, title: true } } },
    }),
    db.test.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, title: true }, take: 100 }),
  ]);

  // Clusters consecutive rows sharing the same passage into one group block
  // — a Part 3/4/6/7 group's questions are always contiguous by orderIndex
  // (or creation order), so a single pass is enough; groups never need
  // merging back together across a gap.
  type Row = (typeof questions)[number];
  const blocks: { passage: Row["passage"]; rows: Row[] }[] = [];
  for (const q of questions) {
    const last = blocks[blocks.length - 1];
    if (q.passage && last?.passage?.id === q.passage.id) last.rows.push(q);
    else blocks.push({ passage: q.passage, rows: [q] });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Quản lý câu hỏi</h1>
          <p className="mt-1 text-sm text-muted-foreground">{questions.length} câu hỏi{filtered ? " khớp bộ lọc" : " gần đây"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ImportQuestionsDialog testOptions={tests} />
          <Button asChild variant="outline">
            <Link href="/admin/questions/groups/new">
              <Plus className="size-4" /> Nhóm câu hỏi
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/questions/new">
              <Plus className="size-4" /> Thêm câu hỏi
            </Link>
          </Button>
        </div>
      </div>

      <AdminQuestionsFilterBar tests={tests} />

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Câu hỏi</th>
              <th className="px-4 py-3 font-medium">Part</th>
              <th className="px-4 py-3 font-medium">Đề thi</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {blocks.map((block) =>
              block.passage ? (
                <Fragment key={block.passage.id}>
                  <tr className="border-b border-border bg-muted/40">
                    <td colSpan={4} className="px-4 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Nhóm · {PART_META[block.rows[0].part].shortLabel} · {block.rows.length} câu
                          {block.passage.title ? ` — ${block.passage.title}` : ""}
                        </span>
                        <Link href={`/admin/questions/groups/${block.passage.id}/edit`} className="text-xs font-medium text-primary hover:underline">
                          Sửa cả nhóm →
                        </Link>
                      </div>
                    </td>
                  </tr>
                  {block.rows.map((q) => (
                    <tr key={q.id} className="border-b border-border bg-muted/10 last:border-0 hover:bg-accent/30">
                      <td className="max-w-md truncate px-4 py-2.5 pl-8">
                        <Link href={`/admin/questions/${q.id}`} className="hover:text-primary">
                          {q.prompt || "(câu hỏi nghe, không có văn bản)"}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{PART_META[q.part].shortLabel}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{q.test?.title ?? "—"}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <Badge variant={q.status === "PUBLISHED" ? "default" : "secondary"}>{q.status}</Badge>
                          {q.status !== "PUBLISHED" && (
                            <PublishButton action={publishQuestionAction.bind(null, q.id)} successMessage="Đã xuất bản câu hỏi" />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ) : (
                block.rows.map((q) => (
                  <tr key={q.id} className="border-b border-border last:border-0 hover:bg-accent/30">
                    <td className="max-w-md truncate px-4 py-3">
                      <Link href={`/admin/questions/${q.id}`} className="hover:text-primary">
                        {q.prompt || "(câu hỏi nghe, không có văn bản)"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{PART_META[q.part].shortLabel}</td>
                    <td className="px-4 py-3 text-muted-foreground">{q.test?.title ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={q.status === "PUBLISHED" ? "default" : "secondary"}>{q.status}</Badge>
                        {q.status !== "PUBLISHED" && (
                          <PublishButton action={publishQuestionAction.bind(null, q.id)} successMessage="Đã xuất bản câu hỏi" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
