import type { Metadata } from "next";
import { db } from "@/lib/db";
import { QuestionAddPanel } from "@/components/admin/question-add-panel";

export const metadata: Metadata = { title: "Thêm câu hỏi" };

export default async function NewQuestionPage({ searchParams }: { searchParams: Promise<{ testId?: string }> }) {
  const { testId } = await searchParams;
  const tests = await db.test.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, title: true }, take: 50 });

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Thêm câu hỏi mới</h1>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <QuestionAddPanel
          testOptions={tests}
          defaultValues={{
            testId: testId ?? "",
            part: "PART5",
            prompt: "",
            imageUrl: "",
            audioUrl: "",
            transcript: "",
            correctLabel: "A",
            explanationVi: "",
            grammarTopicSlug: "",
            vocabularyFocus: "",
            evidenceText: "",
            difficulty: "MEDIUM",
            status: "PUBLISHED",
            options: [
              { label: "A", content: "" },
              { label: "B", content: "" },
              { label: "C", content: "" },
              { label: "D", content: "" },
            ],
          }}
        />
      </div>
    </div>
  );
}
