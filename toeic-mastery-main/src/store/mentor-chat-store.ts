import { create } from "zustand";

/**
 * Ephemeral "currently streaming" state — deliberately NOT in the TanStack
 * Query cache (see docs/ai-mentor-architecture.md §3.3): the in-flight
 * assistant reply is a fast-changing local buffer with a completely
 * different lifecycle than "messages already persisted to the DB". Once a
 * stream finishes, the composer clears this and the finished message is
 * written into the query cache instead — at that point it behaves exactly
 * like any other historical message.
 */
interface MentorChatState {
  conversationId: string | null;
  /** Text accumulated so far for the reply currently streaming in, or null
   * when nothing is in flight. */
  streamingText: string | null;
  isSending: boolean;
  error: string | null;

  startStreaming: (conversationId: string) => void;
  appendDelta: (delta: string) => void;
  finishStreaming: () => void;
  setError: (message: string) => void;
  reset: () => void;
}

export const useMentorChatStore = create<MentorChatState>()((set) => ({
  conversationId: null,
  streamingText: null,
  isSending: false,
  error: null,

  startStreaming: (conversationId) => set({ conversationId, streamingText: "", isSending: true, error: null }),
  appendDelta: (delta) => set((state) => ({ streamingText: (state.streamingText ?? "") + delta })),
  finishStreaming: () => set({ streamingText: null, isSending: false }),
  setError: (message) => set({ error: message, isSending: false, streamingText: null }),
  reset: () => set({ conversationId: null, streamingText: null, isSending: false, error: null }),
}));
