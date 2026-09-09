import "server-only";
import { db } from "@/lib/db";
import { PART_META } from "@/lib/constants/toeic";
import { getWeakestDimensions } from "./skill-mastery";
import { searchRelevantContent, type RetrievedChunk } from "./mentor-rag";
import type { MentorChatMessage } from "./llm-client";
import type { TestPart } from "@/generated/prisma/enums";

export interface MentorContextInput {
  userId: string;
  conversationId: string;
  questionId?: string | null;
  attemptId?: string | null;
  /** Latest user turn — used as the RAG query, not stored again here (the
   * caller already persisted it as a MentorMessage before calling this). */
  latestUserMessage: string;
}

export interface MentorContext {
  systemPrompt: string;
  /** Prior turns, oldest first, ready to hand to streamMentorReply
   * alongside the new user turn. */
  history: MentorChatMessage[];
}

const HISTORY_WINDOW = 10;
const RAG_TOP_K = 5;

/**
 * Assembles everything one chat turn needs: student profile + goal, weak
 * SkillMastery dimensions, today's LearningPathDay, the long-term
 * MentorMemory summary, the question the conversation may have opened
 * from, and RAG chunks relevant to what the learner just asked. RAG is
 * best-effort — an embeddings-provider outage degrades the mentor to
 * "no citations" rather than failing the whole turn.
 */
