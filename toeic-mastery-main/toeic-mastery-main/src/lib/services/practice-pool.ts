import "server-only";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import type { TestPart } from "@/generated/prisma/enums";
import { PART_META, FULL_TEST_DURATION_MINUTES, FULL_TEST_TOTAL_QUESTIONS } from "@/lib/constants/toeic";

const SEC_PER_QUESTION = (FULL_TEST_DURATION_MINUTES * 60) / FULL_TEST_TOTAL_QUESTIONS;

function poolSlug(part: TestPart): string {
  return `practice-pool-${part.toLowerCase()}`;
}

/**
 * The catch-all single-part Test that a published question lands in when no
 * specific Test is assigned. Without this, a published-but-unattached
 * question is invisible everywhere on the site — /listening|reading/part-N
 * only ever lists real Test rows (see getPartTests), so the question would
 * exist in the DB but never be reachable by a learner.
 */
export async function getOrCreatePracticePool(part: TestPart): Promise<{ testId: string; testSectionId: string }> {
  const slug = poolSlug(part);
  const existing = await db.test.findUnique({ where: { slug }, include: { sections: true } });
  if (existing) {
    const section = existing.sections.find((s) => s.part === part) ?? (await db.testSection.create({
      data: { testId: existing.id, part, title: PART_META[part].label, orderIndex: 0, questionCount: 0 },
    }));
    return { testId: existing.id, testSectionId: section.id };
  }

  const meta = PART_META[part];
  try {
    const test = await db.test.create({
      data: {
        slug,
        title: `Ngân hàng câu hỏi luyện tập — ${meta.label}`,
        description: "Các câu hỏi được thêm riêng lẻ (không gán vào đề thi cụ thể nào) sẽ tự động xuất hiện ở đây.",
        difficulty: "MEDIUM",
        status: "PUBLISHED",
        isFullTest: false,
        durationMinutes: 5,
        totalQuestions: 0,
        listeningQuestions: 0,
        readingQuestions: 0,
        allowReplay: true,
      },
    });
    const section = await db.testSection.create({
      data: { testId: test.id, part, title: meta.label, orderIndex: 0, questionCount: 0 },
    });
    return { testId: test.id, testSectionId: section.id };
  } catch (err) {
    // Concurrent creation for the same part raced us — the slug's unique
    // constraint caught it, so just use the one that won.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return getOrCreatePracticePool(part);
    }
    throw err;
  }
}

/**
 * Recomputes a practice pool's display counters (question totals, estimated
 * duration) from the questions actually attached to it. Recomputing from a
 * COUNT rather than incrementally tracking avoids drift across creates,
 * edits, and deletes — cheap at pool sizes (low hundreds per part).
 *
 * Only ever call this with a testId that is actually a practice pool (i.e.
 * one returned by getOrCreatePracticePool) — running it against a real,
 * admin-authored Test would stomp its intentionally-set duration/question
 * counts with a computed value.
 */
export async function syncPracticePoolCounters(testId: string, testSectionId: string, part: TestPart): Promise<void> {
  const count = await db.question.count({ where: { testId } });
  const isListening = PART_META[part].skill === "LISTENING";
  await Promise.all([
    db.test.update({
      where: { id: testId },
      data: {
        totalQuestions: count,
        listeningQuestions: isListening ? count : 0,
        readingQuestions: isListening ? 0 : count,
        durationMinutes: Math.max(5, Math.round((count * SEC_PER_QUESTION) / 60)),
      },
    }),
    db.testSection.update({ where: { id: testSectionId }, data: { questionCount: count } }),
  ]);
}

/**
 * Resyncs a test's counters ONLY if it's actually a practice pool — safe to
 * call after any question create/update/delete/import regardless of whether
 * that test was reached via auto-routing or an admin explicitly picking it
 * from the "Thuộc đề thi" dropdown (the pool shows up there like any other
 * Test, since nothing marks it as special to the UI). Skipping this check
 * and only syncing on the auto-routed path was the original bug: an admin
 * picking the pool explicitly, or a question moving/getting deleted out of
 * one, left totalQuestions/questionCount stuck at whatever they were after
 * the last auto-routed write.
 */
export async function syncIfPracticePool(testId: string | null | undefined, part: TestPart): Promise<void> {
  if (!testId) return;
  const test = await db.test.findUnique({
    where: { id: testId },
    select: { slug: true, sections: { where: { part }, select: { id: true } } },
  });
  if (!test || !test.slug.startsWith("practice-pool-")) return;
  const section = test.sections[0];
  if (!section) return;
  await syncPracticePoolCounters(testId, section.id, part);
}
