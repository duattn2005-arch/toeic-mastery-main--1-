"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { vocabularyWordFormSchema, type VocabularyWordFormInput } from "@/lib/validations/admin";

export interface ActionResult {
  error?: string;
}

function splitList(value?: string): string[] {
  return (value ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export async function createVocabularyWordAction(input: VocabularyWordFormInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = vocabularyWordFormSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  const data = parsed.data;

  await db.vocabularyWord.create({
    data: {
      topicId: data.topicId,
      word: data.word,
      ipa: data.ipa || null,
      partOfSpeech: data.partOfSpeech,
      meaningVi: data.meaningVi,
      definitionEn: data.definitionEn,
      exampleEn: data.exampleEn,
      exampleVi: data.exampleVi,
      synonyms: splitList(data.synonyms),
      collocations: splitList(data.collocations),
      difficulty: data.difficulty,
    },
  });

  revalidatePath("/admin/vocabulary");
  return {};
}

/** Quizlet-style bulk add — term + definition only (the rest of
 * VocabularyWord's descriptive fields are optional precisely so this path
 * doesn't need them up front; an admin can flesh a word out later). Existing
 * (topicId, word) pairs are silently skipped rather than erroring the whole
 * batch over one duplicate. */
export async function bulkCreateVocabularyWordsAction(
  topicId: string,
  rows: { term: string; definition: string }[]
): Promise<ActionResult & { count?: number }> {
  await requireAdmin();
  if (!topicId) return { error: "Vui lòng chọn chủ đề" };

  const clean = rows.map((r) => ({ term: r.term.trim(), definition: r.definition.trim() })).filter((r) => r.term && r.definition);
  if (clean.length === 0) return { error: "Không có từ hợp lệ để thêm" };

  const result = await db.vocabularyWord.createMany({
    data: clean.map((r) => ({ topicId, word: r.term, meaningVi: r.definition })),
    skipDuplicates: true,
  });

  revalidatePath("/admin/vocabulary");
  return { count: result.count };
}

export async function deleteVocabularyWordAction(wordId: string): Promise<ActionResult> {
  await requireAdmin();
  await db.vocabularyWord.delete({ where: { id: wordId } });
  revalidatePath("/admin/vocabulary");
  return {};
}

export async function createVocabularyTopicAction(name: string, slug: string): Promise<ActionResult> {
  await requireAdmin();
  if (!name.trim() || !/^[a-z0-9-]+$/.test(slug)) return { error: "Tên hoặc slug không hợp lệ" };

  await db.vocabularyTopic.create({ data: { name: name.trim(), slug } });
  revalidatePath("/admin/vocabulary");
  return {};
}
