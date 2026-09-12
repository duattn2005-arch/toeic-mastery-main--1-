import type { ExamQuestion } from "@/store/exam-store";

export interface QuestionGroup {
  passageId: string | null;
  startIndex: number;
  items: ExamQuestion[];
}

/**
 * Groups a flat, orderIndex-sorted question list into contiguous runs that
 * share one `passageId` (one shared audio/passage) — relies on the DB
 * invariant that a passage's questions are always created with consecutive
 * orderIndex values, so no sorting/lookahead is needed, just a linear scan
 * (same shape as question-navigator.tsx's part-grouping reduce).
 *
 * Two consecutive questions with `passageId: null` never merge — each
 * ungrouped question (Part 1/2/5, or a stray Part 3/4/6/7 row with no
 * passage yet) is always its own singleton group.
 */
export function groupQuestionsByPassage(questions: ExamQuestion[]): QuestionGroup[] {
  const groups: QuestionGroup[] = [];
  questions.forEach((q, index) => {
    const last = groups[groups.length - 1];
    if (last && q.passageId !== null && last.passageId === q.passageId) {
      last.items.push(q);
    } else {
      groups.push({ passageId: q.passageId, startIndex: index, items: [q] });
    }
  });
  return groups;
}
