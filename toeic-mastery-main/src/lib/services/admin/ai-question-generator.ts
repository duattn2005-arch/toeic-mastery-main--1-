import "server-only";
import { completeMentorTask } from "@/lib/services/mentor/llm-client";
import type { ImportQuestionInput, GroupQuestionFormInput, QuestionGroupFormInput } from "@/lib/validations/admin";
import type { Difficulty, TestPart } from "@/generated/prisma/enums";

/**
 * AI-assisted content authoring for the admin question bank (see the AI
 * Mentor's own question-generation request — this is a separate, admin-only
 * feature, not something the mentor chat triggers). PART1 is deliberately
 * unsupported: it needs a real photo, which this can't fabricate — the
 * caller (admin-ai-questions.ts) rejects it before ever reaching here.
 *
 * Every question this produces is independently RE-SOLVED by a second,
 * separate LLM call that never sees the first call's claimed answer (see
 * verifyQuestion) — only questions where both calls agree survive, and
 * everything that does still lands as ContentStatus.DRAFT, never
 * PUBLISHED directly. Self-verification catches "the model contradicted
 * itself," not "the model is subtly wrong in a way it consistently
 * believes" — an admin still reviews every row before it's practiceable.
 */

const UNGROUPED_PARTS = ["PART2", "PART5"] as const;
const GROUPED_PARTS = ["PART3", "PART4", "PART6", "PART7"] as const;
export type UngroupedGenerationPart = (typeof UNGROUPED_PARTS)[number];
export type GroupedGenerationPart = (typeof GROUPED_PARTS)[number];

export function isUngroupedGenerationPart(part: TestPart): part is UngroupedGenerationPart {
  return (UNGROUPED_PARTS as readonly string[]).includes(part);
}
export function isGroupedGenerationPart(part: TestPart): part is GroupedGenerationPart {
  return (GROUPED_PARTS as readonly string[]).includes(part);
}

const OPTION_LABELS = ["A", "B", "C", "D"] as const;

interface GeneratedSingleQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  grammarTopicSlug?: string;
}

/** Strips a ```json fence if the model added one despite being told not to,
 * then parses — throws with a truncated preview of the raw text on failure
 * so a bad generation shows up as a clear error instead of a silent crash. */
function extractJson<T>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    throw new Error(`AI trả về JSON không hợp lệ (${(err as Error).message}). Nội dung nhận được: ${cleaned.slice(0, 300)}`);
  }
}

const GENERATOR_SYSTEM_PROMPT =
  "Bạn là chuyên gia biên soạn đề thi TOEIC chuẩn ETS, kinh nghiệm lâu năm. Chỉ trả lời bằng đúng JSON hợp lệ được yêu cầu — không thêm markdown, không thêm giải thích ngoài JSON, không thêm chú thích.";

async function generateUngroupedBatch(part: UngroupedGenerationPart, difficulty: Difficulty, count: number): Promise<GeneratedSingleQuestion[]> {
  const optionCount = part === "PART2" ? 3 : 4;
  const partDesc =
    part === "PART2"
      ? 'Part 2 (Hỏi-Đáp): một câu hỏi hoặc câu nói ngắn được phát qua audio, người nghe chọn 1 trong 3 câu trả lời phù hợp nhất. "question" là transcript câu hỏi/câu nói gốc; "options" là đúng 3 câu trả lời khả dĩ.'
      : 'Part 5 (Câu chưa hoàn chỉnh): một câu tiếng Anh có đúng 1 chỗ trống (đánh dấu bằng "______"), 4 lựa chọn từ/cụm từ để điền vào, kiểm tra ngữ pháp hoặc từ vựng.';

  const prompt = `Soạn ${count} câu hỏi TOEIC ${partDesc}
Độ khó: ${difficulty} — phải thực sự khó ở mức đó, không phải mức cơ bản dễ đoán.
Yêu cầu:
- Tiếng Anh tự nhiên, đúng văn phong TOEIC thực tế (bối cảnh công sở, thương mại, du lịch...).
- Đúng ${optionCount} lựa chọn mỗi câu, chỉ 1 đáp án đúng, các lựa chọn còn lại là bẫy hợp lý (cùng loại từ/cấu trúc dễ nhầm, không phải sai rõ ràng).
- "explanation" viết bằng tiếng Việt, ngắn gọn, giải thích vì sao đáp án đúng và vì sao ít nhất 1 lựa chọn khác sai.
- ${count} câu không được trùng ý tưởng/chủ đề với nhau.
${part === "PART5" ? '- "grammarTopicSlug": bỏ qua nếu không chắc, hoặc điền 1 slug ngắn không dấu mô tả điểm ngữ pháp (ví dụ "subject-verb-agreement").' : ""}

Trả về CHÍNH XÁC một mảng JSON, không có gì khác:
[
  {
    "question": "...",
    "options": [${Array.from({ length: optionCount }, () => '"..."').join(", ")}],
    "correctAnswer": "A",
    "explanation": "..."${part === "PART5" ? ',\n    "grammarTopicSlug": "..."' : ""}
  }
]`;

  const raw = await completeMentorTask({
    system: GENERATOR_SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
    maxTokens: Math.min(8000, 500 + count * 450),
  });
  const parsed = extractJson<GeneratedSingleQuestion[]>(raw);
  if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("AI không trả về một mảng câu hỏi hợp lệ.");
  return parsed;
}

