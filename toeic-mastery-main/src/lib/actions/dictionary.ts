"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentProfile } from "@/lib/auth";
import { touchStudyStreak } from "@/lib/services/study-streak";

export interface ActionResult {
  error?: string;
  saved?: boolean;
}

/** Flat credit per lookup toward "Tổng giờ học" — a dictionary lookup has no
 * natural start/end to time like a game session does, so this stands in for
 * the few seconds spent reading the definition. */
const DICTIONARY_LOOKUP_CREDIT_SEC = 20;

export async function logDictionaryHistoryAction(word: string, source: "SEARCH" | "SELECTION") {
  const profile = await getCurrentProfile();
  if (!profile) return;
  const normalized = word.trim().toLowerCase();
  if (!normalized) return;

  await db.$transaction([
    db.dictionaryHistory.create({
      data: { userId: profile.id, word: normalized, source },
    }),
    db.studySession.create({
      data: {
        userId: profile.id,
        activityType: "DICTIONARY",
        durationSec: DICTIONARY_LOOKUP_CREDIT_SEC,
        endedAt: new Date(),
      },
    }),
  ]);
  await touchStudyStreak(profile);
  // No revalidatePath("/dashboard") here: this is called both from a client
  // effect (fine) and directly during /dictionary/[word]'s own render
  // (Next.js 16 disallows revalidatePath during a render pass — it would
  // throw and crash the page). /dashboard reads cookies via auth, which
  // already makes it fully dynamic, so it re-fetches fresh data on every
  // visit regardless; revalidating it was never doing anything anyway.
}

export async function toggleSaveWordAction(word: string): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Vui lòng đăng nhập để lưu từ" };

  const normalized = word.trim().toLowerCase();
  if (!normalized) return { error: "Từ không hợp lệ" };

  const existing = await db.savedWord.findUnique({
    where: { userId_word: { userId: profile.id, word: normalized } },
  });

  if (existing) {
    await db.savedWord.delete({ where: { id: existing.id } });
    revalidatePath("/dictionary");
    revalidatePath("/bookmarks");
    return { saved: false };
  }

  await db.savedWord.create({ data: { userId: profile.id, word: normalized } });
  revalidatePath("/dictionary");
  revalidatePath("/bookmarks");
  return { saved: true };
}

/** Quizlet-style "add your own word" — unlike toggleSaveWordAction, this
 * doesn't depend on the dictionary API resolving the term first, so a
 * learner can save proper nouns, TOEIC-specific jargon, or phrases the
 * dictionary provider doesn't know. The custom meaningVi takes precedence
 * over the DictionaryEntry cache when both exist (see getSavedWordStudyItems). */
export async function bulkAddCustomWordsAction(
  rows: { term: string; definition: string }[],
  category?: string | null
): Promise<ActionResult & { count?: number }> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Vui lòng đăng nhập" };

  const clean = rows.map((r) => ({ term: r.term.trim(), definition: r.definition.trim() })).filter((r) => r.term && r.definition);
  if (clean.length === 0) return { error: "Không có từ hợp lệ để thêm" };
  const normalizedCategory = category?.trim() || null;

  // Run outside a $transaction — each word is an independent upsert, and a
  // large pasted list (Quizlet sets often run 50-100+ terms) can otherwise
  // blow the default 5s interactive-transaction timeout (P2028), same
  // failure mode already root-caused for attempt submission and bulk
  // question import.
  await Promise.all(
    clean.map((r) => {
      const word = r.term.toLowerCase();
      return db.savedWord.upsert({
        where: { userId_word: { userId: profile.id, word } },
        create: { userId: profile.id, word, meaningVi: r.definition, category: normalizedCategory },
        update: { meaningVi: r.definition, ...(normalizedCategory ? { category: normalizedCategory } : {}) },
      });
    })
  );

  const elapsedSec = Math.min(clean.length * 5, 300);
  await db.studySession.create({
    data: { userId: profile.id, activityType: "VOCABULARY", durationSec: elapsedSec, endedAt: new Date() },
  });
  await touchStudyStreak(profile);

  revalidatePath("/bookmarks");
  revalidatePath("/dashboard");
  return { count: clean.length };
}

export async function setSavedWordCategoryAction(word: string, category: string | null): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Vui lòng đăng nhập" };

  await db.savedWord.update({
    where: { userId_word: { userId: profile.id, word: word.trim().toLowerCase() } },
    data: { category: category?.trim() || null },
  });
  revalidatePath("/bookmarks");
  return {};
}

export async function updateSavedWordNoteAction(word: string, note: string): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Vui lòng đăng nhập" };

  await db.savedWord.update({
    where: { userId_word: { userId: profile.id, word: word.trim().toLowerCase() } },
    data: { note },
  });
  revalidatePath("/dictionary");
  return {};
}

export async function toggleFavoriteWordAction(word: string): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Vui lòng đăng nhập" };

  const key = { userId_word: { userId: profile.id, word: word.trim().toLowerCase() } };
  const existing = await db.savedWord.findUnique({ where: key });
  if (!existing) return { error: "Từ chưa được lưu" };

  await db.savedWord.update({ where: key, data: { isFavorite: !existing.isFavorite } });
  revalidatePath("/dictionary");
  return {};
}

export async function deleteSavedWordAction(word: string): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Vui lòng đăng nhập" };

  await db.savedWord.delete({
    where: { userId_word: { userId: profile.id, word: word.trim().toLowerCase() } },
  });
  revalidatePath("/dictionary");
  revalidatePath("/bookmarks");
  return {};
}

/** Auto-star/unstar a word as a side effect of rating it "chưa nhớ" (AGAIN)
 * vs. anything else, across every flashcard/quiz flow in the app — so
 * "words gotten wrong or not yet remembered" become the same starred list
 * shown in Đã lưu, with no separate tracking needed. Idempotent (upsert /
 * deleteMany), unlike deleteSavedWordAction which throws if absent. */
export async function ensureSavedWordAction(word: string): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) return;
  const normalized = word.trim().toLowerCase();
  if (!normalized) return;

  await db.savedWord.upsert({
    where: { userId_word: { userId: profile.id, word: normalized } },
    create: { userId: profile.id, word: normalized },
    update: {},
  });
  revalidatePath("/bookmarks");
}

export async function unsaveWordIfExistsAction(word: string): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) return;
  const normalized = word.trim().toLowerCase();
  if (!normalized) return;

  await db.savedWord.deleteMany({ where: { userId: profile.id, word: normalized } });
  revalidatePath("/bookmarks");
}
