import "server-only";
import type { TestPart } from "@/generated/prisma/enums";
import type { PrismaClient } from "@/generated/prisma/client";
import { TEST_PART_VALUES } from "@/lib/validations/admin";

const PART_RANK: Record<TestPart, number> = Object.fromEntries(TEST_PART_VALUES.map((p, i) => [p, i])) as Record<TestPart, number>;

// Extracted from $transaction's own callback signature rather than a named
// `Prisma.TransactionClient` export, since this codebase's Prisma 7
// driver-adapter generated client doesn't expose one under that name.
type Tx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

/**
 * Computes the orderIndex to insert `count` new consecutive questions of
 * `part` into `testId`, shifting existing rows aside to make room — must
 * run inside the same transaction as the actual question create(s), since
 * it reads current positions then mutates them.
 *
 * Naively appending after the test's current max orderIndex (what both
 * createQuestionAction and createQuestionGroupAction did before this) is
 * exactly what caused a real, live test's Part 3/4/5/6/7 blocks to
 * interleave instead of forming clean per-part sections: a second content
 * batch added later for parts that already existed landed after every
 * later part's block too, not merged back into its own part's range (fixed
 * once via a one-time data repair; this prevents new admin additions from
 * reproducing it).
 */
export async function reserveQuestionOrderIndex(tx: Tx, testId: string | null, part: TestPart, count = 1): Promise<number> {
  if (!testId) return 0;

  const existing = await tx.question.findMany({ where: { testId }, select: { part: true, orderIndex: true } });
  if (existing.length === 0) return 0;

  const samePart = existing.filter((q) => q.part === part);
  let insertAt: number;
  if (samePart.length > 0) {
    // Insert right after this part's own last question.
    insertAt = Math.max(...samePart.map((q) => q.orderIndex)) + 1;
  } else {
    // No question of this part yet — insert right before the first question
    // of the next-higher-ranked part that already exists, or at the very
    // end if this is the highest-ranked part present so far.
    const laterParts = existing.filter((q) => PART_RANK[q.part] > PART_RANK[part]);
    insertAt = laterParts.length > 0 ? Math.min(...laterParts.map((q) => q.orderIndex)) : Math.max(...existing.map((q) => q.orderIndex)) + 1;
  }

  await tx.question.updateMany({ where: { testId, orderIndex: { gte: insertAt } }, data: { orderIndex: { increment: count } } });
  return insertAt;
}
