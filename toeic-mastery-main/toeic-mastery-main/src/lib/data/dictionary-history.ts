import "server-only";
import { db } from "@/lib/db";

export async function getRecentSearches(userId: string, limit = 10) {
  const rows = await db.dictionaryHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit * 3, // over-fetch, then de-dupe by word below
  });
  const seen = new Set<string>();
  const result: typeof rows = [];
  for (const row of rows) {
    if (seen.has(row.word)) continue;
    seen.add(row.word);
    result.push(row);
    if (result.length >= limit) break;
  }
  return result;
}

export async function getSavedWords(userId: string) {
  return db.savedWord.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
}

export async function isWordSaved(userId: string, word: string) {
  const row = await db.savedWord.findUnique({ where: { userId_word: { userId, word: word.toLowerCase() } } });
  return row;
}
