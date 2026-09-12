"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { QuestionCardListEditor } from "@/components/admin/question-card-list-editor";

export function QuestionAddPanel({
  testOptions,
  defaultTestId,
}: {
  testOptions: { id: string; title: string }[];
  defaultTestId?: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button asChild variant="ghost" size="sm" className="text-primary">
          <Link href="/admin/questions/groups/new">+ Tạo nhóm câu hỏi (Part 3/4/6/7) →</Link>
        </Button>
      </div>
      <QuestionCardListEditor testOptions={testOptions} defaultTestId={defaultTestId} />
    </div>
  );
}
