"use client";

import { QuestionCardListEditor } from "@/components/admin/question-card-list-editor";

export function QuestionAddPanel({
  testOptions,
  defaultTestId,
}: {
  testOptions: { id: string; title: string }[];
  defaultTestId?: string;
}) {
  return <QuestionCardListEditor testOptions={testOptions} defaultTestId={defaultTestId} />;
}
