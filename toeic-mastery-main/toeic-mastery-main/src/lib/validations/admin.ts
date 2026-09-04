import { z } from "zod";

export const TEST_PART_VALUES = ["PART1", "PART2", "PART3", "PART4", "PART5", "PART6", "PART7"] as const;
export const DIFFICULTY_VALUES = ["EASY", "MEDIUM", "HARD"] as const;
const OPTION_LABEL_VALUES = ["A", "B", "C", "D"] as const;

export const testFormSchema = z.object({
  title: z.string().trim().min(3, "Tối thiểu 3 ký tự"),
  slug: z
    .string()
    .trim()
    .min(3)
    .regex(/^[a-z0-9-]+$/, "Slug chỉ gồm chữ thường, số và dấu gạch ngang"),
  description: z.string().trim().optional(),
  thumbnailUrl: z.string().trim().url().optional().or(z.literal("")),
  difficulty: z.enum(DIFFICULTY_VALUES),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  isFullTest: z.boolean(),
  durationMinutes: z.coerce.number().int().min(1).max(300),
  listeningQuestions: z.coerce.number().int().min(0).max(200),
  readingQuestions: z.coerce.number().int().min(0).max(200),
  allowReplay: z.boolean(),
});
export type TestFormInput = z.infer<typeof testFormSchema>;

export const questionOptionFormSchema = z.object({
  label: z.enum(OPTION_LABEL_VALUES),
  content: z.string().trim().min(1, "Không được để trống"),
  distractorExplanation: z.string().trim().optional(),
});

export const QUESTION_STATUS_VALUES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export const questionFormSchema = z
  .object({
    testId: z.string().trim().optional(),
    part: z.enum(TEST_PART_VALUES),
    prompt: z.string().trim().optional(),
    imageUrl: z.string().trim().url().optional().or(z.literal("")),
    audioUrl: z.string().trim().url().optional().or(z.literal("")),
    transcript: z.string().trim().optional(),
    correctLabel: z.enum(OPTION_LABEL_VALUES),
    explanationVi: z.string().trim().min(1, "Bắt buộc nhập giải thích"),
    grammarTopicSlug: z.string().trim().optional(),
    vocabularyFocus: z.string().trim().optional(),
    evidenceText: z.string().trim().optional(),
    difficulty: z.enum(DIFFICULTY_VALUES),
    status: z.enum(QUESTION_STATUS_VALUES),
    options: z.array(questionOptionFormSchema).min(2).max(4),
  })
  .refine((data) => data.options.some((o) => o.label === data.correctLabel), {
    message: "Đáp án đúng phải khớp với một trong các lựa chọn",
    path: ["correctLabel"],
  });
export type QuestionFormInput = z.infer<typeof questionFormSchema>;

// Bulk import format — see docs/content-sources.md and section 40 of the spec.
export const importQuestionSchema = z.object({
  part: z.union([z.number().int().min(1).max(7), z.string()]),
  question: z.string().trim().min(1),
  options: z.array(z.string().trim().min(1)).min(2).max(4),
  correctAnswer: z.enum(OPTION_LABEL_VALUES),
  explanation: z.string().trim().min(1),
  difficulty: z.enum(["easy", "medium", "hard", "EASY", "MEDIUM", "HARD"]).optional(),
  audioUrl: z.string().trim().url().optional(),
  imageUrl: z.string().trim().url().optional(),
  transcript: z.string().trim().optional(),
  grammarTopicSlug: z.string().trim().optional(),
  testId: z.string().trim().optional(),
  status: z.enum(QUESTION_STATUS_VALUES).optional(),
});
export type ImportQuestionInput = z.infer<typeof importQuestionSchema>;

export const importPayloadSchema = z.union([importQuestionSchema, z.array(importQuestionSchema)]);

export const vocabularyWordFormSchema = z.object({
  topicId: z.string().trim().min(1, "Chọn chủ đề"),
  word: z.string().trim().min(1),
  ipa: z.string().trim().optional(),
  partOfSpeech: z.string().trim().min(1),
  meaningVi: z.string().trim().min(1),
  definitionEn: z.string().trim().min(1),
  exampleEn: z.string().trim().min(1),
  exampleVi: z.string().trim().min(1),
  synonyms: z.string().trim().optional(),
  collocations: z.string().trim().optional(),
  difficulty: z.enum(DIFFICULTY_VALUES),
});
export type VocabularyWordFormInput = z.infer<typeof vocabularyWordFormSchema>;
