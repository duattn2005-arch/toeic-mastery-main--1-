"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, LayoutGrid, LogOut, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ExamTimer } from "@/components/exam/exam-timer";
import { QuestionNavigator } from "@/components/exam/question-navigator";
import { ExamQuestionPanel, LISTENING_PARTS_WITH_PASSAGE } from "@/components/exam/exam-question-panel";
import { PassageStimulus } from "@/components/exam/passage-stimulus";
import { useExamStore } from "@/store/exam-store";
import { useExamSync, loadLocalSnapshot } from "@/hooks/use-exam-sync";
import { useDictionaryHintTutorial } from "@/hooks/use-dictionary-hint-tutorial";
import { groupQuestionsByPassage } from "@/lib/exam/group-questions";
import { cn } from "@/lib/utils";
import type { ExamData } from "@/lib/data/exam";

export function ExamRunner({ data }: { data: ExamData }) {
  const router = useRouter();
  const store = useExamStore();
  const [submitting, setSubmitting] = React.useState(false);
  const [navigatorOpen, setNavigatorOpen] = React.useState(false);
  const hydratedRef = React.useRef(false);
  const autoSubmitToastShown = React.useRef(false);

  useExamSync(data.attemptId);
  const dictionaryHint = useDictionaryHintTutorial();

  React.useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    const local = loadLocalSnapshot(data.attemptId);
    store.hydrate({
      attemptId: data.attemptId,
      questions: data.questions,
      answers: local?.answers ?? data.answers,
      currentIndex: local?.currentIndex ?? data.currentQuestionIndex,
      remainingSec: local ? Math.min(local.remainingSec, data.remainingSec) : data.remainingSec,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.attemptId]);

  const hydrated = useExamStore((s) => s.hydrated);
  const remainingSec = useExamStore((s) => s.remainingSec);
  const currentIndex = useExamStore((s) => s.currentIndex);
  const questions = useExamStore((s) => s.questions);
  const answers = useExamStore((s) => s.answers);
  const tickTimer = useExamStore((s) => s.tickTimer);
  const setAnswer = useExamStore((s) => s.setAnswer);
  const toggleFlag = useExamStore((s) => s.toggleFlag);
  const goTo = useExamStore((s) => s.goTo);

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.values(answers).filter((a) => a.selectedLabel).length;

  // Groups consecutive questions sharing one passageId (one shared audio/
  // reading passage) so they can render as a single screen — see
  // group-questions.ts's doc comment for why a plain linear scan is safe.
  // Every ungrouped question (Part 1/2/5) is its own singleton group, so
  // "Nhóm" (group) navigation below covers the whole test uniformly instead
  // of only mattering for Part 3/4/6/7.
  const groups = React.useMemo(() => groupQuestionsByPassage(questions), [questions]);
  const activeGroup = React.useMemo(
    () => groups.find((g) => currentIndex >= g.startIndex && currentIndex < g.startIndex + g.items.length),
    [groups, currentIndex]
  );
  const groupIndex = activeGroup ? groups.indexOf(activeGroup) : -1;

  const goToPrevGroup = React.useCallback(() => {
    if (groupIndex <= 0) return;
    goTo(groups[groupIndex - 1].startIndex);
  }, [groupIndex, groups, goTo]);
  const goToNextGroup = React.useCallback(() => {
    if (groupIndex === -1 || groupIndex >= groups.length - 1) return;
    goTo(groups[groupIndex + 1].startIndex);
  }, [groupIndex, groups, goTo]);

  // Left/Right arrow keys jump a whole group at a time, matching the "←  →
  // di chuyển nhanh" hint next to the group counter below. Skipped while
  // focus is on a form control or a Radix slider thumb (the audio player's
  // scrub/volume sliders use the same keys to change their own value).
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) return;
      if (target?.closest('[role="slider"]')) return;
      event.preventDefault();
      if (event.key === "ArrowLeft") goToPrevGroup();
      else goToNextGroup();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goToPrevGroup, goToNextGroup]);

  // The question navigator (Sheet) can jump the flat currentIndex to any
  // question inside the group already on screen — scroll the right-hand
  // list to it instead of re-rendering anything.
  React.useEffect(() => {
    if (!currentQuestion || !activeGroup || activeGroup.items.length <= 1) return;
    document.getElementById(`exam-q-${currentQuestion.id}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [currentIndex, currentQuestion, activeGroup]);

  // Runs once hydration loads the real deadline, not on every tick — tickTimer
  // recomputes remainingSec from the store's endTime each time, so this interval
  // never needs to be torn down and rebuilt just because the value changed.
  React.useEffect(() => {
    if (!hydrated) return;
    const interval = setInterval(tickTimer, 1000);
    return () => clearInterval(interval);
  }, [hydrated, tickTimer]);

  // A backgrounded tab can throttle or pause setInterval entirely; recompute
  // immediately from the wall-clock deadline the moment the tab is visible
  // again instead of waiting for the next (possibly delayed) tick.
  React.useEffect(() => {
    if (!hydrated) return;
    function recompute() {
      if (document.visibilityState === "visible") tickTimer();
    }
    document.addEventListener("visibilitychange", recompute);
    window.addEventListener("focus", recompute);
    return () => {
      document.removeEventListener("visibilitychange", recompute);
      window.removeEventListener("focus", recompute);
    };
  }, [hydrated, tickTimer]);

  const submit = React.useCallback(async () => {
    setSubmitting(true);
    try {
      // Flush the latest state before finalizing so nothing typed in the last
      // few seconds is lost.
      await fetch(`/api/attempts/${data.attemptId}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          remainingSec: useExamStore.getState().remainingSec,
          currentQuestionIndex: useExamStore.getState().currentIndex,
          answers: Object.entries(useExamStore.getState().answers).map(([questionId, a]) => ({
            questionId,
            selectedLabel: a.selectedLabel,
            isFlagged: a.isFlagged,
          })),
        }),
      }).catch(() => {});

      const res = await fetch(`/api/attempts/${data.attemptId}/submit`, { method: "POST" });
      if (!res.ok) throw new Error("Nộp bài thất bại, vui lòng thử lại.");
      localStorage.removeItem(`toeic-mastery:exam:${data.attemptId}`);
      router.push(`/history/${data.attemptId}`);
    } catch {
      toast.error("Nộp bài thất bại, vui lòng kiểm tra kết nối mạng và thử lại.");
      setSubmitting(false);
    }
  }, [data.attemptId, router]);

  React.useEffect(() => {
    // `hydrated` gates this: before hydration, remainingSec sits at the
    // store's default 0, which is indistinguishable from "time's up" — that
    // used to auto-submit every fresh attempt within moments of starting it.
    if (!hydrated || data.mode !== "EXAM" || remainingSec > 0 || submitting) return;
    // A resumed attempt whose real-world time already ran out (started
    // earlier, tab closed, reopened later) hits this the instant the page
    // loads — often right as a learner's first tap lands, since that's also
    // when a slow mobile connection finishes hydrating. Without this notice
    // the redirect below looked like "I tapped and it ended the exam" instead
    // of "your exam time was already up."
    if (!autoSubmitToastShown.current) {
      autoSubmitToastShown.current = true;
      toast.warning("Đã hết giờ làm bài — hệ thống tự động nộp bài của bạn.");
    }
    const timeout = setTimeout(() => void submit(), 1500);
    return () => clearTimeout(timeout);
  }, [hydrated, remainingSec, data.mode, submitting, submit]);

  if (!currentQuestion) {
    return <p className="p-6 text-sm text-muted-foreground">Đề thi này chưa có câu hỏi.</p>;
  }

  const currentAnswer = answers[currentQuestion.id];
  const passage = currentQuestion.passageId ? (data.passages[currentQuestion.passageId] ?? null) : null;

  return (
    <div className="flex flex-col gap-4">
      {dictionaryHint}
      <div className="sticky top-16 z-20 -mx-4 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm sm:mx-0 sm:rounded-2xl sm:border sm:px-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{data.testTitle}</p>
          <p className="text-xs text-muted-foreground">{data.mode === "PRACTICE" ? "Chế độ luyện tập" : "Chế độ thi thử"}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Doesn't submit or lose anything — the attempt just stays
             IN_PROGRESS and resumable, same as closing the tab would, but
             a learner who wants to abandon this scope and pick a different
             Part shouldn't have to rely on the browser back button. */}
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/practice/${data.testId}`}>
              <LogOut className="size-4" />
              Thoát
            </Link>
          </Button>
          <ExamTimer remainingSec={remainingSec} />
          <Sheet open={navigatorOpen} onOpenChange={setNavigatorOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-primary/40 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                aria-label="Xem danh sách câu hỏi"
              >
                <LayoutGrid className="size-4" />
                {currentIndex + 1}/{questions.length}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-2xl sm:mx-auto sm:max-w-xl">
              <SheetHeader>
                <SheetTitle>Danh sách câu hỏi</SheetTitle>
              </SheetHeader>
              <div className="px-4 pb-4">
                <QuestionNavigator
                  questions={questions}
                  answers={answers}
                  currentIndex={currentIndex}
                  onSelect={(index) => {
                    goTo(index);
                    setNavigatorOpen(false);
                  }}
                />
              </div>
            </SheetContent>
          </Sheet>
          <SubmitDialog onConfirm={submit} submitting={submitting} answeredCount={answeredCount} total={questions.length} />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {activeGroup && activeGroup.items.length > 1 && passage ? (
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft lg:sticky lg:top-32 lg:w-[75%] lg:shrink-0">
              <p className="mb-3 text-sm font-semibold text-primary">
                Nhóm câu {activeGroup.startIndex + 1}–{activeGroup.startIndex + activeGroup.items.length} ({activeGroup.items.length} câu hỏi)
              </p>
              {/* A group with 2-3 full-width stacked images easily runs
                 taller than the viewport — its own bounded, scrollable
                 area (same height budget as the question column opposite
                 it) keeps a real scrollbar on the images instead of the
                 whole sticky sidebar just overflowing off-screen. */}
              <div className="scrollbar-thin max-h-[70vh] overflow-y-auto pr-1 lg:max-h-[calc(100vh-9rem)]">
                <PassageStimulus
                  key={activeGroup.passageId}
                  passage={passage}
                  mode={data.mode}
                  allowReplay={data.allowReplay}
                  showAudioTour={LISTENING_PARTS_WITH_PASSAGE.has(activeGroup.items[0].part)}
                />
              </div>
            </div>
            <div className="scrollbar-thin flex max-h-[70vh] flex-1 flex-col gap-4 overflow-y-auto pr-1 lg:max-h-[calc(100vh-9rem)]">
              {activeGroup.items.map((q, i) => {
                const answer = answers[q.id];
                return (
                  <div key={q.id} id={`exam-q-${q.id}`} className={cn("rounded-2xl", q.id === currentQuestion.id && "ring-2 ring-primary ring-offset-2")}>
                    <ExamQuestionPanel
                      attemptId={data.attemptId}
                      question={q}
                      questionNumber={activeGroup.startIndex + i + 1}
                      passage={null}
                      hideSharedPassage
                      selectedLabel={answer?.selectedLabel ?? null}
                      isFlagged={answer?.isFlagged ?? false}
                      onSelectAnswer={(label) => setAnswer(q.id, label)}
                      onToggleFlag={() => toggleFlag(q.id)}
                      mode={data.mode}
                      allowReplay={data.allowReplay}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          ) : (
            <ExamQuestionPanel
              key={currentQuestion.id}
              attemptId={data.attemptId}
              question={currentQuestion}
              questionNumber={currentIndex + 1}
              passage={passage}
              selectedLabel={currentAnswer?.selectedLabel ?? null}
              isFlagged={currentAnswer?.isFlagged ?? false}
              onSelectAnswer={(label) => setAnswer(currentQuestion.id, label)}
              onToggleFlag={() => toggleFlag(currentQuestion.id)}
              mode={data.mode}
              allowReplay={data.allowReplay}
            />
          )}

        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" onClick={goToPrevGroup} disabled={groupIndex <= 0}>
            <ChevronLeft className="size-4" /> Nhóm trước
          </Button>
          <div className="hidden flex-col items-center text-xs text-muted-foreground sm:flex">
            <span className="font-medium text-foreground">
              Nhóm {groupIndex + 1}/{groups.length}
            </span>
            <span>← → di chuyển nhanh</span>
          </div>
          <Button onClick={goToNextGroup} disabled={groupIndex === -1 || groupIndex >= groups.length - 1}>
            Nhóm tiếp <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function SubmitDialog({
  onConfirm,
  submitting,
  answeredCount,
  total,
}: {
  onConfirm: () => void;
  submitting: boolean;
  answeredCount: number;
  total: number;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" disabled={submitting}>
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          Nộp bài
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Nộp bài thi?</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn đã trả lời {answeredCount}/{total} câu. Sau khi nộp, bạn sẽ không thể chỉnh sửa đáp án nữa.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Tiếp tục làm bài</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Nộp bài</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
