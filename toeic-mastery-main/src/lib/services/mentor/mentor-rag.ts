import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { embedText, toVectorLiteral } from "./embeddings";

export interface RetrievedChunk {
  sourceType: string;
  sourceId: string;
  content: string;
  distance: number;
}

/**
 * Cosine-similarity search over content_embeddings via pgvector's `<=>`
 * operator. Prisma Client has no vector type, so this goes through
 * $queryRaw — the query embedding is passed as a text parameter and cast
 * with `::vector` in SQL rather than bound as a native type.
 */
export async function searchRelevantContent(queryText: string, limit = 5): Promise<RetrievedChunk[]> {
  const embedding = await embedText(queryText);
  const vectorLiteral = toVectorLiteral(embedding);

  return db.$queryRaw<RetrievedChunk[]>`
    SELECT
      "source_type" AS "sourceType",
      "source_id" AS "sourceId",
      "content",
      "embedding" <=> ${vectorLiteral}::vector AS "distance"
    FROM "content_embeddings"
    ORDER BY "embedding" <=> ${vectorLiteral}::vector
    LIMIT ${limit}
  `;
}

/**
 * Upserts one chunk's embedding. `sourceUpdatedAt` should be the source
 * row's own `updatedAt`/`createdAt` at embed time — the re-embed job
 * (mentor-content-sync.ts) compares this to the live row to decide what's
 * stale, so passing anything else silently breaks incremental sync.
 */
export async function upsertEmbedding(params: {
  sourceType: "GRAMMAR_LESSON" | "VOCABULARY_WORD" | "QUESTION_EXPLANATION" | "VOCABULARY_TOPIC";
  sourceId: string;
  chunkIndex?: number;
  content: string;
  sourceUpdatedAt: Date;
}): Promise<void> {
  const embedding = await embedText(params.content);
  const vectorLiteral = toVectorLiteral(embedding);
  const chunkIndex = params.chunkIndex ?? 0;
  const model = process.env.VOYAGE_EMBEDDING_MODEL || "voyage-3";

  await db.$executeRaw`
    INSERT INTO "content_embeddings"
      ("id", "source_type", "source_id", "chunk_index", "content", "embedding", "embedding_model", "source_updated_at", "created_at")
    VALUES
      (${randomUUID()}::uuid, ${params.sourceType}::"EmbeddingSourceType", ${params.sourceId}::uuid, ${chunkIndex}, ${params.content}, ${vectorLiteral}::vector, ${model}, ${params.sourceUpdatedAt}, now())
    ON CONFLICT ("source_type", "source_id", "chunk_index")
    DO UPDATE SET
      "content" = EXCLUDED."content",
      "embedding" = EXCLUDED."embedding",
      "embedding_model" = EXCLUDED."embedding_model",
      "source_updated_at" = EXCLUDED."source_updated_at"
  `;
}

export async function deleteEmbeddings(sourceType: string, sourceId: string): Promise<void> {
  await db.$executeRaw`
    DELETE FROM "content_embeddings" WHERE "source_type" = ${sourceType}::"EmbeddingSourceType" AND "source_id" = ${sourceId}::uuid
  `;
}

/**
 * Bulk variant for a cascading delete (e.g. deleteTestAction removes every
 * Question under a Test in one `db.test.delete` — there's no per-row
 * callback to hook a single deleteEmbeddings() into, so the caller collects
 * the doomed ids first and calls this once instead of looping).
 */
export async function deleteEmbeddingsForSources(sourceType: string, sourceIds: string[]): Promise<void> {
  if (sourceIds.length === 0) return;
  await db.$executeRaw`
    DELETE FROM "content_embeddings" WHERE "source_type" = ${sourceType}::"EmbeddingSourceType" AND "source_id" = ANY(${sourceIds}::uuid[])
  `;
}
