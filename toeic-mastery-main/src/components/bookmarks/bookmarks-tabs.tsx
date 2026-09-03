"use client";

import * as React from "react";
import Link from "next/link";
import { Bookmark, Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { AddCustomWordsDialog } from "@/components/vocabulary/add-custom-words-dialog";
import { SavedWordsManager } from "@/components/vocabulary/saved-words-manager";
import { PART_META } from "@/lib/constants/toeic";
import { useTourStep } from "@/hooks/use-tour-step";
import { useTourDriver, buildTourStep } from "@/hooks/use-tour-driver";
import { TOUR_IDS } from "@/lib/constants/tour";
import type { getBookmarks } from "@/lib/data/bookmarks";

type Bookmarks = Awaited<ReturnType<typeof getBookmarks>>;

/**
 * Owns both the tab state (moved off `Tabs`'s uncontrolled `defaultValue`
 * so it can be driven programmatically) and the "Đã lưu" onboarding tour —
 * the tour's 3rd step needs to switch to the "vocabulary" tab itself before
 * driver.js can find that tab's elements, which an uncontrolled `<Tabs>` in
 * a Server Component page can't do.
 *
 * Steps 3 ("Học và Chơi") and 5 ("Xuất file") only exist once the learner
 * has saved words — `SavedWordsManager` itself only renders past that
 * point — so with none saved yet the tour quietly trims itself to 3 steps
 * (welcome, tabs, "+ Thêm từ mới") instead of pointing at buttons that
 * aren't there.
 */
export function BookmarksTabs({
  questionBookmarks,
  grammarBookmarks,
  savedWords,
  categories,
}: {
  questionBookmarks: Bookmarks["questionBookmarks"];
  grammarBookmarks: Bookmarks["grammarBookmarks"];
  savedWords: Bookmarks["savedWords"];
  categories: string[];
}) {
  const [activeTab, setActiveTab] = React.useState("questions");
  const hasSavedWords = savedWords.length > 0;

  const { isActive, skip } = useTourStep(TOUR_IDS.BOOKMARKS);
  const { runTour, driverRef } = useTourDriver();

  React.useEffect(() => {
    if (!isActive(0)) return;

    const totalSteps = hasSavedWords ? 5 : 3;

    function finish() {
      skip();
      driverRef.current?.destroy();
    }
    function skipTour() {
      skip();
      driverRef.current?.destroy();
    }

    const steps = [
      buildTourStep({
        title: "👋 Chào mừng đến mục Đã lưu!",
        description:
          "Tất cả câu hỏi, từ vựng và bài học ngữ pháp bạn đã đánh dấu sẽ được tập hợp tại đây để dễ dàng xem lại và ôn tập.",
        nextBtnText: "Tiếp tục",
        onNext: () => driverRef.current?.moveNext(),
        onSkip: skipTour,
      }),
      buildTourStep({
        element: '[data-tour="bookmarks-tabs-list"]',
        title: "📚 Quản lý nội dung đã lưu",
        description:
          "Chọn từng mục để xem nội dung bạn đã lưu. Với Câu hỏi và Ngữ pháp, chỉ cần bấm vào nội dung muốn xem để quay lại bài học tương ứng.",
        nextBtnText: "Tiếp tục",
        side: "bottom",
        align: "start",
        progressText: `Bước 2/${totalSteps}`,
        onNext: () => {
          // TabsContent unmounts when inactive (Radix, no forceMount), so
          // "+ Thêm từ mới"/"Học và Chơi"/"Xuất file" only exist in the DOM
          // once this tab is actually active — switch first, then wait a
          // couple of frames for Radix to mount it before driver.js queries
          // the next step's element.
          setActiveTab("vocabulary");
          requestAnimationFrame(() => {
            requestAnimationFrame(() => driverRef.current?.moveNext());
          });
        },
        onSkip: skipTour,
      }),
      ...(hasSavedWords
        ? [
            buildTourStep({
              element: '[data-tour="bookmarks-play"]',
              title: "🎮 Học & chơi với từ đã lưu",
              description: "Ôn lại các từ đã lưu qua những hoạt động học tập tương tác, giúp ghi nhớ từ vựng dễ dàng và thú vị hơn.",
              nextBtnText: "Tiếp tục",
              side: "bottom",
              align: "start",
              progressText: `Bước 3/${totalSteps}`,
              onNext: () => driverRef.current?.moveNext(),
              onSkip: skipTour,
            }),
          ]
        : []),
      buildTourStep({
        element: '[data-tour="bookmarks-add-word"]',
        title: "✨ Tự tạo kho từ vựng",
        description: "Chủ động thêm những từ vựng của riêng bạn để tạo bộ từ cá nhân và sử dụng chúng để học bằng Flashcard.",
        nextBtnText: hasSavedWords ? "Tiếp tục" : "Xong",
        side: "bottom",
        align: "start",
        progressText: `Bước ${hasSavedWords ? 4 : 3}/${totalSteps}`,
        onNext: hasSavedWords ? () => driverRef.current?.moveNext() : finish,
        onSkip: skipTour,
      }),
      ...(hasSavedWords
        ? [
            buildTourStep({
              element: '[data-tour="bookmarks-export"]',
              title: "📄 Xuất từ vựng ra PDF",
              description: "Xuất danh sách từ đã lưu ra file PDF để in hoặc mang theo học offline bất cứ lúc nào.",
              nextBtnText: "Xong",
              side: "bottom",
              align: "end",
              progressText: `Bước 5/${totalSteps}`,
              onNext: finish,
              onSkip: skipTour,
            }),
          ]
        : []),
    ];

    runTour(steps);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, hasSavedWords]);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList data-tour="bookmarks-tabs-list">
        <TabsTrigger value="questions">Câu hỏi ({questionBookmarks.length})</TabsTrigger>
        <TabsTrigger value="vocabulary">Từ vựng ({savedWords.length})</TabsTrigger>
        <TabsTrigger value="grammar">Ngữ pháp ({grammarBookmarks.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="questions" className="mt-4">
        {questionBookmarks.length === 0 ? (
          <EmptyState icon={Bookmark} title="Chưa lưu câu hỏi nào" actionLabel="Luyện đề" actionHref="/practice" />
        ) : (
          <div className="flex flex-col gap-2">
            {questionBookmarks.map(
              (b) =>
                b.question && (
                  <Link
                    key={b.id}
                    href={b.question.testId ? `/history/${b.question.testId}` : "/bookmarks"}
                    className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm hover:border-primary/40"
                  >
                    <span className="truncate">{b.question.prompt || `Câu hỏi ${PART_META[b.question.part].shortLabel}`}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{PART_META[b.question.part].shortLabel}</span>
                  </Link>
                )
            )}
          </div>
        )}
      </TabsContent>

      <TabsContent value="vocabulary" className="mt-4">
        {savedWords.length === 0 ? (
          <div className="flex flex-col items-center gap-3">
            <EmptyState icon={Star} title="Chưa lưu từ vựng nào" actionLabel="Mở từ điển" actionHref="/dictionary" />
            <AddCustomWordsDialog />
          </div>
        ) : (
          <SavedWordsManager
            words={savedWords.map((w) => ({
              id: w.id,
              word: w.word,
              isFavorite: w.isFavorite,
              category: w.category,
              createdAt: w.createdAt.toISOString(),
            }))}
            categories={categories}
          />
        )}
      </TabsContent>

      <TabsContent value="grammar" className="mt-4">
        {grammarBookmarks.length === 0 ? (
          <EmptyState icon={Bookmark} title="Chưa lưu bài học ngữ pháp nào" actionLabel="Xem ngữ pháp" actionHref="/grammar" />
        ) : (
          <div className="flex flex-col gap-2">
            {grammarBookmarks.map(
              (b) =>
                b.grammarLesson && (
                  <Link
                    key={b.id}
                    href={`/grammar/${b.grammarLesson.topic.slug}`}
                    className="rounded-xl border border-border bg-card px-4 py-3 text-sm hover:border-primary/40"
                  >
                    {b.grammarLesson.title}
                  </Link>
                )
            )}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
