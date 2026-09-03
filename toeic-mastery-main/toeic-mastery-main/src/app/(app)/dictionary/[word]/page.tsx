import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { DictionaryService, DictionaryLookupError } from "@/lib/services/dictionary-service";
import { logDictionaryHistoryAction } from "@/lib/actions/dictionary";
import { isWordSaved } from "@/lib/data/dictionary-history";
import { hasReachedDictionaryLimit } from "@/lib/services/dictionary-limit";
import { WordDetailView } from "@/components/dictionary/word-detail-view";
import { DictionaryLimitReached } from "@/components/dictionary/dictionary-limit-reached";
import type { DictionaryResult } from "@/lib/types/dictionary";

export async function generateMetadata({ params }: { params: Promise<{ word: string }> }): Promise<Metadata> {
  const { word } = await params;
  return { title: decodeURIComponent(word) };
}

export default async function DictionaryWordPage({ params }: { params: Promise<{ word: string }> }) {
  const { word } = await params;
  const profile = await requireUser();
  const decoded = decodeURIComponent(word);

  const savedRow = await isWordSaved(profile.id, decoded);
  // Free tier caps lookups/day ("Tra từ khi bôi đen: 10/ngày") — a word the
  // learner already has a custom meaning for still shows fine below without
  // ever touching the provider, so it doesn't need this check.
  const limitReached = await hasReachedDictionaryLimit(profile);

  let result: DictionaryResult | null = null;
  let loggedLookup = false;

  if (!limitReached) {
    const service = new DictionaryService();
    try {
      result = await service.lookup(decoded);
    } catch (err) {
      // Upstream dictionary API is down — if the learner already gave this
      // word their own custom definition, show that instead of a hard error.
      if (err instanceof DictionaryLookupError && savedRow?.meaningVi) {
        result = null;
      } else if (!(err instanceof DictionaryLookupError)) {
        throw err;
      }
    }
    if (result) loggedLookup = true;
  }

  if (!result) {
    // Not in the dictionary provider (or it's temporarily unreachable, or
    // the free daily limit was hit) — a learner-authored custom word (added
    // via "add your own word", not a provider lookup) still has its own
    // meaning to show regardless.
    if (savedRow?.meaningVi) {
      result = {
        word: savedRow.word,
        ipa: null,
        partOfSpeech: null,
        meaningVi: savedRow.meaningVi,
        audioUrlUs: null,
        audioUrlUk: null,
        definitions: [],
        synonyms: [],
        antonyms: [],
        examples: savedRow.exampleEn ? [{ en: savedRow.exampleEn }] : [],
        wordFamily: [],
        collocations: [],
        source: "cache",
      };
    } else if (limitReached) {
      return <DictionaryLimitReached />;
    } else {
      notFound();
    }
  } else if (loggedLookup) {
    await logDictionaryHistoryAction(decoded, "SEARCH");
  }

  return (
    <WordDetailView
      result={result}
      initialSaved={!!savedRow}
      initialFavorite={savedRow?.isFavorite ?? false}
      initialNote={savedRow?.note ?? ""}
    />
  );
}
