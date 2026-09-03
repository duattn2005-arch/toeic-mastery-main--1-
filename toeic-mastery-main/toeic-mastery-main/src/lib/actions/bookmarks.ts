"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentProfile } from "@/lib/auth";

export interface ActionResult {
  error?: string;
  bookmarked?: boolean;
}

export async function toggleQuestionBookmarkAction(questionId: string): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Vui lòng đăng nhập" };

  const existing = await db.bookmark.findFirst({ where: { userId: profile.id, type: "QUESTION", questionId } });
  if (existing) {
    await db.bookmark.delete({ where: { id: existing.id } });
    revalidatePath("/bookmarks");
    return { bookmarked: false };
  }

  await db.bookmark.create({ data: { userId: profile.id, type: "QUESTION", questionId } });
  revalidatePath("/bookmarks");
  return { bookmarked: true };
}

export async function toggleGrammarBookmarkAction(grammarLessonId: string): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Vui lòng đăng nhập" };

  const existing = await db.bookmark.findFirst({ where: { userId: profile.id, type: "GRAMMAR", grammarLessonId } });
  if (existing) {
    await db.bookmark.delete({ where: { id: existing.id } });
    revalidatePath("/bookmarks");
    return { bookmarked: false };
  }

  await db.bookmark.create({ data: { userId: profile.id, type: "GRAMMAR", grammarLessonId } });
  revalidatePath("/bookmarks");
  return { bookmarked: true };
}

export async function saveQuestionVocabularyAction(words: string[]): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Vui lòng đăng nhập" };

  // Outside a $transaction — see startLearningWordsAction / bulkAddCustomWordsAction
  // for why a variable-length list of independent upserts shouldn't be
  // batched into one interactive transaction.
  await Promise.all(
    words
      .map((w) => w.trim().toLowerCase())
      .filter(Boolean)
      .map((word) =>
        db.savedWord.upsert({
          where: { userId_word: { userId: profile.id, word } },
          create: { userId: profile.id, word },
          update: {},
        })
      )
  );

  revalidatePath("/bookmarks");
  return {};
}
