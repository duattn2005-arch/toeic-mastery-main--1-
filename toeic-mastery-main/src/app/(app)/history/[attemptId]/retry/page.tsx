import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getAttemptResult } from "@/lib/data/history";
import { MistakePracticeRunner } from "@/components/practice/mistake-practice-runner";
import type { MistakeQuestion } from "@/lib/data/mistakes";

export const metadata: Metadata = { title: "Luyện tập lại" };

/**
 * Untimed drill over one specific attempt's questions — either every
 * question (`?scope=all`) or just the ones this attempt got wrong/skipped
 * (`?scope=mistakes`, the default). Reuses MistakePracticeRunner exactly as
 * the global mistake bank and "Đã lưu" already do: no new Attempt row, no
 * free-tier attempt cap, just instant client-side review of questions this
 * page already has on hand from getAttemptResult.
 */
export default async function RetryAttemptPage({
  params,
  searchParams,
}: {
  params: Promise<{ attemptId: string }>;
  searchParams: Promise<{ scope?: string }>;
}) {
  const { attemptId } = await params;
  const { scope } = await searchParams;
  const profile = await requireUser();

  const { questionReviews } = await getAttemptResult(attemptId, profile.id);
  const onlyMistakes = scope !== "all";
  const source = onlyMistakes ? questionReviews.filter((q) => !q.isCorrect) : questionReviews;

  const questions: MistakeQuestion[] = source.map((q) => ({
    id: q.id,
    part: q.part,
    prompt: q.prompt,
    imageUrl: q.imageUrl,
    audioUrl: q.audioUrl,
    options: q.options.map((o) => ({ label: o.label, content: o.content })),
    correctLabel: q.correctLabel,
    explanationVi: q.explanationVi,
    passage: q.passage
      ? { title: q.passage.title, texts: q.passage.texts, imageUrl: q.passage.imageUrl, audioUrl: q.passage.audioUrl }
      : null,
  }));

  return (
    <MistakePracticeRunner
      questions={questions}
      backHref={`/history/${attemptId}`}
      backLabel="Về kết quả bài thi"
      emptyStateMessage={onlyMistakes ? "Bạn đã làm đúng hết — không có câu sai nào để luyện lại!" : "Bài thi này chưa có câu hỏi nào."}
      footerNote="Đây là bản luyện tập lại không tính giờ, không ảnh hưởng tới kết quả bài thi gốc."
    />
  );
}
