import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getGrammarTopicDetail } from "@/lib/data/grammar";
import { GrammarPracticeQuiz } from "@/components/grammar/grammar-practice-quiz";
import { GrammarBookmarkButton } from "@/components/grammar/grammar-bookmark-button";
import { GrammarStudyTimer } from "@/components/grammar/grammar-study-timer";

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }): Promise<Metadata> {
  const { topic } = await params;
  return { title: topic.replace(/-/g, " ") };
}

export default async function GrammarTopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic: slug } = await params;
  const profile = await requireUser();
  const { topic, lesson, questions, isBookmarked } = await getGrammarTopicDetail(slug, profile.id);

  const examples = (lesson?.examples as unknown as { en: string; vi: string }[]) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <GrammarStudyTimer topicSlug={slug} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{topic.title}</h1>
          {topic.summary && <p className="mt-1 text-sm text-muted-foreground">{topic.summary}</p>}
        </div>
        {lesson && <GrammarBookmarkButton grammarLessonId={lesson.id} initialBookmarked={isBookmarked} />}
      </div>

      {lesson && (
        <>
          <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">LÝ THUYẾT</h2>
            <div className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">{lesson.theory}</div>
          </section>

          {examples.length > 0 && (
            <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground">VÍ DỤ</h2>
              <ul className="flex flex-col gap-2.5">
                {examples.map((ex, i) => (
                  <li key={i} className="rounded-lg bg-accent/40 p-3 text-sm">
                    <p className="font-medium">{ex.en}</p>
                    <p className="mt-0.5 text-muted-foreground">{ex.vi}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {lesson.tips.length > 0 && (
            <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground">MẸO GHI NHỚ</h2>
              <ul className="flex flex-col gap-1.5 text-sm text-foreground/90">
                {lesson.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                    {tip}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {questions.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">BÀI LUYỆN TẬP</h2>
          <GrammarPracticeQuiz
            questions={questions.map((q) => ({
              id: q.id,
              prompt: q.prompt,
              explanationVi: q.explanationVi,
              correctLabel: q.correctLabel,
              options: q.options,
            }))}
          />
        </section>
      )}
    </div>
  );
}
