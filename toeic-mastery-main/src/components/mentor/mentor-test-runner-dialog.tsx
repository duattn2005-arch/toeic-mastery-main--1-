"use client";

import * as React from "react";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PART_META, MENTOR_LEVEL_LABEL_VI } from "@/lib/constants/toeic";
import { AnswerOptionList } from "@/components/exam/answer-option";
import { AudioPlayer } from "@/components/exam/audio-player";
import { TtsAudioPlayer } from "@/components/exam/tts-audio-player";
import { PassageViewer } from "@/components/exam/passage-viewer";
import type { TestPart, SkillDimensionType } from "@/generated/prisma/enums";

interface MentorTestPassageDTO {
  id: string;
  title: string | null;
  texts: { label: string; content: string }[];
  audioUrl: string | null;
  imageUrls: string[];
  transcript: string | null;
}

interface MentorTestQuestionDTO {
  id: string;
  part: TestPart;
  prompt: string;
  imageUrl: string | null;
  audioUrl: string | null;
  transcript: string | null;
  passageId: string | null;
  passage: MentorTestPassageDTO | null;
  options: { label: string; content: string }[];
}

interface MentorTestDTO {
  id: string;
  status: "PENDING" | "IN_PROGRESS" | "PASSED" | "FAILED";
  score: number | null;
  passThreshold: number;
  dimensionType: SkillDimensionType;
  questions: MentorTestQuestionDTO[];
}

interface SubmitResult {
  score: number;
  passed: boolean;
  correctCount: number;
  totalCount: number;
  estimatedScore: { listening: number; reading: number; total: number } | null;
  onboardingCompleted: boolean;
  levelGate: { branch: "ADVANCE" | "REMEDIATE" | "RESTART"; fromLevel: string; toLevel: string; weakLabels: string[]; hongLabels: string[] } | null;
}

/** Consecutive questions sharing one Passage (Part 3/4/6/7's shared
 * audio/reading stimulus) collapse into one group so that shared context
 * only renders once — same idea as exam-runner.tsx's own question
 * grouping, just scoped to this dialog's flat question list. */
function groupQuestions(questions: MentorTestQuestionDTO[]): { passage: MentorTestPassageDTO | null; questions: MentorTestQuestionDTO[] }[] {
  const groups: { passage: MentorTestPassageDTO | null; questions: MentorTestQuestionDTO[] }[] = [];
  for (const q of questions) {
    const last = groups[groups.length - 1];
    if (q.passageId && last?.passage?.id === q.passageId) {
      last.questions.push(q);
    } else {
      groups.push({ passage: q.passage, questions: [q] });
    }
  }
  return groups;
}

async function fetchMentorTest(mentorTestId: string): Promise<MentorTestDTO> {
  const res = await fetch(`/api/mentor/tests/${mentorTestId}`);
  if (!res.ok) throw new Error("Không tải được bài kiểm tra");
  const data = (await res.json()) as { mentorTest: MentorTestDTO };
  return data.mentorTest;
}

