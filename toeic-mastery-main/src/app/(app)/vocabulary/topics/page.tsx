import type { Metadata } from "next";
import { getVocabularyTopics } from "@/lib/data/vocabulary";
import { TopicSectionGrid } from "@/components/vocabulary/topic-section-grid";

export const metadata: Metadata = { title: "Chủ đề từ vựng" };

export default async function VocabularyTopicsPage() {
  const topics = await getVocabularyTopics();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Chủ đề từ vựng</h1>
        <p className="mt-1 text-sm text-muted-foreground">Từ vựng TOEIC theo bối cảnh thực tế, theo band điểm, theo từng Part và các cụm từ cố định.</p>
      </div>

      <TopicSectionGrid topics={topics} />
    </div>
  );
}
