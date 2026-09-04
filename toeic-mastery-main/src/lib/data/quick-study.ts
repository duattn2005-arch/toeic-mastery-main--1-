import "server-only";
import { db } from "@/lib/db";

export interface QuickStudyQuestionItem {
  type: "question";
  id: string;
  part: "PART1" | "PART2" | "PART5";
  prompt: string;
  imageUrl: string | null;
  audioUrl: string | null;
  options: { label: string; content: string }[];
  correctLabel: string;
  explanationVi: string;
  bookmarked: boolean;
}

export interface QuickStudyVocabItem {
  type: "vocab";
  mode: "review" | "new";
  vocabularyWordId: string;
  word: string;
  ipa: string | null;
  meaningVi: string;
  exampleEn: string | null;
  audioUrlUs: string | null;
  saved: boolean;
}

export type QuickStudyItem = QuickStudyQuestionItem | QuickStudyVocabItem;

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

/** Rough real-world seconds per item — this is what makes a "15 phút" session
 * actually take ~15 minutes, instead of the old (buggy) 1-item-per-minute
 * count. Listening items cost more than their audio length alone because the
 * learner also reads/answers; vocab is cheapest since it's just exposure +
 * one tap. */
const AVG_SECONDS = {
  vocabReview: 18,
  vocabNew: 25,
  PART1: 25,
  PART2: 20,
  PART5: 35,
} as const;

/** Round-robin across every content type so a session is genuinely mixed
 * (not "20 vocab cards then 5 questions") while respecting each type's real
 * time cost and how much of that type is actually available. */
function fillByTimeBudget(targetSeconds: number, pools: { key: keyof typeof AVG_SECONDS; queue: unknown[] }[]): Map<string, number> {
  const counts = new Map<string, number>();
  let remaining = targetSeconds;
  let madeProgress = true;
  const cursors = new Map<string, number>();

  while (remaining > 0 && madeProgress) {
    madeProgress = false;
    for (const pool of pools) {
      const taken = cursors.get(pool.key) ?? 0;
      const cost = AVG_SECONDS[pool.key];
      if (taken >= pool.queue.length || cost > remaining) continue;
      cursors.set(pool.key, taken + 1);
      counts.set(pool.key, (counts.get(pool.key) ?? 0) + 1);
      remaining -= cost;
      madeProgress = true;
      if (remaining <= 0) break;
    }
  }

  return counts;
}

/**
 * "Zero planning" session — a real mix of vocabulary (both due-for-review
 * and brand-new words) plus short listening (Part 1/2) and grammar (Part 5)
 * questions, sized to actually fill `durationMinutes` of study time rather
 * than treating 1 minute as 1 item. Free is pinned at 7 minutes; Pro's
 * slider (5-60 min) changes `durationMinutes` directly.
 *
 * Part 1/2 are restricted to questions that already have a real produced
 * audio file (Part 1 also requires its photo) — never a text-only stand-in
 * for a listening part, so nothing renders as an unanswerable blank card.
 * Part 6/7 (shared reading passages) are intentionally left out of this mix
 * for now — grouping a passage with its questions as one atomic unit is a
 * reasonable follow-up, not required to fix the time-budget bug this
 * rewrite targets.
 */
