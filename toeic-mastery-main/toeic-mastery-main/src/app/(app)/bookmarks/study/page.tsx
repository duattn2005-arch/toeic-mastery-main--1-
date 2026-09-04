import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getSavedWordStudyItems } from "@/lib/data/bookmarks";
import { StudyGameLauncher } from "@/components/study-game/study-game-launcher";

export const metadata: Metadata = { title: "Học & Chơi — Từ đã lưu" };

export default async function SavedWordsStudyPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; words?: string }>;
}) {
  const profile = await requireUser();
  const { category, words } = await searchParams;

  const wordIds = words ? words.split(",").filter(Boolean) : undefined;
  const items = await getSavedWordStudyItems(profile.id, {
    wordIds,
    ...(wordIds ? {} : category !== undefined ? { category: category === "none" ? null : category } : {}),
  });

  const title = wordIds
    ? `Từ đã lưu (${wordIds.length} từ đã chọn)`
    : category === "none"
      ? "Từ đã lưu — Chưa phân loại"
      : category
        ? `Từ đã lưu — ${category}`
        : "Từ đã lưu";

  return <StudyGameLauncher items={items} title={title} backHref="/bookmarks" backLabel="Quay lại Đã lưu" />;
}
