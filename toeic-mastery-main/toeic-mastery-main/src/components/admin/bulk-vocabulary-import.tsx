"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WordListEditor, type WordRow } from "@/components/vocabulary/word-list-editor";
import { bulkCreateVocabularyWordsAction } from "@/lib/actions/admin-vocabulary";

export function BulkVocabularyImport({ topics }: { topics: { id: string; name: string }[] }) {
  const [topicId, setTopicId] = React.useState(topics[0]?.id ?? "");

  async function handleSubmit(rows: WordRow[]) {
    if (!topicId) return { error: "Vui lòng chọn chủ đề" };
    const result = await bulkCreateVocabularyWordsAction(topicId, rows);
    if (result.error) return { error: result.error };
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="max-w-xs">
        <Label className="mb-1.5">Chủ đề</Label>
        <Select value={topicId} onValueChange={setTopicId}>
          <SelectTrigger>
            <SelectValue placeholder="Chọn chủ đề" />
          </SelectTrigger>
          <SelectContent>
            {topics.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <WordListEditor onSubmit={handleSubmit} submitLabel="Thêm vào chủ đề" termLabel="Từ" definitionLabel="Nghĩa tiếng Việt" />
    </div>
  );
}
