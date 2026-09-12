import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { QuestionGroupForm } from "@/components/admin/question-group-form";
import type { QuestionGroupFormInput } from "@/lib/validations/admin";
import { OPTION_LABEL_VALUES } from "@/lib/validations/admin";

export const metadata: Metadata = { title: "Sửa nhóm câu hỏi" };

export default async function EditQuestionGroupPage({ params }: { params: Promise<{ passageId: string }> }) {
  const { passageId } = await params;

  const [passage, tests] = await Promise.all([
    db.passage.findUnique({
      where: { id: passageId },
      include: { questions: { orderBy: { orderIndex: "asc" }, include: { options: { orderBy: { label: "asc" } } } } },
    }),
    db.test.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, title: true }, take: 50 }),
  ]);
  if (!passage || passage.questions.length === 0) notFound();

  // difficulty/status live per-Question, not on Passage itself, but the form
  // treats them as one shared value for the whole group (same as create) —
  // the first question's values stand in for "the group's" here.
  const first = passage.questions[0];

  const initialValues: QuestionGroupFormInput = {
    testId: passage.testId ?? "",
    part: passage.part as QuestionGroupFormInput["part"],
    format: passage.format,
    layout: passage.layout,
    title: passage.title ?? "",
    audioUrl: passage.audioUrl ?? "",
    imageUrl: passage.imageUrl ?? "",
    transcript: passage.transcript ?? "",
    texts: (passage.texts as { label: string; content: string }[] | null) ?? [],
    difficulty: first.difficulty,
    status: first.status,
    questions: passage.questions.map((q) => ({
      prompt: q.prompt,
      correctLabel: q.correctLabel as (typeof OPTION_LABEL_VALUES)[number],
      explanationVi: q.explanationVi,
      grammarTopicSlug: q.grammarTopicSlug ?? "",
      vocabularyFocus: q.vocabularyFocus.join(", "),
      evidenceText: q.evidenceText ?? "",
      options: q.options.map((o) => ({
        label: o.label as (typeof OPTION_LABEL_VALUES)[number],
        content: o.content,
        distractorExplanation: o.distractorExplanation ?? "",
      })),
    })),
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/questions" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-3.5" /> Về danh sách câu hỏi
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Sửa nhóm câu hỏi</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Part và đề thi không thể đổi ở đây — tạo nhóm mới nếu cần chuyển nhóm này sang Part hoặc đề khác.
        </p>
      </div>
      <QuestionGroupForm testOptions={tests} initialValues={initialValues} initialPassageId={passage.id} />
    </div>
  );
}
