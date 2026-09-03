import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImportQuestionsDialog } from "@/components/admin/import-questions-dialog";
import { PublishButton } from "@/components/admin/publish-button";
import { PART_META } from "@/lib/constants/toeic";
import { TEST_PART_VALUES } from "@/lib/validations/admin";
import { publishQuestionAction } from "@/lib/actions/admin-questions";
import type { ContentStatus, TestPart } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Quản lý câu hỏi" };

const STATUS_VALUES: ContentStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ part?: string; status?: string }>;
}) {
  const params = await searchParams;
  const part = TEST_PART_VALUES.find((p) => p === params.part) as TestPart | undefined;
  const status = STATUS_VALUES.find((s) => s === params.status);

  const [questions, tests] = await Promise.all([
    db.question.findMany({
      where: {
        ...(part ? { part } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { test: { select: { title: true } } },
    }),
    db.test.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, title: true }, take: 50 }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Quản lý câu hỏi</h1>
          <p className="mt-1 text-sm text-muted-foreground">{questions.length} câu hỏi gần đây</p>
        </div>
        <div className="flex gap-2">
          <ImportQuestionsDialog testOptions={tests} />
          <Button asChild>
            <Link href="/admin/questions/new">
              <Plus className="size-4" /> Thêm câu hỏi
            </Link>
          </Button>
        </div>
      </div>

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
            {questions.map((q) => (
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
