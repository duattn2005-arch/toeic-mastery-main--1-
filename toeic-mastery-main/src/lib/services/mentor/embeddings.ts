import "server-only";

/**
 * Voyage AI embeddings for the RAG vector store (content_embeddings,
 * pgvector). Plain fetch, no SDK — same convention as translation-service.ts.
 * voyage-3 returns 1024-dim vectors, matching the `vector(1024)` column
 * declared in the mentor migration; switching models/dims needs a new
 * migration plus a full re-embed, not just an env var change.
 */

const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";

interface VoyageEmbeddingResponse {
  data: { embedding: number[]; index: number }[];
}

/** Batches in one request — Voyage accepts up to 128 inputs per call. */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) throw new Error("VOYAGE_API_KEY is not set. Copy .env.example to .env and configure it.");

  const res = await fetch(VOYAGE_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      input: texts,
      model: process.env.VOYAGE_EMBEDDING_MODEL || "voyage-3",
    }),
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) {
    throw new Error(`Voyage embeddings error ${res.status}: ${await res.text().catch(() => "")}`);
  }

  const data = (await res.json()) as VoyageEmbeddingResponse;
  return [...data.data].sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

export async function embedText(text: string): Promise<number[]> {
  const [embedding] = await embedTexts([text]);
  return embedding;
}

/** Postgres vector literal, e.g. "[0.1,0.2,...]" — pass as a text parameter
 * and `::vector` cast it in raw SQL (Prisma can't bind the vector type
 * directly). See mentor-rag.ts. */
export function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}