export async function buildQuickStudySession(userId: string, durationMinutes: number): Promise<QuickStudyItem[]> {
  const targetSeconds = Math.max(60, Math.round(durationMinutes * 60));

  const [dueWords, newWords, part1Questions, part2Questions, part5Questions] = await Promise.all([
    db.userVocabulary.findMany({
      where: { userId, nextReviewDate: { lte: new Date() } },
      include: { vocabularyWord: true },
      orderBy: { nextReviewDate: "asc" },
      take: 30,
    }),
    db.vocabularyWord.findMany({
      where: { userVocabulary: { none: { userId } } },
      take: 30,
      orderBy: { createdAt: "desc" },
    }),
    db.question.findMany({
      // Photo-description part: only usable if it actually has both its
      // recorded audio and its photo, never a partial/placeholder stand-in.
      where: { part: "PART1", status: "PUBLISHED", audioUrl: { not: null }, imageUrl: { not: null } },
      include: { options: { orderBy: { label: "asc" } } },
      take: 15,
    }),
    db.question.findMany({
      where: { part: "PART2", status: "PUBLISHED", audioUrl: { not: null } },
      include: { options: { orderBy: { label: "asc" } } },
      take: 15,
    }),
    db.question.findMany({
      where: { part: "PART5", status: "PUBLISHED" },
      include: { options: { orderBy: { label: "asc" } } },
      take: 40,
    }),
  ]);

  const shuffledDue = shuffle(dueWords);
  const shuffledNew = shuffle(newWords);
  const shuffledPart1 = shuffle(part1Questions);
  const shuffledPart2 = shuffle(part2Questions);
  const shuffledPart5 = shuffle(part5Questions);

  const counts = fillByTimeBudget(targetSeconds, [
    { key: "vocabReview", queue: shuffledDue },
    { key: "PART5", queue: shuffledPart5 },
    { key: "vocabNew", queue: shuffledNew },
    { key: "PART1", queue: shuffledPart1 },
    { key: "PART2", queue: shuffledPart2 },
  ]);

  // Nothing due/new/published yet for any pool — top up with just-published
  // Part 5 (the most plentiful part) so the session is never completely empty.
  if (counts.size === 0 && shuffledPart5.length > 0) {
    counts.set("PART5", Math.min(shuffledPart5.length, Math.max(3, Math.round(targetSeconds / AVG_SECONDS.PART5))));
  }

  const selectedQuestions = [
    ...shuffledPart1.slice(0, counts.get("PART1") ?? 0),
    ...shuffledPart2.slice(0, counts.get("PART2") ?? 0),
    ...shuffledPart5.slice(0, counts.get("PART5") ?? 0),
  ];
  const selectedVocab = [...shuffledDue.slice(0, counts.get("vocabReview") ?? 0), ...shuffledNew.slice(0, counts.get("vocabNew") ?? 0)];

  const [existingBookmarks, existingSavedWords] = await Promise.all([
    db.bookmark.findMany({
      where: { userId, type: "QUESTION", questionId: { in: selectedQuestions.map((q) => q.id) } },
      select: { questionId: true },
    }),
    db.savedWord.findMany({
      where: { userId, word: { in: selectedVocab.map((v) => ("vocabularyWord" in v ? v.vocabularyWord.word : v.word).toLowerCase()) } },
      select: { word: true },
    }),
  ]);
  const bookmarkedQuestionIds = new Set(existingBookmarks.map((b) => b.questionId));
  const savedWordSet = new Set(existingSavedWords.map((s) => s.word));

  const vocabItems: QuickStudyVocabItem[] = [
    ...shuffledDue.slice(0, counts.get("vocabReview") ?? 0).map(
      (d): QuickStudyVocabItem => ({
        type: "vocab",
        mode: "review",
        vocabularyWordId: d.vocabularyWord.id,
        word: d.vocabularyWord.word,
        ipa: d.vocabularyWord.ipa,
        meaningVi: d.vocabularyWord.meaningVi,
        exampleEn: d.vocabularyWord.exampleEn,
        audioUrlUs: d.vocabularyWord.audioUrlUs,
        saved: savedWordSet.has(d.vocabularyWord.word.toLowerCase()),
      })
    ),
    ...shuffledNew.slice(0, counts.get("vocabNew") ?? 0).map(
      (w): QuickStudyVocabItem => ({
        type: "vocab",
        mode: "new",
        vocabularyWordId: w.id,
        word: w.word,
        ipa: w.ipa,
        meaningVi: w.meaningVi,
        exampleEn: w.exampleEn,
        audioUrlUs: w.audioUrlUs,
        saved: savedWordSet.has(w.word.toLowerCase()),
      })
    ),
  ];

  function toQuestionItem(q: (typeof shuffledPart5)[number]): QuickStudyQuestionItem {
    return {
      type: "question",
      id: q.id,
      part: q.part as "PART1" | "PART2" | "PART5",
      prompt: q.prompt,
      imageUrl: q.imageUrl,
      audioUrl: q.audioUrl,
      options: q.options.map((o) => ({ label: o.label, content: o.content })),
      correctLabel: q.correctLabel,
      explanationVi: q.explanationVi,
      bookmarked: bookmarkedQuestionIds.has(q.id),
    };
  }

  const questionItems: QuickStudyQuestionItem[] = shuffle([
    ...shuffledPart1.slice(0, counts.get("PART1") ?? 0).map(toQuestionItem),
    ...shuffledPart2.slice(0, counts.get("PART2") ?? 0).map(toQuestionItem),
    ...shuffledPart5.slice(0, counts.get("PART5") ?? 0).map(toQuestionItem),
  ]);

  return interleaveByProportion(questionItems, vocabItems);
}

/** Distributes two lists proportionally through the whole sequence (e.g. a
 * vocab item every ~3 questions) instead of "half the questions, then a
 * block of vocab, then the rest" — so vocab and question variety both show
 * up early, not just after several minutes in. */
function interleaveByProportion<T, U>(a: T[], b: U[]): (T | U)[] {
  const result: (T | U)[] = [];
  let ai = 0;
  let bi = 0;
  while (ai < a.length || bi < b.length) {
    const aProgress = a.length > 0 ? ai / a.length : 1;
    const bProgress = b.length > 0 ? bi / b.length : 1;
    if (bi >= b.length || (ai < a.length && aProgress <= bProgress)) {
      result.push(a[ai++]);
    } else {
      result.push(b[bi++]);
    }
  }
  return result;
}
