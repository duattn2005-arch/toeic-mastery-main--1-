/**
 * Parses freeform pasted text in an Azota-style convention into the same
 * shape `importQuestionsAction` already accepts (`ImportQuestionInput[]`) —
 * no server-side changes needed, this just produces the JSON the existing
 * strict importer expects.
 *
 * Convention (see the reference screenshot): one or more question blocks,
 * each starting with a "Câu N." / "Question N." line (the prompt), followed
 * by 2-4 lettered option lines (A./B./C./D. or A)/B)/...). The correct
 * option is marked either with a leading `*` before the letter (`*D. ...`)
 * or by wrapping its text in `**bold**` markdown (`D. **...**` or the whole
 * line `**D. ...**`) — either convention, or both, work.
 */
export interface ParsedQuestion {
  question: string;
  options: string[];
  correctAnswer: "A" | "B" | "C" | "D";
}

export interface AzotaParseResult {
  questions: ParsedQuestion[];
  /** Blocks that looked like a question but had no options, or no option
   * could be identified as correct — surfaced so the admin can fix the
   * source text rather than silently losing a question. */
  skippedCount: number;
}

const QUESTION_START = /^(c[âa]u|question)\s*\d*\s*[.:)]?\s*/i;
const OPTION_LINE = /^(\*)?\s*([A-Da-d])[.)]\s*(.*)$/;
const BOLD_WRAP = /^\*\*(.+)\*\*$/;

function stripBold(text: string): { text: string; isBold: boolean } {
  const trimmed = text.trim();
  const match = BOLD_WRAP.exec(trimmed);
  return match ? { text: match[1].trim(), isBold: true } : { text: trimmed, isBold: false };
}

function parseBlock(lines: string[]): ParsedQuestion | null {
  if (lines.length === 0) return null;

  const promptLines: string[] = [];
  const options: { label: "A" | "B" | "C" | "D"; content: string; correct: boolean }[] = [];

  for (const rawLine of lines) {
    const optionMatch = OPTION_LINE.exec(rawLine.trim());
    if (optionMatch) {
      const [, leadingStar, letter, rest] = optionMatch;
      const { text, isBold } = stripBold(rest);
      options.push({
        label: letter.toUpperCase() as "A" | "B" | "C" | "D",
        content: text,
        correct: !!leadingStar || isBold,
      });
    } else if (options.length === 0) {
      // Still in the prompt (question text can span multiple lines before
      // the first option starts).
      promptLines.push(rawLine.replace(QUESTION_START, "").trim());
    }
  }

  const question = promptLines.join(" ").trim();
  if (!question || options.length < 2) return null;

  const correct = options.filter((o) => o.correct);
  if (correct.length !== 1) return null; // ambiguous or unmarked — skip, don't guess

  return {
    question,
    options: options.map((o) => o.content),
    correctAnswer: correct[0].label,
  };
}

export function parseAzotaQuestions(rawText: string): AzotaParseResult {
  const lines = rawText.split("\n").filter((l) => l.trim().length > 0);

  const blocks: string[][] = [];
  let current: string[] = [];
  for (const line of lines) {
    if (QUESTION_START.test(line.trim()) && current.length > 0) {
      blocks.push(current);
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) blocks.push(current);

  const questions: ParsedQuestion[] = [];
  let skippedCount = 0;
  for (const block of blocks) {
    const parsed = parseBlock(block);
    if (parsed) questions.push(parsed);
    else skippedCount++;
  }

  return { questions, skippedCount };
}
