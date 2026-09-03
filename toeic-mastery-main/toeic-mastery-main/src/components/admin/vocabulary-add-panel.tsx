"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { VocabularyWordForm } from "@/components/admin/vocabulary-word-form";
import { BulkVocabularyImport } from "@/components/admin/bulk-vocabulary-import";

export function VocabularyAddPanel({ topics }: { topics: { id: string; name: string }[] }) {
  const [mode, setMode] = React.useState<"single" | "bulk">("single");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Button type="button" variant={mode === "single" ? "default" : "outline"} size="sm" onClick={() => setMode("single")}>
          Thêm 1 từ chi tiết
        </Button>
        <Button type="button" variant={mode === "bulk" ? "default" : "outline"} size="sm" onClick={() => setMode("bulk")}>
          Thêm hàng loạt (Quizlet-style)
        </Button>
      </div>
      {mode === "single" ? <VocabularyWordForm topics={topics} /> : <BulkVocabularyImport topics={topics} />}
    </div>
  );
}