const GROUP_FORMAT: Record<GroupedGenerationPart, string> = {
  PART3: "CONVERSATION",
  PART4: "TALK",
  PART6: "ARTICLE",
  PART7: "ARTICLE",
};
/** Real TOEIC groups vary (Part 7 SINGLE passages run 2-4 questions,
 * DOUBLE/TRIPLE more) — fixed at a plausible middle count per part rather
 * than modeling every layout, since every row still goes through admin
 * review before publishing. */
const QUESTIONS_PER_GROUP: Record<GroupedGenerationPart, number> = { PART3: 3, PART4: 3, PART6: 4, PART7: 4 };

interface GeneratedGroup {
  transcript?: string;
  text?: string;
  questions: GeneratedSingleQuestion[];
}

async function generateOneGroup(part: GroupedGenerationPart, difficulty: Difficulty): Promise<GeneratedGroup> {
  const n = QUESTIONS_PER_GROUP[part];
  const isAudio = part === "PART3" || part === "PART4";
  const kindDesc =
    part === "PART3"
      ? 'Part 3 (Đoạn hội thoại): một đoạn hội thoại ngắn giữa 2-3 người, mỗi lượt nói ghi rõ người nói (vd "Man:", "Woman:", "Man 2:").'
      : part === "PART4"
        ? "Part 4 (Bài nói ngắn): một bài nói độc thoại ngắn (thông báo nội bộ, quảng cáo, hướng dẫn, bản tin...)."
        : part === "PART6"
          ? `Part 6 (Hoàn thành đoạn văn): một văn bản (email/thông báo/bài viết ngắn...) có đúng ${n} chỗ trống đánh số liên tiếp dạng "______(1)______" đến "______(${n})______", mỗi chỗ trống ứng với đúng 1 câu hỏi chọn từ/cụm từ/câu điền vào.`
          : "Part 7 (Đọc hiểu): một văn bản độc lập (email/thông báo/bài viết/quảng cáo/lịch trình...).";

  const prompt = `Soạn 1 bộ đề TOEIC — ${kindDesc}
Độ khó: ${difficulty} — thực sự khó ở mức đó.
Kèm đúng ${n} câu hỏi trắc nghiệm 4 lựa chọn (chỉ 1 đáp án đúng mỗi câu) gắn với ${isAudio ? "đoạn hội thoại/bài nói" : "văn bản"} này.
"explanation" mỗi câu viết bằng tiếng Việt.

Trả về CHÍNH XÁC một object JSON, không có gì khác:
{
  ${isAudio ? '"transcript": "toàn bộ lời thoại/bài nói, xuống dòng giữa các lượt nói"' : '"text": "toàn bộ nội dung văn bản"'},
  "questions": [
    { "question": "...", "options": ["...", "...", "...", "..."], "correctAnswer": "A", "explanation": "..." }
  ]
}
Mảng "questions" phải có đúng ${n} phần tử.`;

  const raw = await completeMentorTask({ system: GENERATOR_SYSTEM_PROMPT, messages: [{ role: "user", content: prompt }], maxTokens: 3500 });
  const parsed = extractJson<{ transcript?: string; text?: string; questions: GeneratedSingleQuestion[] }>(raw);
  if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) throw new Error("AI không trả về danh sách câu hỏi hợp lệ cho nhóm này.");
  return { transcript: parsed.transcript, text: parsed.text, questions: parsed.questions };
}

