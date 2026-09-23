import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { AiQuestionGeneratorForm } from "@/components/admin/ai-question-generator-form";

export const metadata: Metadata = { title: "AI tự sinh câu hỏi" };

export default async function AdminAiGenerateQuestionsPage() {
  await requireAdmin();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI tự sinh câu hỏi</h1>
        <p className="mt-1 text-sm text-muted-foreground">Dùng để lấp các mức độ khó còn thiếu trong ngân hàng câu hỏi.</p>
      </div>
      <AiQuestionGeneratorForm />
    </div>
  );
}
