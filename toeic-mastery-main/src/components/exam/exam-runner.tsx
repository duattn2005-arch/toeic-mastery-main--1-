"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ListTodo, Loader2, Send } from "lucide-react";
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
import { ExamQuestionPanel } from "@/components/exam/exam-question-panel";
import { useExamStore } from "@/store/exam-store";
import { useExamSync, loadLocalSnapshot } from "@/hooks/use-exam-sync";
import { useExamMascotState } from "@/hooks/use-exam-mascot";
import { useDictionaryHintNudge } from "@/hooks/use-dictionary-hint-nudge";
import { StudyMascot } from "@/components/mascot/study-mascot";
import type { ExamData } from "@/lib/data/exam";

export function ExamRunner({ data }: { data: ExamData }) {
  const router = useRouter();
  const store = useExamStore();
  const [submitting, setSubmitting] = React.useState(false);
  const hydratedRef = React.useRef(false);

  useExamSync(data.attemptId);
  useDictionaryHintNudge();

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
  const next = useExamStore((s) => s.next);
  const previous = useExamStore((s) => s.previous);

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.values(answers).filter((a) => a.selectedLabel).length;
  const { mascotState, notifyInteraction } = useExamMascotState(answeredCount, hydrated);

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
    // Deferred so the state change driving submission isn't set synchronously
    // within this effect's own execution frame.
    const timeout = setTimeout(() => void submit(), 0);
    return () => clearTimeout(timeout);
  }, [hydrated, remainingSec, data.mode, submitting, submit]);

  if (!currentQuestion) {
    return <p className="p-6 text-sm text-muted-foreground">Đề thi này chưa có câu hỏi.</p>;
  }

  const currentAnswer = answers[currentQuestion.id];
  const passage = currentQuestion.passageId ? (data.passages[currentQuestion.passageId] ?? null) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-16 z-20 -mx-4 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm sm:mx-0 sm:rounded-2xl sm:border sm:px-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{data.testTitle}</p>
          <p className="text-xs text-muted-foreground">{data.mode === "PRACTICE" ? "Chế độ luyện tập" : "Chế độ thi thử"}</p>
        </div>
        <div className="flex items-center gap-2">
          <ExamTimer remainingSec={remainingSec} />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden" aria-label="Danh sách câu hỏi">
                <ListTodo className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-2xl">
              <SheetHeader>
                <SheetTitle>Danh sách câu hỏi</SheetTitle>
              </SheetHeader>
              <div className="px-4 pb-4">
                <QuestionNavigator questions={questions} answers={answers} currentIndex={currentIndex} onSelect={goTo} />
              </div>
            </SheetContent>
          </Sheet>
          <SubmitDialog onConfirm={submit} submitting={submitting} answeredCount={answeredCount} total={questions.length} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-4">
          <ExamQuestionPanel
            key={currentQuestion.id}
            attemptId={data.attemptId}
            question={currentQuestion}
            questionNumber={currentIndex + 1}
            passage={passage}
            selectedLabel={currentAnswer?.selectedLabel ?? null}
            isFlagged={currentAnswer?.isFlagged ?? false}
            onSelectAnswer={(label) => {
              notifyInteraction();
              setAnswer(currentQuestion.id, label);
            }}
            onToggleFlag={() => {
              notifyInteraction();
              toggleFlag(currentQuestion.id);
            }}
            mode={data.mode}
            allowReplay={data.allowReplay}
          />

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => {
                notifyInteraction();
                previous();
              }}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="size-4" /> Câu trước
            </Button>
            <Button
              onClick={() => {
                notifyInteraction();
                next();
              }}
              disabled={currentIndex === questions.length - 1}
            >
              Câu tiếp <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* pb-24 keeps the last row of question numbers clear of the fixed mascot widget when scrolled to the bottom */}
        <aside className="hidden rounded-2xl border border-border bg-card p-4 pb-24 shadow-soft lg:block">
          <QuestionNavigator questions={questions} answers={answers} currentIndex={currentIndex} onSelect={goTo} />
        </aside>
      </div>

      {hydrated && <StudyMascot state={mascotState} character="fox" />}
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
