/** One flashcard/game item — deliberately decoupled from which model it came
 * from (curated VocabularyWord vs. free-text SavedWord), so the same games
 * work for both the Vocabulary section and the Saved Words section. */
export interface StudyItem {
  id: string;
  term: string;
  ipa: string | null;
  partOfSpeech: string | null;
  meaningVi: string;
  exampleEn: string | null;
  audioUrl: string | null;
}

export interface QuizQuestion {
  item: StudyItem;
  options: string[];
  correctIndex: number;
}

const MIN_ITEMS_FOR_QUIZ = 4;
const MAX_MATCH_PAIRS = 8;

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function canPlayQuiz(items: StudyItem[]): boolean {
  return items.length >= MIN_ITEMS_FOR_QUIZ;
}

/** One question per item, 3 wrong-meaning distractors drawn from the rest of
 * the set (so distractors are always plausible — real TOEIC meanings, not
 * nonsense strings). */
export function buildQuiz(items: StudyItem[]): QuizQuestion[] {
  return shuffle(items).map((item) => {
    const pool = items.filter((i) => i.id !== item.id);
    const distractors = shuffle(pool)
      .slice(0, 3)
      .map((i) => i.meaningVi);
    const options = shuffle([item.meaningVi, ...distractors]);
    return { item, options, correctIndex: options.indexOf(item.meaningVi) };
  });
}

export interface MatchTile {
  key: string;
  itemId: string;
  label: string;
  kind: "term" | "meaning";
}

/** A random subset (capped so the board stays playable) laid out as
 * shuffled term/meaning tiles for the matching game. */
export function buildMatchBoard(items: StudyItem[]): MatchTile[] {
  const pairs = shuffle(items).slice(0, MAX_MATCH_PAIRS);
  const tiles: MatchTile[] = pairs.flatMap((item) => [
    { key: `${item.id}-term`, itemId: item.id, label: item.term, kind: "term" as const },
    { key: `${item.id}-meaning`, itemId: item.id, label: item.meaningVi, kind: "meaning" as const },
  ]);
  return shuffle(tiles);
}
