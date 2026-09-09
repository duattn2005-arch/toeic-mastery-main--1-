import "server-only";
import { db } from "@/lib/db";
import { initialSrsState } from "@/lib/services/spaced-repetition";

/**
 * Auto-enrolls the vocabulary a wrong Reading/Listening answer was actually
 * testing into the learner's existing SM-2 review queue (user_vocabulary) —
 * this *is* the "Vocab Ledger" from the SRD; there's no separate table for
 * it, it's the same one manual "save a word" already writes to, just tagged
 * `origin: AI_DETECTED_WEAKNESS` so the UI can badge it and the export route
 * can filter to it. Matches existing words by exact text within the topic
 * data set; a question's vocabularyFocus entries with no matching
 * VocabularyWord row are silently skipped (nothing to attach the SRS state
 * to) rather than inventing new word content.
 */
export async function flagWeakVocabFromAnswer(params: { userId: string; attemptAnswerId: string; questionId: string }): Promise<void> {
  const question = await db.question.findUnique({
    where: { id: params.questionId },
    select: { vocabularyFocus: true },
  });
  if (!question || question.vocabularyFocus.length === 0) return;

  const words = await db.vocabularyWord.findMany({
    where: { word: { in: question.vocabularyFocus, mode: "insensitive" } },
    select: { id: true },
  });
  if (words.length === 0) return;

  const srs = initialSrsState();

  for (const word of words) {
    const existing = await db.userVocabulary.findUnique({
      where: { userId_vocabularyWordId: { userId: params.userId, vocabularyWordId: word.id } },
      select: { id: true, origin: true },
    });

    if (existing) {
      // Already tracked (manually saved or from an earlier miss) — leave
      // its SRS state and origin alone, just don't overwrite a MANUAL save.
      continue;
    }

    await db.userVocabulary.create({
      data: {
        userId: params.userId,
        vocabularyWordId: word.id,
        repetitions: srs.repetitions,
        intervalDays: srs.intervalDays,
        easeFactor: srs.easeFactor,
        origin: "AI_DETECTED_WEAKNESS",
        sourceAttemptAnswerId: params.attemptAnswerId,
      },
    });
  }
}

/** Same enrollment, batched for every wrong answer in a just-submitted
 * attempt — called fire-and-forget from the submit route alongside
 * recordAttemptOutcomes. */
export async function flagWeakVocabFromAttempt(userId: string, attemptId: string): Promise<void> {
  const wrongAnswers = await db.attemptAnswer.findMany({
    where: { attemptId, isCorrect: false },
    select: { id: true, questionId: true },
  });

  for (const answer of wrongAnswers) {
    await flagWeakVocabFromAnswer({ userId, attemptAnswerId: answer.id, questionId: answer.questionId });
  }
}
