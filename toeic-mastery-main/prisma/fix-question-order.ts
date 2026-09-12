/**
 * One-time repair for tests whose Part 1-7 blocks got interleaved by the
 * orderIndex bug described in src/lib/services/question-order.ts (naive
 * append-at-max-orderIndex let a later content batch land after every
 * later part's block instead of merging into its own part's range).
 *
 * Re-sorts each test's questions by (part rank, existing orderIndex) —
 * this reconstructs the intended order because that bug only ever shifted
 * whole blocks around, it never scrambled relative order within a part —
 * then reassigns orderIndex 0..N-1 to match.
 *
 * Usage: npm run db:fix-question-order
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { TEST_PART_VALUES } from "../src/lib/validations/admin";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const PART_RANK: Record<string, number> = Object.fromEntries(TEST_PART_VALUES.map((p, i) => [p, i]));

async function main() {
  const questions = await db.question.findMany({
    where: { testId: { not: null } },
    select: { id: true, testId: true, part: true, orderIndex: true },
  });

  const byTest = new Map<string, typeof questions>();
  for (const q of questions) {
    const list = byTest.get(q.testId as string);
    if (list) list.push(q);
    else byTest.set(q.testId as string, [q]);
  }

  let testsFixed = 0;
  let questionsFixed = 0;

  for (const [testId, list] of byTest) {
    const sorted = [...list].sort((a, b) => PART_RANK[a.part] - PART_RANK[b.part] || a.orderIndex - b.orderIndex);

    const updates = sorted.flatMap((q, i) => (q.orderIndex === i ? [] : [{ id: q.id, orderIndex: i }]));
    if (updates.length === 0) continue;

    await db.$transaction(updates.map((u) => db.question.update({ where: { id: u.id }, data: { orderIndex: u.orderIndex } })));

    testsFixed++;
    questionsFixed += updates.length;
    console.log(`Test ${testId}: reordered ${updates.length} question(s)`);
  }

  console.log(`Done. Fixed ${questionsFixed} question(s) across ${testsFixed} test(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
