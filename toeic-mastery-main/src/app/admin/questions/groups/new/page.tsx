import type { Metadata } from "next";
import { db } from "@/lib/db";
import { QuestionGroupWorkspace } from "@/components/admin/question-group-workspace";

export const metadata: Metadata = { title: "Tạo nhóm câu hỏi" };

export default async function NewQuestionGroupPage() {
  const tests = await db.test.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, title: true }, take: 50 });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tạo nhóm câu hỏi</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dành cho Part 3/4/6/7 — nhiều câu hỏi dùng chung 1 audio hoặc bài đọc. Nhập đề chung ở cột trái, thêm các câu hỏi ở cột phải, lưu một lần.
        </p>
      </div>
      <QuestionGroupWorkspace testOptions={tests} />
    </div>
  );
}
