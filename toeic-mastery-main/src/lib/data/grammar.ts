import "server-only";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";

export async function getGrammarTopics() {
  return db.grammarTopic.findMany({
    orderBy: { orderIndex: "asc" },
    include: { _count: { select: { questions: true } }, lessons: { select: { slug: true }, take: 1 } },
  });
}

export async function getGrammarTopicDetail(slug: string, userId: string) {
  const topic = await db.grammarTopic.findUnique({
    where: { slug },
    include: { lessons: true },
  });
  if (!topic) notFound();

  const [questions, bookmark] = await Promise.all([
    db.question.findMany({
      where: { grammarTopicId: topic.id },
      include: { options: { orderBy: { label: "asc" } } },
      orderBy: { orderIndex: "asc" },
      take: 15,
    }),
    topic.lessons[0] ? db.bookmark.findFirst({ where: { userId, type: "GRAMMAR", grammarLessonId: topic.lessons[0].id } }) : null,
  ]);

  return { topic, lesson: topic.lessons[0] ?? null, questions, isBookmarked: !!bookmark };
}