export async function buildMentorContext(input: MentorContextInput): Promise<MentorContext> {
  const [profile, weakDimensions, memory, recentMessages, originQuestion, todayDay, ragChunks] = await Promise.all([
    db.profile.findUniqueOrThrow({
      where: { id: input.userId },
      select: { currentScore: true, targetScore: true, examDate: true },
    }),
    getWeakestDimensions(input.userId, 5),
    db.mentorMemory.findUnique({ where: { userId: input.userId }, select: { summary: true } }),
    db.mentorMessage.findMany({
      where: { conversationId: input.conversationId, role: { not: "SYSTEM" } },
      orderBy: { createdAt: "desc" },
      take: HISTORY_WINDOW,
      select: { role: true, content: true },
    }),
    input.questionId
      ? db.question.findUnique({
          where: { id: input.questionId },
          select: {
            prompt: true,
            part: true,
            correctLabel: true,
            explanationVi: true,
            evidenceText: true,
            options: { select: { label: true, content: true } },
          },
        })
      : Promise.resolve(null),
    db.learningPathDay.findFirst({
      where: {
        path: { userId: input.userId, status: "ACTIVE" },
        scheduledDate: { lte: new Date() },
        status: { in: ["UNLOCKED", "IN_PROGRESS"] },
      },
      orderBy: { dayNumber: "desc" },
      select: { dayNumber: true, focusParts: true, summary: true },
    }),
    searchRelevantContent(input.latestUserMessage, RAG_TOP_K).catch((): RetrievedChunk[] => []),
  ]);

  const selectedAnswer =
    input.attemptId && input.questionId
      ? await db.attemptAnswer.findUnique({
          where: { attemptId_questionId: { attemptId: input.attemptId, questionId: input.questionId } },
          select: { selectedLabel: true, isCorrect: true },
        })
      : null;

  const partLabel = (part: TestPart) => PART_META[part].shortLabel;

  const lines: string[] = [
    "Bạn là AI Mentor của TOEIC Mastery — một giáo viên TOEIC ảo luôn hoạt động như một chatbot bình thường: trả lời MỌI câu hỏi học viên đưa ra (ngữ pháp, từ vựng, chiến thuật làm bài, cách học, tâm lý ôn thi, hay bất cứ điều gì khác), không giới hạn riêng một câu hỏi cụ thể nào. Nói tiếng Việt, giải thích rõ ràng, ngắn gọn, khích lệ người học.",
    "Bạn chủ động theo dõi tiến độ, điểm yếu và lộ trình học của học viên (xem phần hồ sơ/điểm yếu/lộ trình bên dưới, được cập nhật hằng ngày từ dữ liệu luyện tập thật) để đề xuất bước học tiếp theo phù hợp với mục tiêu của họ — không chỉ chờ được hỏi mới gợi ý.",
    'QUAN TRỌNG: Không tự đặt ra câu hỏi TOEIC hay đáp án mới, không tự liệt kê danh sách câu hỏi trong câu trả lời. Khi cần trích dẫn kiến thức, chỉ dùng nội dung trong "Tài liệu liên quan" dưới đây.',
    "Khi (và chỉ khi) bạn thấy nên cho học viên làm một bài kiểm tra nhanh để xác nhận đã hiểu, kết thúc toàn bộ câu trả lời bằng đúng MỘT dòng theo định dạng sau, không thêm gì sau đó: [[RECOMMEND_TEST:PART:PART5]] (thay PART5 bằng Part liên quan) hoặc [[RECOMMEND_TEST:GRAMMAR_TOPIC:slug-chu-de]] (thay bằng đúng dimensionKey điểm yếu được liệt kê bên dưới). Hệ thống sẽ tự chọn câu hỏi thật từ ngân hàng đề đã được admin duyệt — bạn không cần và không được tự soạn câu hỏi.",
    "Khi học viên hỏi kiểu \"tiếp theo tôi nên học gì\", \"hôm nay nên học gì\", hoặc bất cứ lúc nào bạn thấy nên đề xuất bước đi tiếp theo trong lộ trình cá nhân hóa của họ, kết thúc toàn bộ câu trả lời bằng đúng MỘT dòng, không thêm gì sau đó: [[RECOMMEND_NEXT_STEPS]]. Hệ thống sẽ tự chọn gợi ý cụ thể dựa trên dữ liệu thật của học viên (có thể bị giới hạn số lần/ngày với tài khoản Free) — bạn không cần tự liệt kê danh sách bài học, chỉ cần chèn đúng dòng marker này.",
    "",
    `Hồ sơ học viên: điểm hiện tại ${profile.currentScore ?? "chưa có"}, mục tiêu ${profile.targetScore ?? "chưa đặt"}, ngày thi ${
      profile.examDate ? profile.examDate.toISOString().slice(0, 10) : "chưa đặt"
    }.`,
  ];

  if (memory?.summary) {
    lines.push(`Trí nhớ dài hạn (tóm tắt các lần trao đổi trước): ${memory.summary}`);
  }

  if (todayDay) {
    lines.push(
      `Lộ trình hôm nay: Ngày ${todayDay.dayNumber}, trọng tâm ${todayDay.focusParts.map(partLabel).join(", ") || "chưa xác định"}.${
        todayDay.summary ? ` ${todayDay.summary}` : ""
      }`
    );
  }

  if (weakDimensions.length > 0) {
    const weakList = weakDimensions
      .map((d) => {
        const label = d.dimensionType === "PART" ? partLabel(d.dimensionKey as TestPart) : d.dimensionKey;
        return `${label} (${Math.round(d.masteryScore * 100)}% đúng / ${d.attemptedCount} câu)`;
      })
      .join("; ");
    lines.push(`Điểm yếu hiện tại: ${weakList}`);
  }

  if (originQuestion) {
    lines.push(
      "",
      "Câu hỏi học viên đang hỏi:",
      `Part: ${PART_META[originQuestion.part].label}`,
      `Đề bài: ${originQuestion.prompt}`,
      `Các lựa chọn: ${originQuestion.options.map((o) => `${o.label}. ${o.content}`).join(" | ")}`,
      `Đáp án đúng: ${originQuestion.correctLabel}`,
      ...(selectedAnswer
        ? [`Học viên đã chọn: ${selectedAnswer.selectedLabel ?? "(bỏ qua)"} — ${selectedAnswer.isCorrect ? "ĐÚNG" : "SAI"}`]
        : []),
      `Giải thích chuẩn: ${originQuestion.explanationVi}`,
      ...(originQuestion.evidenceText ? [`Bằng chứng trong bài: ${originQuestion.evidenceText}`] : [])
    );
  }

  if (ragChunks.length > 0) {
    lines.push("", "Tài liệu liên quan (dùng để trích dẫn, không tự bịa thêm ngoài đây):");
    for (const chunk of ragChunks) {
      lines.push(`- [${chunk.sourceType}] ${chunk.content.slice(0, 500)}`);
    }
  }

  const history: MentorChatMessage[] = [...recentMessages]
    .reverse()
    .map((m) => ({ role: m.role === "ASSISTANT" ? ("assistant" as const) : ("user" as const), content: m.content }));

  return { systemPrompt: lines.filter(Boolean).join("\n"), history };
}
