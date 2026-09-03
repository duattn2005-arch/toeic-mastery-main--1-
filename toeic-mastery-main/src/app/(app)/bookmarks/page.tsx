import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getBookmarks } from "@/lib/data/bookmarks";
import { BookmarksTabs } from "@/components/bookmarks/bookmarks-tabs";

export const metadata: Metadata = { title: "Đã lưu" };

export default async function BookmarksPage() {
  const profile = await requireUser();
  const { questionBookmarks, grammarBookmarks, savedWords } = await getBookmarks(profile.id);
  const categories = [...new Set(savedWords.map((w) => w.category).filter((c): c is string => !!c))].sort();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Đã lưu</h1>
        <p className="mt-1 text-sm text-muted-foreground">Câu hỏi, từ vựng và bài học ngữ pháp bạn đã đánh dấu.</p>
      </div>

      <BookmarksTabs
        questionBookmarks={questionBookmarks}
        grammarBookmarks={grammarBookmarks}
        savedWords={savedWords}
        categories={categories}
      />
    </div>
  );
}