async function submitMentorTest(mentorTestId: string, answers: { questionId: string; selectedLabel: string }[]): Promise<SubmitResult> {
  const res = await fetch(`/api/mentor/tests/${mentorTestId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Nộp bài thất bại");
  return res.json();
}

export function MentorTestRunnerDialog({
  mentorTestId,
  open,
  onOpenChange,
  onPassed,
}: {
  mentorTestId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fired once, right after a graded PASS — e.g. the LearningPath day
   * runner uses this to call .../items/[id]/complete, which a FAILED
   * result must never trigger (see mentor-test-runner-dialog.tsx's own
   * copy about asking the mentor for another attempt instead). */
  onPassed?: () => void;
}) {
  const queryClient = useQueryClient();
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [result, setResult] = React.useState<SubmitResult | null>(null);

  const testQuery = useQuery({
    queryKey: ["mentor-test", mentorTestId],
    queryFn: () => fetchMentorTest(mentorTestId),
    enabled: open,
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      submitMentorTest(
        mentorTestId,
        Object.entries(answers).map(([questionId, selectedLabel]) => ({ questionId, selectedLabel }))
      ),
    onSuccess: (data) => {
      setResult(data);
      void queryClient.invalidateQueries({ queryKey: ["mentor-test", mentorTestId] });
      if (data.passed) onPassed?.();
    },
  });

  const test = testQuery.data;
  const answeredCount = Object.keys(answers).length;
  const alreadyGraded = test?.status === "PASSED" || test?.status === "FAILED";
  const isPlacement = test?.dimensionType === "PLACEMENT";
  const isLevelGate = test?.dimensionType === "LEVEL_GATE";
  const groups = React.useMemo(() => (test ? groupQuestions(test.questions) : []), [test]);
  const questionIndex = React.useMemo(() => new Map(test?.questions.map((q, i) => [q.id, i]) ?? []), [test]);

  function handleClose(next: boolean) {
    if (!next) {
      // Reset local state on close so reopening the same card starts fresh
      // (relevant only if the test wasn't graded — a graded test always
      // shows its stored result via `alreadyGraded` instead).
      setAnswers({});
      setResult(null);
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isPlacement ? "Bài kiểm tra đầu vào" : isLevelGate ? "Gate Test lên cấp" : "Bài kiểm tra nhanh"}</DialogTitle>
          <DialogDescription>
            {isPlacement
              ? "Khoảng 50 câu trải đều các Part, lấy từ ngân hàng câu hỏi mới nhất — để AI Mentor ước tính điểm xuất phát của bạn."
              : isLevelGate
                ? "Đạt từ 80% và không nhãn kiến thức nào yếu để lên cấp tiếp theo. Dưới ngưỡng đó, AI Mentor sẽ chỉ đúng phần cần học lại."
                : "Vượt qua để AI Mentor mở khóa phần khó hơn cho bạn."}
          </DialogDescription>
        </DialogHeader>

        {testQuery.isLoading && (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        )}

        {test && !result && !alreadyGraded && (
          <div className="flex flex-col gap-5">
            {groups.map((group, groupIndex) => (
              <div key={group.passage?.id ?? `single-${groupIndex}`} className="flex flex-col gap-3 border-t border-border pt-4 first:border-t-0 first:pt-0">
                {group.passage && (
                  <>
                    {group.passage.audioUrl ? (
                      <AudioPlayer src={group.passage.audioUrl} className="mb-1" />
                    ) : (
                      group.passage.transcript && <TtsAudioPlayer text={group.passage.transcript} className="mb-1" />
                    )}
                    <PassageViewer title={group.passage.title} texts={group.passage.texts} imageUrls={group.passage.imageUrls} />
                  </>
                )}
                {group.questions.map((q) => (
                  <div key={q.id} className="flex flex-col gap-2.5">
                    <p className="text-xs font-medium text-primary">
                      Câu {(questionIndex.get(q.id) ?? 0) + 1}/{test.questions.length} · {PART_META[q.part].shortLabel}
                    </p>
                    {!q.passageId && q.audioUrl && <AudioPlayer src={q.audioUrl} />}
                    {!q.passageId && !q.audioUrl && q.transcript && <TtsAudioPlayer text={q.transcript} />}
                    {!q.passageId && q.imageUrl && (
                      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted">
                        <Image src={q.imageUrl} alt="" fill className="object-contain" sizes="(max-width: 768px) 100vw, 480px" />
                      </div>
                    )}
                    {q.prompt && <p className="text-sm leading-relaxed">{q.prompt}</p>}
                    <AnswerOptionList
                      options={q.options}
                      selectedLabel={answers[q.id] ?? null}
                      onSelect={(label) => setAnswers((prev) => ({ ...prev, [q.id]: label }))}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {test && !result && alreadyGraded && (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <p className="text-sm text-muted-foreground">Bài kiểm tra này đã được nộp trước đó.</p>
            {test.score !== null && (
              <p className="text-sm font-medium">{Math.round(test.score * 100)}% câu đúng</p>
            )}
          </div>
        )}

        {result && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            {isPlacement || (result.levelGate ? result.levelGate.branch === "ADVANCE" : result.passed) ? (
              <CheckCircle2 className="size-12 text-success" />
            ) : (
              <XCircle className="size-12 text-destructive" />
            )}
            <p className="text-lg font-semibold">
              {result.correctCount}/{result.totalCount} câu đúng ({Math.round(result.score * 100)}%)
            </p>
            {isPlacement && result.estimatedScore ? (
              <>
                <p className="text-2xl font-bold text-primary">{result.estimatedScore.total} điểm</p>
                <p className="text-sm text-muted-foreground">
                  Nghe ước tính {result.estimatedScore.listening} · Đọc ước tính {result.estimatedScore.reading}
                </p>
                <p className="text-sm text-muted-foreground">
                  {result.onboardingCompleted
                    ? "AI Mentor đã ghi nhận điểm xuất phát và đang chuẩn bị lộ trình học cá nhân hóa cho bạn."
                    : "AI Mentor đã ghi nhận điểm xuất phát của bạn."}
                </p>
              </>
            ) : result.levelGate ? (
              <>
                {result.levelGate.branch === "ADVANCE" && (
                  <p className="text-sm text-muted-foreground">
                    Chúc mừng! Bạn đã lên {MENTOR_LEVEL_LABEL_VI[result.levelGate.toLevel] ?? result.levelGate.toLevel}.
                  </p>
                )}
                {result.levelGate.branch === "REMEDIATE" && (
                  <p className="text-sm text-muted-foreground">
                    Gần đạt rồi — hãy ôn lại {result.levelGate.weakLabels.join(", ")} rồi làm lại Gate Test sau.
                  </p>
                )}
                {result.levelGate.branch === "RESTART" && (
                  <p className="text-sm text-muted-foreground">
                    Chưa đạt ngưỡng cần thiết — hãy học lại nền tảng của: {result.levelGate.hongLabels.join(", ")} rồi thử lại.
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {result.passed
                  ? "Chúc mừng! Bạn đã mở khóa mức độ khó hơn cho phần này."
                  : "Chưa đạt ngưỡng cần thiết — hãy nhắn cho AI Mentor để nhận một bài kiểm tra khác sau khi ôn lại."}
              </p>
            )}
          </div>
        )}

        {submitMutation.isError && <p className="text-sm text-destructive">{(submitMutation.error as Error).message}</p>}

        <DialogFooter>
          {!result && !alreadyGraded && (
            <>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Đóng
              </Button>
              <Button
                onClick={() => submitMutation.mutate()}
                disabled={!test || answeredCount < test.questions.length || submitMutation.isPending}
              >
                {submitMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                Nộp bài ({answeredCount}/{test?.questions.length ?? 0})
              </Button>
            </>
          )}
          {(result || alreadyGraded) && <Button onClick={() => handleClose(false)}>Đóng</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
