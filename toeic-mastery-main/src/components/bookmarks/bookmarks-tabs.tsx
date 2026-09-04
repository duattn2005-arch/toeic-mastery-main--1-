"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { AddCustomWordsDialog } from "@/components/vocabulary/add-custom-words-dialog";
import { SavedWordsManager } from "@/components/vocabulary/saved-words-manager";
import { SavedQuestionsManager } from "@/components/bookmarks/saved-questions-manager";
import { useTourStep } from "@/hooks/use-tour-step";
import { useTourDriver, buildTourStep } from "@/hooks/use-tour-driver";
import { TOUR_IDS } from "@/lib/constants/tour";
import type { getBookmarks } from "@/lib/data/bookmarks";

type Bookmarks = Awaited<ReturnType<typeof getBookmarks>>;

/**
 * Owns both the tab state (moved off `Tabs`'s uncontrolled `defaultValue`
 * so it can be driven programmatically) and the "Đã lưu" onboarding tour.
 *
 * "Từ vựng" is the default/first tab — since it's already active on mount,
 * the tour no longer needs to switch tabs itself before driver.js can find
 * its elements (that used to be step 2's job, back when "Câu hỏi" was
 * first).
 *
 * Steps 3 ("Học và Chơi") and 5 ("Xuất file") only exist once the learner
 * has saved words — `SavedWordsManager` itself only renders past that
 * point — so with none saved yet the tour quietly trims itself to 3 steps
 * (welcome, tabs, "+ Thêm từ mới") instead of pointing at buttons that
 * aren't there.
 */
export function BookmarksTabs({
  questionBookmarks,
  savedWords,
  categories,
  isPro,
}: {
  questionBookmarks: Bookmarks["questionBookmarks"];
  savedWords: Bookmarks["savedWords"];
  categories: string[];
  isPro: boolean;
}) {
  const [activeTab, setActiveTab] = React.useState("vocabulary");
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
        description: "Tất cả câu hỏi và từ vựng bạn đã đánh dấu sẽ được tập hợp tại đây để dễ dàng xem lại và ôn tập.",
        nextBtnText: "Tiếp tục",
        onNext: () => driverRef.current?.moveNext(),
        onSkip: skipTour,
      }),
      buildTourStep({
        element: '[data-tour="bookmarks-tabs-list"]',
        title: "📚 Quản lý nội dung đã lưu",
        description: "Chọn từng mục để xem nội dung bạn đã lưu. Với Câu hỏi, bấm vào nội dung để xem chi tiết, hoặc chọn nhiều câu để học lại cùng lúc.",
        nextBtnText: "Tiếp tục",
        side: "bottom",
        align: "start",
        progressText: `Bước 2/${totalSteps}`,
        onNext: () => driverRef.current?.moveNext(),
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
        <TabsTrigger value="vocabulary">Từ vựng ({savedWords.length})</TabsTrigger>
        <TabsTrigger value="questions">Câu hỏi ({questionBookmarks.length})</TabsTrigger>
      </TabsList>

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
            isPro={isPro}
          />
        )}
      </TabsContent>

      <TabsContent value="questions" className="mt-4">
        <SavedQuestionsManager questions={questionBookmarks} isPro={isPro} />
      </TabsContent>
    </Tabs>
  );
}
