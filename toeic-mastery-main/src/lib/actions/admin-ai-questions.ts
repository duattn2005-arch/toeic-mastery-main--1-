"use server";

import { requireAdmin } from "@/lib/auth";
import { importQuestionsAction } from "./admin-questions";
import { createQuestionGroupAction } from "./admin-passages";
import {
  generateVerifiedUngroupedQuestions,
  generateVerifiedGroups,
  isUngroupedGenerationPart,
  isGroupedGenerationPart,
} from "@/lib/services/admin/ai-question-generator";
import type { Difficulty, TestPart } from "@/generated/prisma/enums";

export interface AiGenerateResult {
  error?: string;
  attempted?: number;
  saved?: number;
}

/**
 * Generates + self-verifies AI questions for one Part, then hands the
 * verified rows to the SAME persistence paths a human admin uses
 * (importQuestionsAction / createQuestionGroupAction) — so order-index
 * reservation, practice-pool routing, and every other side effect of
 * "an admin added a question" stays identical regardless of who authored
 * the content. Everything lands as DRAFT; nothing here ever publishes.
 */
export async function generateAiQuestionsAction(part: TestPart, difficulty: Difficulty, count: number): Promise<AiGenerateResult> {
  await requireAdmin();

  if (part === "PART1") {
    return { error: "Part 1 (Mô tả tranh) cần ảnh thật — AI không tự tạo ảnh được, vui lòng soạn thủ công cho Part này." };
  }

  try {
    if (isUngroupedGenerationPart(part)) {
      const { attempted, rows } = await generateVerifiedUngroupedQuestions(part, difficulty, count);
      if (rows.length === 0) return { attempted, saved: 0, error: "Không có câu nào vượt qua bước AI tự xác thực — thử sinh lại." };
      const imported = await importQuestionsAction(JSON.stringify(rows));
      if (imported.error) return { attempted, error: imported.error };
      return { attempted, saved: rows.length };
    }

    if (isGroupedGenerationPart(part)) {
      const { attempted, groups } = await generateVerifiedGroups(part, difficulty, count);
      if (groups.length === 0) return { attempted, saved: 0, error: "Không có nhóm câu hỏi nào vượt qua bước AI tự xác thực — thử sinh lại." };

      let saved = 0;
      const errors: string[] = [];
      for (const group of groups) {
        const result = await createQuestionGroupAction(group);
        if (result.error) errors.push(result.error);
        else saved += group.questions.length;
      }
      if (saved === 0) return { attempted, saved: 0, error: errors[0] ?? "Không lưu được nhóm câu hỏi nào." };
      return { attempted, saved };
    }

    return { error: "Part không được hỗ trợ." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Sinh câu hỏi bằng AI thất bại." };
  }
}
