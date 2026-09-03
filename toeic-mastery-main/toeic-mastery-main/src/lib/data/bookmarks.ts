import "server-only";
import { db } from "@/lib/db";
import type { StudyItem } from "@/lib/services/study-game";
import type { SavedWord } from "@/generated/prisma/client";

export async function getBookmarks(userId: string) {
  const [questionBookmarks, grammarBookmarks, savedWords] = await Promise.all([
    db.bookmark.findMany({
      where: { userId, type: "QUESTION" },
      orderBy: { createdAt: "desc" },
      include: { question: { select: { id: true, part: true, prompt: true, testId: true } } },
    }),
    db.bookmark.findMany({
      where: { userId, type: "GRAMMAR" },
      orderBy: { createdAt: "desc" },
      include: { grammarLesson: { select: { slug: true, title: true, topic: { select: { slug: true } } } } },
    }),
    db.savedWord.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
  ]);

  return { questionBookmarks, grammarBookmarks, savedWords };
}

interface ResolvedSavedWord {
  savedWordId: string;
  term: string;
  ipa: string | null;
  partOfSpeech: string | null;
  meaningVi: string;
  exampleEn: string | null;
  audioUrl: string | null;
  note: string | null;
}

/**
 * A `SavedWord` gets its meaning/IPA/audio from one of three places, in
 * order: the learner's own custom `meaningVi` (added via the "add your own
 * word" Quizlet-style flow, takes precedence since it's what they explicitly
 * typed) — then the app's own curated `VocabularyWord` table, for words
 * auto-starred while studying (rated "Học lại"/wrong — see
 * ensureSavedWordAction's callers in flashcard-browse.tsx/quiz-mode.tsx/
 * review-session.tsx, none of which ever set `meaningVi`) — then, only for
 * words saved from an actual dictionary lookup, the dictionary cache. A word
 * matching none of the three is skipped (nothing to show yet) rather than
 * rendering blank. Shared by getSavedWordStudyItems and
 * getSavedWordExportRows so both stay in sync — missing the VocabularyWord
 * fallback here previously meant auto-starred study words silently
 * vanished from both the study session AND the PDF export. */
async function resolveSavedWords(saved: SavedWord[]): Promise<ResolvedSavedWord[]> {
  if (saved.length === 0) return [];
  const words = saved.map((s) => s.word);

  const [vocabWords, dictEntries] = await Promise.all([
    db.vocabularyWord.findMany({ where: { word: { in: words } } }),
    db.dictionaryEntry.findMany({ where: { word: { in: words } } }),
  ]);
  const vocabByWord = new Map(vocabWords.map((w) => [w.word, w]));
  const dictByWord = new Map(dictEntries.map((e) => [e.word, e]));

  const resolved: ResolvedSavedWord[] = [];
  for (const s of saved) {
    if (s.meaningVi) {
      resolved.push({
        savedWordId: s.id,
        term: s.word,
        ipa: null,
        partOfSpeech: null,
        meaningVi: s.meaningVi,
        exampleEn: s.exampleEn,
        audioUrl: null,
        note: s.note,
      });
      continue;
    }

    const vw = vocabByWord.get(s.word);
    if (vw) {
      resolved.push({
        savedWordId: s.id,
        term: vw.word,
        ipa: vw.ipa,
        partOfSpeech: vw.partOfSpeech,
        meaningVi: vw.meaningVi,
        exampleEn: vw.exampleEn,
        audioUrl: vw.audioUrlUs ?? vw.audioUrlUk,
        note: s.note,
      });
      continue;
    }

    const entry = dictByWord.get(s.word);
    if (entry?.meaningVi) {
      resolved.push({
        savedWordId: s.id,
        term: entry.word,
        ipa: entry.ipa,
        partOfSpeech: entry.partOfSpeech,
        meaningVi: entry.meaningVi,
        exampleEn: null,
        audioUrl: entry.audioUrlUs ?? entry.audioUrlUk,
        note: s.note,
      });
    }
  }
  return resolved;
}

export interface SavedWordStudyFilter {
  /** Exact category match; pass `null` explicitly to mean "chưa phân loại"
   * (uncategorized only). Omit entirely to include every category. */
  category?: string | null;
  /** Individual word selection — when given, wins over `category`. */
  wordIds?: string[];
}

export async function getSavedWordStudyItems(userId: string, filter: SavedWordStudyFilter = {}): Promise<StudyItem[]> {
  const saved = await db.savedWord.findMany({
    where: {
      userId,
      ...(filter.wordIds ? { id: { in: filter.wordIds } } : filter.category !== undefined ? { category: filter.category } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  const resolved = await resolveSavedWords(saved);
  return resolved.map((r) => ({
    id: r.savedWordId,
    term: r.term,
    ipa: r.ipa,
    partOfSpeech: r.partOfSpeech,
    meaningVi: r.meaningVi,
    exampleEn: r.exampleEn,
    audioUrl: r.audioUrl,
  }));
}

export interface SavedWordExportRow {
  word: string;
  ipa: string | null;
  meaningVi: string;
  exampleEn: string | null;
  note: string | null;
}

/** Rows for the "Xuất PDF từ vựng" feature — same resolution as
 * getSavedWordStudyItems, plus IPA (dictionary/VocabularyWord only —
 * custom-added words never have one) and the learner's own note. */
export async function getSavedWordExportRows(userId: string, wordIds?: string[]): Promise<SavedWordExportRow[]> {
  const saved = await db.savedWord.findMany({
    where: { userId, ...(wordIds ? { id: { in: wordIds } } : {}) },
    orderBy: { createdAt: "desc" },
  });

  const resolved = await resolveSavedWords(saved);
  return resolved.map((r) => ({ word: r.term, ipa: r.ipa, meaningVi: r.meaningVi, exampleEn: r.exampleEn, note: r.note }));
}
