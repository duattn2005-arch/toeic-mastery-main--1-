import { create } from "zustand";

export interface ExamAnswerState {
  selectedLabel: string | null;
  isFlagged: boolean;
  isSynced: boolean;
  /** Set once, on the first-ever selection for this question — immutable
   * after. Paired with `answerChangeCount` as the Cấp A "nhật ký quyết
   * định" (decision log) signal (see advanced-readiness.ts). */
  initialSelectedLabel: string | null;
  /** Incremented whenever selectedLabel changes to a DIFFERENT non-null
   * value after the first pick (not on the first pick itself). */
  answerChangeCount: number;
  /** Cumulative active-viewing time in ms, settled each time the learner
   * navigates away from this question (see goTo/settleCurrentQuestionTime).
   * Live time on the currently-open question isn't folded in here until
   * settled — use getLiveTimeSpentMs for the up-to-the-moment value. */
  timeSpentMs: number;
  /** How much of timeSpentMs has already been pushed to the server —
   * use-exam-sync sends only the delta and advances this on success, so a
   * question the learner sits on across several sync ticks doesn't
   * double-count. */
  syncedTimeMs: number;
}

function emptyAnswer(): ExamAnswerState {
  return { selectedLabel: null, isFlagged: false, isSynced: false, initialSelectedLabel: null, answerChangeCount: 0, timeSpentMs: 0, syncedTimeMs: 0 };
}

export interface ExamQuestionOption {
  label: string;
  content: string;
}

export interface ExamQuestion {
  id: string;
  part: string;
  orderIndex: number;
  prompt: string;
  imageUrl: string | null;
  audioUrl: string | null;
  /**
   * Spoken content only (what a narrator would say) — safe to send during an
   * active exam since it never names the correct option. Used as a
   * text-to-speech fallback when `audioUrl` has no produced recording yet.
   */
  transcript: string | null;
  passageId: string | null;
  options: ExamQuestionOption[];
}

interface ExamStoreState {
  attemptId: string | null;
  questions: ExamQuestion[];
  answers: Record<string, ExamAnswerState>;
  currentIndex: number;
  remainingSec: number;
  /**
   * Wall-clock deadline (epoch ms), set once at hydration. The single source
   * of truth for the countdown: `tickTimer` recomputes `remainingSec` from
   * this instead of blindly decrementing, so a throttled background tab or a
   * slow render can never drift the displayed time.
   */
  endTime: number | null;
  /**
   * False until `hydrate()` has loaded the real server/local time. Before
   * that, `remainingSec` sits at its default `0` — code that treats "time's
   * up" the same as "not loaded yet" (e.g. auto-submit) must gate on this,
   * or a fresh exam submits itself instantly on the pre-hydration render.
   */
  hydrated: boolean;
  isSubmitting: boolean;
  hasPendingSync: boolean;
  /** Wall-clock instant (epoch ms) the learner started viewing
   * `currentIndex`'s question — the running stopwatch's zero point. Reset
   * every time `goTo` fires (which also settles the elapsed time into the
   * question being left). Null before hydration. */
  currentQuestionEnteredAt: number | null;

  hydrate: (params: {
    attemptId: string;
    questions: ExamQuestion[];
    answers: Record<string, ExamAnswerState>;
    currentIndex: number;
    remainingSec: number;
  }) => void;
  setAnswer: (questionId: string, label: string) => void;
  toggleFlag: (questionId: string) => void;
  goTo: (index: number) => void;
  next: () => void;
  previous: () => void;
  tickTimer: () => void;
  markSynced: (questionId: string, syncedTimeMs: number) => void;
  /** Folds elapsed time on the currently-open question into its
   * `timeSpentMs` and restarts the stopwatch — called by goTo when leaving
   * a question, and by use-exam-sync before every flush so a question the
   * learner has sat on for multiple sync ticks still reports fresh time. */
  settleCurrentQuestionTime: () => void;
}

export const useExamStore = create<ExamStoreState>()((set, get) => ({
  attemptId: null,
  questions: [],
  answers: {},
  currentIndex: 0,
  remainingSec: 0,
  endTime: null,
  hydrated: false,
  isSubmitting: false,
  hasPendingSync: false,
  currentQuestionEnteredAt: null,

  hydrate: ({ attemptId, questions, answers, currentIndex, remainingSec }) =>
    set({
      attemptId,
      questions,
      answers,
      // The saved index (server-persisted or from a stale local snapshot) can
      // point past the end if the test's question list shrank since this
      // attempt started (e.g. an admin deleted/reassigned some questions) —
      // clamp it so the runner lands on the last real question instead of
      // rendering nothing and telling the learner the test "has no questions".
      currentIndex: questions.length > 0 ? Math.min(Math.max(currentIndex, 0), questions.length - 1) : 0,
      remainingSec,
      endTime: Date.now() + remainingSec * 1000,
      hydrated: true,
      currentQuestionEnteredAt: Date.now(),
    }),

  setAnswer: (questionId, label) =>
    set((state) => {
      const existing = state.answers[questionId] ?? emptyAnswer();
      const isFirstPick = existing.initialSelectedLabel === null;
      const isChange = !isFirstPick && existing.selectedLabel !== null && existing.selectedLabel !== label;
      return {
        answers: {
          ...state.answers,
          [questionId]: {
            ...existing,
            selectedLabel: label,
            initialSelectedLabel: existing.initialSelectedLabel ?? label,
            answerChangeCount: existing.answerChangeCount + (isChange ? 1 : 0),
            isSynced: false,
          },
        },
        hasPendingSync: true,
      };
    }),

  toggleFlag: (questionId) =>
    set((state) => {
      const existing = state.answers[questionId] ?? emptyAnswer();
      return {
        answers: { ...state.answers, [questionId]: { ...existing, isFlagged: !existing.isFlagged, isSynced: false } },
        hasPendingSync: true,
      };
    }),

  settleCurrentQuestionTime: () =>
    set((state) => {
      const current = state.questions[state.currentIndex];
      if (!current || state.currentQuestionEnteredAt === null) return {};
      const now = Date.now();
      const elapsed = Math.max(0, now - state.currentQuestionEnteredAt);
      if (elapsed === 0) return { currentQuestionEnteredAt: now };
      const existing = state.answers[current.id] ?? emptyAnswer();
      return {
        answers: { ...state.answers, [current.id]: { ...existing, timeSpentMs: existing.timeSpentMs + elapsed } },
        currentQuestionEnteredAt: now,
      };
    }),

  goTo: (index) => {
    const total = get().questions.length;
    if (index < 0 || index >= total) return;
    // Settle the question being left before switching — its stopwatch
    // reading must be final before currentIndex moves on.
    get().settleCurrentQuestionTime();
    set({ currentIndex: index });
  },
  next: () => get().goTo(get().currentIndex + 1),
  previous: () => get().goTo(get().currentIndex - 1),

  tickTimer: () =>
    set((state) => {
      if (state.endTime === null) return {};
      return { remainingSec: Math.max(0, Math.round((state.endTime - Date.now()) / 1000)) };
    }),

  markSynced: (questionId, syncedTimeMs) =>
    set((state) => ({
      answers: state.answers[questionId]
        ? { ...state.answers, [questionId]: { ...state.answers[questionId], isSynced: true, syncedTimeMs } }
        : state.answers,
    })),
}));
