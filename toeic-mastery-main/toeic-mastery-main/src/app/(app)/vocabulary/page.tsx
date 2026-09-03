import type { Metadata } from "next";
import Link from "next/link";
import { Star } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getVocabularyOverview, getVocabularyTopics } from "@/lib/data/vocabulary";
import { getVocabularyPathOverview } from "@/lib/data/vocabulary-path";
import { Button } from "@/components/ui/button";
import { VocabularyTabs } from "@/components/vocabulary/vocabulary-tabs";

export const metadata: Metadata = { title: "Từ vựng" };

export default async function VocabularyPage() {
  const profile = await requireUser();
  const [overview, topics, pathOverview] = await Promise.all([
    getVocabularyOverview(profile.id),
    getVocabularyTopics(),
    getVocabularyPathOverview(profile.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Từ vựng</h1>
          <p className="mt-1 text-sm text-muted-foreground">Học và ôn tập từ vựng TOEIC theo lộ trình, theo chủ đề, band điểm và cụm từ cố định.</p>
        </div>
        <Button asChild variant="outline" className="border-primary/40 text-primary hover:bg-primary/10">
          <Link href="/bookmarks">
            <Star className="size-4" /> Từ vựng của tôi
          </Link>
        </Button>
      </div>

      {overview.dueCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-5">
          <div>
            <p className="text-sm font-semibold">Bạn có {overview.dueCount} từ cần ôn hôm nay</p>
            <p className="text-xs text-muted-foreground">Ôn đúng lịch giúp ghi nhớ lâu hơn theo thuật toán lặp lại ngắt quãng.</p>
          </div>
          <Button asChild>
            <Link href="/vocabulary/review">Ôn tập ngay</Link>
          </Button>
        </div>
      )}

      <VocabularyTabs topics={topics} pathOverview={pathOverview} />
    </div>
  );
}
