"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentProfile } from "@/lib/auth";

const reportSchema = z.object({
  questionId: z.string().uuid(),
  reason: z.string().min(3).max(120),
  message: z.string().max(1000).optional(),
});

export interface ActionResult {
  error?: string;
  ok?: boolean;
}

export async function reportQuestionAction(input: z.infer<typeof reportSchema>): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Vui lòng đăng nhập" };

  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  await db.questionReport.create({
    data: { userId: profile.id, questionId: parsed.data.questionId, reason: parsed.data.reason, message: parsed.data.message },
  });

  return { ok: true };
}
