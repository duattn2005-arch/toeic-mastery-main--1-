"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import {
  questionFormSchema,
  importPayloadSchema,
  type QuestionFormInput,
  type ImportQuestionInput,
} from "@/lib/validations/admin";
import type { TestPart } from "@/generated/prisma/enums";
import { getOrCreatePracticePool, syncIfPracticePool } from "@/lib/services/practice-pool";
import { deleteEmbeddings } from "@/lib/services/mentor/mentor-rag";
import { reserveQuestionOrderIndex } from "@/lib/services/question-order";

export interface ActionResult {
  error?: string;
  questionId?: string;
  imported?: number;
}

function splitList(value?: string): string[] {
  return (value ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export async function createQuestionAction(input: QuestionFormInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = questionFormSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  const data = parsed.data;

  // A published question with no explicit test would otherwise be invisible
  // everywhere on the site (nothing lists bare Questions, only Tests) — route
  // it into that part's practice pool so it's actually reachable. A draft
  // stays unattached; it gets routed at publish time instead (see
  // publishQuestionAction) so unfinished content never becomes practiceable.
  let testId = data.testId || null;
  let testSectionId: string | null = null;
  if (!testId && data.status === "PUBLISHED") {
    const pool = await getOrCreatePracticePool(data.part);
    testId = pool.testId;
    testSectionId = pool.testSectionId;
  }

  // Reserving a position within this part's own existing block (shifting
  // later questions aside) rather than defaulting to orderIndex 0 or
  // appending after the test's overall max — either of those is how a real,
  // live test's part sections previously ended up interleaved instead of
  // contiguous once content got added to it in more than one sitting.
  const question = await db.$transaction(async (tx) => {
    const orderIndex = await reserveQuestionOrderIndex(tx, testId, data.part);
    return tx.question.create({
      data: {
        testId,
        testSectionId,
        part: data.part,
        orderIndex,
        prompt: data.prompt || "",
        imageUrl: data.imageUrl || null,
        audioUrl: data.audioUrl || null,
        transcript: data.transcript || null,
        correctLabel: data.correctLabel,
        explanationVi: data.explanationVi,
        grammarTopicSlug: data.grammarTopicSlug || null,
        vocabularyFocus: splitList(data.vocabularyFocus),
        evidenceText: data.evidenceText || null,
        difficulty: data.difficulty,
        status: data.status,
        options: {
          create: data.options.map((o) => ({
            label: o.label,
            content: o.content,
            isCorrect: o.label === data.correctLabel,
            distractorExplanation: o.distractorExplanation || null,
          })),
        },
      },
    });
  });

  // Syncs regardless of whether testId came from auto-routing above or was
  // explicitly picked from the dropdown — see syncIfPracticePool's doc.
  await syncIfPracticePool(testId, data.part);

  revalidatePath("/admin/questions");
  redirect(`/admin/questions/${question.id}`);
}

export async function updateQuestionAction(questionId: string, input: QuestionFormInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = questionFormSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  const data = parsed.data;

  const existing = await db.question.findUniqueOrThrow({
    where: { id: questionId },
    select: { testId: true, testSectionId: true, part: true, orderIndex: true },
  });

  // Same pool-routing as createQuestionAction — otherwise clearing the test
  // field on an already-published question would silently orphan it again.
  // testSectionId only gets recomputed when testId actually changes; leaving
  // it alone otherwise means editing an unrelated field (e.g. explanation)
  // on an already-pooled question doesn't wipe its section link.
  let testId = data.testId || null;
  let testSectionId = testId === existing.testId ? existing.testSectionId : null;
  if (!testId && data.status === "PUBLISHED") {
    const pool = await getOrCreatePracticePool(data.part);
    testId = pool.testId;
    testSectionId = pool.testSectionId;
  }

  // Only reserve a fresh position when the question actually moved test or
  // part — its current orderIndex is presumably already correctly placed
  // within its existing part's block otherwise, and reserving a new one
  // unconditionally would needlessly shift unrelated questions on every
  // edit (even ones that only changed, say, the explanation text).
  const movedSection = testId !== existing.testId || data.part !== existing.part;

  await db.$transaction(async (tx) => {
    const orderIndex = movedSection ? await reserveQuestionOrderIndex(tx, testId, data.part) : existing.orderIndex;
    await tx.question.update({
      where: { id: questionId },
      data: {
        testId,
        testSectionId,
        part: data.part,
        orderIndex,
        prompt: data.prompt || "",
        imageUrl: data.imageUrl || null,
        audioUrl: data.audioUrl || null,
        transcript: data.transcript || null,
        correctLabel: data.correctLabel,
        explanationVi: data.explanationVi,
        grammarTopicSlug: data.grammarTopicSlug || null,
        vocabularyFocus: splitList(data.vocabularyFocus),
        evidenceText: data.evidenceText || null,
        difficulty: data.difficulty,
        status: data.status,
      },
    });
    await tx.questionOption.deleteMany({ where: { questionId } });
    await Promise.all(
      data.options.map((o) =>
        tx.questionOption.create({
          data: {
            questionId,
            label: o.label,
            content: o.content,
            isCorrect: o.label === data.correctLabel,
            distractorExplanation: o.distractorExplanation || null,
          },
        })
      )
    );
  });

  // Sync the question's new home (auto-routed or explicitly picked) and, if
  // it moved away from a different pool, that old one too — otherwise the
  // pool it left behind keeps showing a stale (too-high) question count.
  await syncIfPracticePool(testId, data.part);
  if (existing.testId && existing.testId !== testId) {
    await syncIfPracticePool(existing.testId, existing.part);
  }

  revalidatePath("/admin/questions");
  revalidatePath(`/admin/questions/${questionId}`);
  return { questionId };
}

export async function deleteQuestionAction(questionId: string): Promise<ActionResult> {
  await requireAdmin();
  const existing = await db.question.findUnique({ where: { id: questionId }, select: { testId: true, part: true } });
  await db.question.delete({ where: { id: questionId } });
  if (existing) await syncIfPracticePool(existing.testId, existing.part);
  // AI Mentor's RAG index would otherwise still cite this question's
  // explanation forever — never fails the delete itself.
  void deleteEmbeddings("QUESTION_EXPLANATION", questionId).catch((err) => console.error("deleteEmbeddings failed", err));
  revalidatePath("/admin/questions");
  return {};
}

function mapImportRow(row: ImportQuestionInput) {
  const partNumber = typeof row.part === "number" ? row.part : parseInt(String(row.part).replace(/\D/g, ""), 10);
  const part = `PART${partNumber}` as TestPart;
  const difficulty = (row.difficulty ?? "MEDIUM").toString().toUpperCase() as "EASY" | "MEDIUM" | "HARD";
  const labels = ["A", "B", "C", "D"] as const;

  return {
    part,
    prompt: row.question,
    correctLabel: row.correctAnswer,
    explanationVi: row.explanation,
    difficulty,
    audioUrl: row.audioUrl ?? null,
    imageUrl: row.imageUrl ?? null,
    transcript: row.transcript ?? null,
    grammarTopicSlug: row.grammarTopicSlug ?? null,
    testId: (row.testId || null) as string | null,
    testSectionId: null as string | null,
    orderIndex: 0,
    status: row.status ?? "DRAFT",
    options: row.options.map((content, i) => ({
      label: labels[i],
      content,
      isCorrect: labels[i] === row.correctAnswer,
    })),
  };
}

export async function importQuestionsAction(rawJson: string): Promise<ActionResult> {
  await requireAdmin();

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawJson);
  } catch {
    return { error: "JSON không hợp lệ" };
  }

  const parsed = importPayloadSchema.safeParse(parsedJson);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu import không đúng định dạng" };

  const rows = Array.isArray(parsed.data) ? parsed.data : [parsed.data];
  const mapped = rows.map(mapImportRow);

  // Published rows with no explicit test would otherwise be invisible on the
  // site (see createQuestionAction) — resolve each part's practice pool once
  // (not per-row, to avoid racing duplicate pool creation) and route those
  // rows into it. Drafts stay unattached until published.
  const poolsByPart = new Map<TestPart, { testId: string; testSectionId: string }>();
  for (const q of mapped) {
    if (!q.testId && q.status === "PUBLISHED" && !poolsByPart.has(q.part)) {
      poolsByPart.set(q.part, await getOrCreatePracticePool(q.part));
    }
  }
  for (const q of mapped) {
    if (!q.testId && q.status === "PUBLISHED") {
      const pool = poolsByPart.get(q.part)!;
      q.testId = pool.testId;
      q.testSectionId = pool.testSectionId;
    }
  }

  // Reserve each (testId, part) group's own contiguous block of orderIndex
  // values — same fix as createQuestionAction/createQuestionGroupAction.
  // This importer used to leave orderIndex at its schema default (0) for
  // every row, so a test built from more than one pasted batch had every
  // row tie at 0 and came back in whatever order Postgres happened to
  // return them (in practice, close to insertion order) instead of grouped
  // by part — exactly the interleaved Part 4/5/6 ordering this was meant to
  // fix. Reservations run sequentially per group (reserveQuestionOrderIndex
  // reads-then-mutates a test's rows, so two groups sharing a testId can't
  // safely run concurrently); the actual creates below stay parallel.
  const groups = new Map<string, (typeof mapped)[number][]>();
  for (const q of mapped) {
    const key = `${q.testId ?? "none"}::${q.part}`;
    const bucket = groups.get(key);
    if (bucket) bucket.push(q);
    else groups.set(key, [q]);
  }
  for (const rows of groups.values()) {
    const { testId, part } = rows[0];
    if (!testId) continue; // unattached drafts have nothing to order against
    const baseOrder = await db.$transaction((tx) => reserveQuestionOrderIndex(tx, testId, part, rows.length));
    rows.forEach((q, i) => {
      q.orderIndex = baseOrder + i;
    });
  }

  // Run outside a $transaction: each question is an independent create (no
  // cross-row atomicity requirement), and batching many of them inside one
  // Prisma transaction reliably blows the default 5s interactive-transaction
  // timeout (P2028) once there are more than a handful — exactly the
  // "paste 15-20 questions at once" workflow this importer exists for. Same
  // fix already applied to attempt submission earlier for the same reason.
  await Promise.all(
    mapped.map((q) =>
      db.question.create({
        data: {
          testId: q.testId,
          testSectionId: q.testSectionId,
          part: q.part,
          orderIndex: q.orderIndex,
          prompt: q.prompt,
          correctLabel: q.correctLabel,
          explanationVi: q.explanationVi,
          difficulty: q.difficulty,
          audioUrl: q.audioUrl,
          imageUrl: q.imageUrl,
          transcript: q.transcript,
          grammarTopicSlug: q.grammarTopicSlug,
          status: q.status,
          options: { create: q.options },
        },
      })
    )
  );

  // Resync every pool this batch actually touched — including rows that had
  // an explicit testId pointing at a pool (an admin can pick it from the
  // "Thuộc đề thi" dropdown like any other test), not just the auto-routed
  // ones tracked in poolsByPart. syncIfPracticePool no-ops for a real,
  // non-pool test, so this is safe to call for every distinct testId.
  const testIdsTouched = new Map<string, TestPart>();
  for (const q of mapped) {
    if (q.testId) testIdsTouched.set(q.testId, q.part);
  }
  await Promise.all(Array.from(testIdsTouched.entries()).map(([testId, part]) => syncIfPracticePool(testId, part)));

  revalidatePath("/admin/questions");
  if (mapped.some((q) => q.testId)) revalidatePath("/admin/tests");
  return { imported: mapped.length };
}

export async function publishQuestionAction(questionId: string): Promise<ActionResult> {
  await requireAdmin();
  const question = await db.question.findUniqueOrThrow({ where: { id: questionId }, select: { testId: true, part: true } });

  let testId = question.testId;
  if (!testId) {
    // Becoming published is exactly the moment an unattached question needs
    // to become reachable — route it into its part's practice pool now.
    const pool = await getOrCreatePracticePool(question.part);
    testId = pool.testId;
    await db.question.update({
      where: { id: questionId },
      data: { status: "PUBLISHED", testId: pool.testId, testSectionId: pool.testSectionId },
    });
  } else {
    await db.question.update({ where: { id: questionId }, data: { status: "PUBLISHED" } });
  }
  // Covers both branches: a fresh auto-routed pool, or a question that
  // already explicitly pointed at a pool test before being published.
  await syncIfPracticePool(testId, question.part);

  revalidatePath("/admin/questions");
  return {};
}
