"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { testFormSchema, type TestFormInput } from "@/lib/validations/admin";
import { PART_META } from "@/lib/constants/toeic";
import type { TestPart } from "@/generated/prisma/enums";

export interface ActionResult {
  error?: string;
  testId?: string;
}

export async function createTestAction(input: TestFormInput): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = testFormSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  const data = parsed.data;
  const totalQuestions = data.isFullTest ? data.listeningQuestions + data.readingQuestions : data.listeningQuestions + data.readingQuestions;

  const test = await db.test.create({
    data: {
      title: data.title,
      slug: data.slug,
      description: data.description || null,
      thumbnailUrl: data.thumbnailUrl || null,
      difficulty: data.difficulty,
      status: data.status,
      isFullTest: data.isFullTest,
      durationMinutes: data.durationMinutes,
      listeningQuestions: data.listeningQuestions,
      readingQuestions: data.readingQuestions,
      totalQuestions,
      allowReplay: data.allowReplay,
      createdById: admin.id,
    },
  });

  if (data.isFullTest) {
    const sectionDefaults: { part: TestPart; count: number }[] = [
      { part: "PART1", count: 6 },
      { part: "PART2", count: 25 },
      { part: "PART3", count: 39 },
      { part: "PART4", count: 30 },
      { part: "PART5", count: 30 },
      { part: "PART6", count: 16 },
      { part: "PART7", count: 54 },
    ];
    await db.testSection.createMany({
      data: sectionDefaults.map((s, i) => ({
        testId: test.id,
        part: s.part,
        title: PART_META[s.part].label,
        orderIndex: i,
        questionCount: s.count,
      })),
    });
  }

  revalidatePath("/admin/tests");
  redirect(`/admin/tests/${test.id}`);
}

export async function updateTestAction(testId: string, input: TestFormInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = testFormSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  const data = parsed.data;
  await db.test.update({
    where: { id: testId },
    data: {
      title: data.title,
      slug: data.slug,
      description: data.description || null,
      thumbnailUrl: data.thumbnailUrl || null,
      difficulty: data.difficulty,
      status: data.status,
      isFullTest: data.isFullTest,
      durationMinutes: data.durationMinutes,
      listeningQuestions: data.listeningQuestions,
      readingQuestions: data.readingQuestions,
      totalQuestions: data.listeningQuestions + data.readingQuestions,
      allowReplay: data.allowReplay,
    },
  });

  revalidatePath("/admin/tests");
  revalidatePath(`/admin/tests/${testId}`);
  return { testId };
}

export async function publishTestAction(testId: string): Promise<ActionResult> {
  await requireAdmin();
  await db.test.update({ where: { id: testId }, data: { status: "PUBLISHED" } });
  revalidatePath("/admin/tests");
  return {};
}

export async function deleteTestAction(testId: string): Promise<ActionResult> {
  await requireAdmin();

  // Practice pools (see src/lib/services/practice-pool.ts) hold every
  // published question that was added without an explicit test — deleting
  // one would cascade-delete all of those questions, not just an empty
  // container. Block it; admins should reassign/delete questions instead.
  const test = await db.test.findUnique({ where: { id: testId }, select: { slug: true } });
  if (test?.slug.startsWith("practice-pool-")) {
    return { error: "Đây là ngân hàng câu hỏi luyện tập tự động — xóa nó sẽ xóa luôn toàn bộ câu hỏi bên trong. Hãy xóa/di chuyển từng câu hỏi thay vì xóa đề này." };
  }

  await db.test.delete({ where: { id: testId } });
  revalidatePath("/admin/tests");
  return {};
}
