"use client";

import { useQuery } from "@tanstack/react-query";
import type { DictionaryResult } from "@/lib/types/dictionary";

async function fetchWord(word: string): Promise<DictionaryResult> {
  const res = await fetch(`/api/dictionary/${encodeURIComponent(word)}`);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    // "LIMIT_REACHED" is a sentinel the UI checks for verbatim to show an
    // upgrade prompt instead of a generic "not found" message — see
    // dictionary-popup-content.tsx and word-detail-view.tsx.
    throw new Error(body.error ?? "Không tìm thấy từ này");
  }
  return res.json() as Promise<DictionaryResult>;
}

export function useDictionaryLookup(word: string | null) {
  return useQuery({
    queryKey: ["dictionary", word?.toLowerCase() ?? null],
    queryFn: () => fetchWord(word as string),
    enabled: !!word,
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
    retry: false,
  });
}