/**
 * Independently re-solves one question — given only the passage/prompt and
 * options, never the first call's claimed answer or explanation — and
 * reports whether it agrees. An unparseable verification response counts
 * as disagreement (fail closed: an unverifiable question doesn't get
 * saved, rather than assuming it's fine).
 */
async function verifyQuestion(context: string, q: GeneratedSingleQuestion): Promise<boolean> {
  const optionsList = q.options.map((opt, i) => `${OPTION_LABELS[i]}. ${opt}`).join("\n");
  const prompt = `${context ? `${context}\n\n` : ""}Câu hỏi: ${q.question}
${optionsList}

Tự giải câu này một cách độc lập và khách quan, không được đoán mò. Trả về CHÍNH XÁC JSON, không có gì khác:
{"answer": "A", "reasoning": "..."}`;

  const raw = await completeMentorTask({
    system: "Bạn là chuyên gia TOEIC làm bài kiểm tra chất lượng, độc lập với người ra đề. Chỉ trả lời bằng đúng JSON được yêu cầu.",
    messages: [{ role: "user", content: prompt }],
    maxTokens: 300,
  });
  try {
    const parsed = extractJson<{ answer: string }>(raw);
    return parsed.answer?.trim().toUpperCase() === q.correctAnswer.trim().toUpperCase();
  } catch {
    return false;
  }
}

export interface UngroupedGenerationResult {
  attempted: number;
  rows: ImportQuestionInput[];
}

export async function generateVerifiedUngroupedQuestions(
  part: UngroupedGenerationPart,
  difficulty: Difficulty,
  count: number
): Promise<UngroupedGenerationResult> {
  const batch = await generateUngroupedBatch(part, difficulty, count);
  const rows: ImportQuestionInput[] = [];

  for (const q of batch) {
    if (!(await verifyQuestion("", q))) continue;
    rows.push({
      part,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer as ImportQuestionInput["correctAnswer"],
      explanation: q.explanation,
      difficulty,
      grammarTopicSlug: q.grammarTopicSlug || undefined,
      status: "DRAFT",
    });
  }

  return { attempted: batch.length, rows };
}

export interface GroupedGenerationResult {
  attempted: number;
  groups: QuestionGroupFormInput[];
}

export async function generateVerifiedGroups(
  part: GroupedGenerationPart,
  difficulty: Difficulty,
  groupCount: number
): Promise<GroupedGenerationResult> {
  const isAudio = part === "PART3" || part === "PART4";
  const groups: QuestionGroupFormInput[] = [];
  let attempted = 0;

  for (let i = 0; i < groupCount; i++) {
    const generated = await generateOneGroup(part, difficulty);
    attempted += generated.questions.length;

    const context = generated.transcript ? `Bài nghe:\n${generated.transcript}` : generated.text ? `Đoạn văn:\n${generated.text}` : "";

    const verifiedQuestions: GroupQuestionFormInput[] = [];
    for (const q of generated.questions) {
      if (!(await verifyQuestion(context, q))) continue;
      verifiedQuestions.push({
        prompt: q.question,
        correctLabel: q.correctAnswer as GroupQuestionFormInput["correctLabel"],
        explanationVi: q.explanation,
        options: q.options.map((content, idx) => ({ label: OPTION_LABELS[idx], content })),
      });
    }

    // questionGroupFormSchema requires >= 2 questions — a group that lost
    // too many to verification isn't worth keeping even partially.
    if (verifiedQuestions.length < 2) continue;

    groups.push({
      part,
      format: GROUP_FORMAT[part] as QuestionGroupFormInput["format"],
      layout: "SINGLE",
      texts: generated.text ? [{ label: "Đoạn văn", content: generated.text }] : [],
      transcript: isAudio ? generated.transcript : undefined,
      imageUrls: [],
      difficulty,
      status: "DRAFT",
      questions: verifiedQuestions,
    });
  }

  return { attempted, groups };
}
