"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { QuestionForm } from "@/components/admin/question-form";
import { AzotaQuickPasteImporter } from "@/components/admin/azota-quick-paste-importer";
import type { QuestionFormInput } from "@/lib/validations/admin";

export function QuestionAddPanel({
  testOptions,
  defaultValues,
}: {
  testOptions: { id: string; title: string }[];
  defaultValues: QuestionFormInput;
}) {
  const [mode, setMode] = React.useState<"single" | "paste">("single");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Button type="button" variant={mode === "single" ? "default" : "outline"} size="sm" onClick={() => setMode("single")}>
          Thêm 1 câu chi tiết
        </Button>
        <Button type="button" variant={mode === "paste" ? "default" : "outline"} size="sm" onClick={() => setMode("paste")}>
          Dán nhanh nhiều câu (Part 5-7)
        </Button>
      </div>
      {mode === "single" ? (
        <QuestionForm testOptions={testOptions} defaultValues={defaultValues} />
      ) : (
        <AzotaQuickPasteImporter defaultPart="PART5" defaultTestId={defaultValues.testId} testOptions={testOptions} />
      )}
    </div>
  );
}
