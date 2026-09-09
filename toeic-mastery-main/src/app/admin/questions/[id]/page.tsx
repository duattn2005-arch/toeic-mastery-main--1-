import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { QuestionForm } from "@/components/admin/question-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteQuestionAction } from "@/lib/actions/admin-questions";

export const metadata: Metadata = { title: "Chỉnh sửa câu hỏi" };

export default async function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [question, tests] = await Promise.all([
    db.question.findUnique({ where: { id }, include: { options: { orderBy: { label: "asc" } } } }),
    db.test.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, title: true }, take: 50 }),
  ]);
  if (!question) notFound();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Chỉnh sửa câu hỏi</h1>
        <DeleteButton
          label="Xóa câu hỏi"
          description="Câu hỏi và toàn bộ lựa chọn liên quan sẽ bị xóa vĩnh viễn."
          action={deleteQuestionAction.bind(null, question.id)}
          redirectTo="/admin/questions"
        />
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <QuestionForm
          questionId={question.id}
          testOptions={tests}
          defaultValues={{
            testId: question.testId ?? "",
            part: question.part,
            prompt: question.prompt,
            imageUrl: question.imageUrl ?? "",
            audioUrl: question.audioUrl ?? "",
            transcript: question.transcript ?? "",
            correctLabel: question.correctLabel as "A" | "B" | "C" | "D",
            explanationVi: question.explanationVi,
            grammarTopicSlug: question.grammarTopicSlug ?? "",
            vocabularyFocus: question.vocabularyFocus.join(", "),
            evidenceText: question.evidenceText ?? "",
            difficulty: question.difficulty,
            status: question.status,
            options: question.options.map((o) => ({
              label: o.label as "A" | "B" | "C" | "D",
              content: o.content,
              distractorExplanation: o.distractorExplanation ?? "",
            })),
          }}
        />
      </div>
    </div>
  );
}
