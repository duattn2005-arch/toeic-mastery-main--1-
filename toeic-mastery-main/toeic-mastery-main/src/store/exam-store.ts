import { create } from "zustand";

export interface ExamAnswerState {
  selectedLabel: string | null;
  isFlagged: boolean;
  isSynced: boolean;
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
  markSynced: (questionId: string) => void;
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
    }),

  setAnswer: (questionId, label) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: {
          selectedLabel: label,
          isFlagged: state.answers[questionId]?.isFlagged ?? false,
          isSynced: false,
        },
      },
      hasPendingSync: true,
    })),

  toggleFlag: (questionId) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: {
          selectedLabel: state.answers[questionId]?.selectedLabel ?? null,
          isFlagged: !(state.answers[questionId]?.isFlagged ?? false),
          isSynced: false,
        },
      },
      hasPendingSync: true,
    })),

  goTo: (index) => {
    const total = get().questions.length;
    if (index < 0 || index >= total) return;
    set({ currentIndex: index });
  },
  next: () => get().goTo(get().currentIndex + 1),
  previous: () => get().goTo(get().currentIndex - 1),

  tickTimer: () =>
    set((state) => {
      if (state.endTime === null) return {};
      return { remainingSec: Math.max(0, Math.round((state.endTime - Date.now()) / 1000)) };
    }),

  markSynced: (questionId) =>
    set((state) => ({
      answers: state.answers[questionId]
        ? { ...state.answers, [questionId]: { ...state.answers[questionId], isSynced: true } }
        : state.answers,
    })),
}));
