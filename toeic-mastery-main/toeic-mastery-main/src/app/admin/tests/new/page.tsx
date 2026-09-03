import type { Metadata } from "next";
import { TestForm } from "@/components/admin/test-form";

export const metadata: Metadata = { title: "Tạo đề thi" };

export default function NewTestPage() {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Tạo đề thi mới</h1>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <TestForm
          defaultValues={{
            title: "",
            slug: "",
            description: "",
            thumbnailUrl: "",
            difficulty: "MEDIUM",
            status: "DRAFT",
            isFullTest: true,
            durationMinutes: 120,
            listeningQuestions: 100,
            readingQuestions: 100,
            allowReplay: false,
          }}
        />
      </div>
    </div>
  );
}
