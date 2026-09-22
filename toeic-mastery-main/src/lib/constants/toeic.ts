import type { TestPart } from "@/generated/prisma/enums";

export const TEST_PARTS: TestPart[] = ["PART1", "PART2", "PART3", "PART4", "PART5", "PART6", "PART7"];

export const LISTENING_PARTS: TestPart[] = ["PART1", "PART2", "PART3", "PART4"];
export const READING_PARTS: TestPart[] = ["PART5", "PART6", "PART7"];

export const PART_META: Record<
  TestPart,
  { label: string; shortLabel: string; slug: string; questionCount: number; skill: "LISTENING" | "READING"; targetSeconds: number }
> = {
  // targetSeconds: real TOEIC per-question pacing guidance (mục 12's
  // "quy tắc ngón tay" — Part 5-6 in 20-25 min, Part 7 ~1 min/câu). Shared
  // by competency-heatmap.ts's speed bonus and exam-runner.tsx's real-time
  // pace warning so both features agree on the same target.
  PART1: { label: "Part 1 — Mô tả tranh", shortLabel: "Part 1", slug: "part-1", questionCount: 6, skill: "LISTENING", targetSeconds: 5 },
  PART2: { label: "Part 2 — Hỏi đáp", shortLabel: "Part 2", slug: "part-2", questionCount: 25, skill: "LISTENING", targetSeconds: 5 },
  PART3: { label: "Part 3 — Đoạn hội thoại", shortLabel: "Part 3", slug: "part-3", questionCount: 39, skill: "LISTENING", targetSeconds: 10 },
  PART4: { label: "Part 4 — Bài nói ngắn", shortLabel: "Part 4", slug: "part-4", questionCount: 30, skill: "LISTENING", targetSeconds: 10 },
  PART5: { label: "Part 5 — Câu chưa hoàn chỉnh", shortLabel: "Part 5", slug: "part-5", questionCount: 30, skill: "READING", targetSeconds: 20 },
  PART6: { label: "Part 6 — Hoàn thành đoạn văn", shortLabel: "Part 6", slug: "part-6", questionCount: 16, skill: "READING", targetSeconds: 30 },
  PART7: { label: "Part 7 — Đọc hiểu đoạn văn", shortLabel: "Part 7", slug: "part-7", questionCount: 54, skill: "READING", targetSeconds: 60 },
};

export function partFromSlug(slug: string): TestPart | null {
  const entry = Object.entries(PART_META).find(([, meta]) => meta.slug === slug);
  return entry ? (entry[0] as TestPart) : null;
}

export const FULL_TEST_DURATION_MINUTES = 120;
export const FULL_TEST_TOTAL_QUESTIONS = 200;

export const OPTION_LABELS = ["A", "B", "C", "D"] as const;

export const DIFFICULTY_LABEL_VI: Record<string, string> = {
  EASY: "Dễ",
  MEDIUM: "Trung bình",
  HARD: "Khó",
};

export const MENTOR_LEVEL_LABEL_VI: Record<string, string> = {
  BEGINNER: "Cấp B (Beginner)",
  INTERMEDIATE: "Cấp I (Intermediate)",
  ADVANCED: "Cấp A (Advanced)",
};
