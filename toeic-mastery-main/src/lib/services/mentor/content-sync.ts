import "server-only";
import { db } from "@/lib/db";
import { upsertEmbedding } from "./mentor-rag";

/**
 * Incremental RAG re-indexing — "AI Mentor liên tục cập nhật tài liệu"
 * (SRD Module 2). Compares each content table's `updatedAt` against the
 * embedding already stored for it and only calls the embeddings API for
 * rows that are new or have changed since their last embed. Run from
 * /api/cron/mentor/reembed-content; safe to run as often as needed since a
 * fully up-to-date pass costs one cheap query per source type and no
 * embedding calls at all.
 */

async function getEmbeddedTimestamps(sourceType: "GRAMMAR_LESSON" | "VOCABULARY_WORD" | "VOCABULARY_TOPIC" | "QUESTION_EXPLANATION"): Promise<Map<string, Date>> {
  const rows = await db.$queryRaw<{ sourceId: string; sourceUpdatedAt: Date }[]>`
    SELECT "source_id" AS "sourceId", "source_updated_at" AS "sourceUpdatedAt"
    FROM "content_embeddings"
    WHERE "source_type" = ${sourceType}::"EmbeddingSourceType" AND "chunk_index" = 0
  `;
  return new Map(rows.map((r) => [r.sourceId, r.sourceUpdatedAt]));
}

function isStale(embeddedAt: Date | undefined, sourceUpdatedAt: Date): boolean {
  return !embeddedAt || embeddedAt.getTime() < sourceUpdatedAt.getTime();
}

async function syncGrammarLessons(): Promise<number> {
  const [lessons, embedded] = await Promise.all([
    db.grammarLesson.findMany({ select: { id: true, title: true, theory: true, tips: true, updatedAt: true } }),
    getEmbeddedTimestamps("GRAMMAR_LESSON"),
  ]);

  let count = 0;
  for (const lesson of lessons) {
    if (!isStale(embedded.get(lesson.id), lesson.updatedAt)) continue;
    const content = [lesson.title, lesson.theory, ...lesson.tips].filter(Boolean).join("\n\n");
    await upsertEmbedding({ sourceType: "GRAMMAR_LESSON", sourceId: lesson.id, content, sourceUpdatedAt: lesson.updatedAt });
    count += 1;
  }
  return count;
}

async function syncVocabularyWords(): Promise<number> {
  const [words, embedded] = await Promise.all([
    db.vocabularyWord.findMany({
      select: { id: true, word: true, meaningVi: true, definitionEn: true, exampleEn: true, collocations: true, updatedAt: true },
    }),
    getEmbeddedTimestamps("VOCABULARY_WORD"),
  ]);

  let count = 0;
  for (const w of words) {
    if (!isStale(embedded.get(w.id), w.updatedAt)) continue;
    const content = [w.word, w.meaningVi, w.definitionEn, w.exampleEn, w.collocations.join(", ")].filter(Boolean).join("\n");
    await upsertEmbedding({ sourceType: "VOCABULARY_WORD", sourceId: w.id, content, sourceUpdatedAt: w.updatedAt });
    count += 1;
  }
  return count;
}

async function syncVocabularyTopics(): Promise<number> {
  const [topics, embedded] = await Promise.all([
    db.vocabularyTopic.findMany({ select: { id: true, name: true, description: true, createdAt: true } }),
    getEmbeddedTimestamps("VOCABULARY_TOPIC"),
  ]);

  let count = 0;
  for (const t of topics) {
    // VocabularyTopic has no updatedAt — createdAt is the closest proxy;
    // topics are rarely edited after creation, so this only misses a rare
    // in-place name/description edit, not new/changed content.
    if (!isStale(embedded.get(t.id), t.createdAt)) continue;
    const content = [t.name, t.description].filter(Boolean).join("\n");
    await upsertEmbedding({ sourceType: "VOCABULARY_TOPIC", sourceId: t.id, content, sourceUpdatedAt: t.createdAt });
    count += 1;
  }
  return count;
}

async function syncQuestionExplanations(): Promise<number> {
  // Only PUBLISHED questions — never let a DRAFT/unreviewed explanation
  // (possibly with a wrong answer key) leak into what the mentor cites.
  const [questions, embedded] = await Promise.all([
    db.question.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, prompt: true, explanationVi: true, evidenceText: true, updatedAt: true },
    }),
    getEmbeddedTimestamps("QUESTION_EXPLANATION"),
  ]);

  let count = 0;
  for (const q of questions) {
    if (!isStale(embedded.get(q.id), q.updatedAt)) continue;
    const content = [q.prompt, q.explanationVi, q.evidenceText].filter(Boolean).join("\n");
    await upsertEmbedding({ sourceType: "QUESTION_EXPLANATION", sourceId: q.id, content, sourceUpdatedAt: q.updatedAt });
    count += 1;
  }
  return count;
}

export async function syncAllContentEmbeddings(): Promise<Record<string, number>> {
  const [grammarLessons, vocabularyWords, vocabularyTopics, questionExplanations] = await Promise.all([
    syncGrammarLessons(),
    syncVocabularyWords(),
    syncVocabularyTopics(),
    syncQuestionExplanations(),
  ]);
  return { grammarLessons, vocabularyWords, vocabularyTopics, questionExplanations };
}
