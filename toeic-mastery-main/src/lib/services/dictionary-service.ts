import "server-only";
import { db } from "@/lib/db";
import { TranslationService } from "@/lib/services/translation-service";
import type { Prisma } from "@/generated/prisma/client";
import type { DictionaryDefinition, DictionaryExample, DictionaryResult } from "@/lib/types/dictionary";

export type { DictionaryDefinition, DictionaryExample, DictionaryResult };

/** Thrown for a transient upstream failure (network error, timeout, rate
 * limit, 5xx) — distinct from a genuine "this word doesn't exist" (which
 * resolves to `null`, not an exception), so callers can tell a user "thử lại
 * sau" instead of wrongly implying the word itself is invalid. Only
 * surfaces when every provider in the chain fails the same way; any one of
 * them returning a real result (or a clean "not found") is enough. */
export class DictionaryLookupError extends Error {}

type RawResult = Omit<DictionaryResult, "meaningVi" | "source">;

/** Prisma's Json input type requires structural compatibility our narrow
 * interfaces don't declare (no index signature) — this is a plain data cast. */
function toJsonInput<T>(value: T): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

interface DictionaryProvider {
  name: string;
  lookup(word: string): Promise<RawResult | null>;
}

interface DictionaryApiPhonetic {
  text?: string;
  audio?: string;
}
interface DictionaryApiDefinition {
  definition: string;
  example?: string;
  synonyms?: string[];
  antonyms?: string[];
}
interface DictionaryApiMeaning {
  partOfSpeech: string;
  definitions: DictionaryApiDefinition[];
  synonyms?: string[];
  antonyms?: string[];
}
interface DictionaryApiEntry {
  word: string;
  phonetic?: string;
  phonetics?: DictionaryApiPhonetic[];
  meanings?: DictionaryApiMeaning[];
}

/** Free, keyless dictionary API — https://dictionaryapi.dev. Rich (audio,
 * IPA, synonyms/antonyms) but mostly covers headwords, not every inflected
 * form, and this VPS's network can't always reach it (see WiktionaryProvider
 * below, which exists specifically to cover both gaps). */
class DictionaryApiDevProvider implements DictionaryProvider {
  name = "dictionaryapi";

  async lookup(word: string) {
    let res: Response;
    try {
      res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, {
        // Short — this host is known to be network-blocked from this VPS
        // right now, and every provider runs concurrently (see
        // DictionaryService.fetchFromProviders), so this timeout is the
        // floor on how long a blocked/slow primary can hold up the whole
        // lookup rather than just losing a race to a faster fallback.
        signal: AbortSignal.timeout(2000),
        next: { revalidate: false },
      });
    } catch (err) {
      throw new DictionaryLookupError(err instanceof Error ? err.message : "network error");
    }

    // A 404 here means the word genuinely isn't in the dictionary — anything
    // else (429 rate limit, 5xx, etc.) is an upstream problem, not a verdict
    // on the word, and must not be treated the same as "not found".
    if (res.status === 404) return null;
    if (!res.ok) throw new DictionaryLookupError(`upstream status ${res.status}`);

    const entries = (await res.json()) as DictionaryApiEntry[];
    const entry = entries[0];
    if (!entry) return null;

    const phonetics = entry.phonetics?.filter((p) => p.audio) ?? [];
    const usAudio = phonetics.find((p) => /-us\.|_us\.|american/i.test(p.audio ?? ""))?.audio;
    const ukAudio = phonetics.find((p) => /-uk\.|_uk\.|british/i.test(p.audio ?? ""))?.audio;
    // Neither accent explicitly tagged (common — many entries ship only one
    // recording): give both buttons the one real recording available rather
    // than labeling it "US" and leaving "UK" silently falling back to TTS.
    const fallbackAudio = phonetics[0]?.audio ?? null;

    const definitions: DictionaryDefinition[] = [];
    const synonyms = new Set<string>();
    const antonyms = new Set<string>();
    const examples: DictionaryExample[] = [];

    for (const meaning of entry.meanings ?? []) {
      for (const s of meaning.synonyms ?? []) synonyms.add(s);
      for (const a of meaning.antonyms ?? []) antonyms.add(a);
      for (const def of meaning.definitions ?? []) {
        definitions.push({ partOfSpeech: meaning.partOfSpeech, definition: def.definition, example: def.example });
        for (const s of def.synonyms ?? []) synonyms.add(s);
        for (const a of def.antonyms ?? []) antonyms.add(a);
        if (def.example) examples.push({ en: def.example });
      }
    }

    return {
      word: entry.word,
      ipa: entry.phonetic ?? phonetics[0]?.text ?? null,
      partOfSpeech: entry.meanings?.[0]?.partOfSpeech ?? null,
      audioUrlUs: usAudio ?? fallbackAudio,
      audioUrlUk: ukAudio ?? fallbackAudio,
      definitions: definitions.slice(0, 8),
      synonyms: [...synonyms].slice(0, 10),
      antonyms: [...antonyms].slice(0, 10),
      examples: examples.slice(0, 5),
      wordFamily: [],
      collocations: [],
    };
  }
}

interface WiktionaryDefinition {
  definition: string;
  parsedExamples?: { example: string }[];
}
interface WiktionarySense {
  partOfSpeech: string;
  language: string;
  definitions: WiktionaryDefinition[];
}
/** Keyed by language code — the endpoint returns every language section for
 * the page, not just English. */
type WiktionaryResponse = Record<string, WiktionarySense[]>;

/** Strips the HTML Wiktionary's REST API embeds in definition/example text
 * (links, <i> mentions, category markers) down to plain text. Not a full
 * sanitizer — this only ever feeds into our own JSX as a text string, never
 * dangerouslySetInnerHTML, so leftover markup would just render as visible
 * text rather than execute. */
function stripWiktionaryHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/** Free, keyless Wikimedia REST API — https://en.wiktionary.org. No audio,
 * IPA, or synonym/antonym data (that endpoint doesn't expose them), but it
 * natively has entries for inflected forms dictionaryapi.dev often lacks
 * (e.g. "applications" resolves to "plural of application"), and lives on a
 * different host than the one this VPS currently can't reach — see
 * DictionaryService.lookup for how the two are combined. */
class WiktionaryProvider implements DictionaryProvider {
  name = "wiktionary";

  async lookup(word: string) {
    let res: Response;
    try {
      res = await fetch(`https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`, {
        signal: AbortSignal.timeout(6000),
        next: { revalidate: false },
      });
    } catch (err) {
      throw new DictionaryLookupError(err instanceof Error ? err.message : "network error");
    }

    if (res.status === 404) return null;
    if (!res.ok) throw new DictionaryLookupError(`upstream status ${res.status}`);

    const body = (await res.json()) as WiktionaryResponse;
    const senses = body.en;
    if (!senses || senses.length === 0) return null;

    const definitions: DictionaryDefinition[] = [];
    const examples: DictionaryExample[] = [];

    for (const sense of senses) {
      const partOfSpeech = sense.partOfSpeech?.toLowerCase() || undefined;
      for (const def of sense.definitions) {
        const text = stripWiktionaryHtml(def.definition);
        if (!text) continue;
        const example = def.parsedExamples?.[0] ? stripWiktionaryHtml(def.parsedExamples[0].example) : undefined;
        definitions.push({ partOfSpeech: partOfSpeech ?? "", definition: text, example });
        if (example) examples.push({ en: example });
      }
    }
    if (definitions.length === 0) return null;

    return {
      word,
      ipa: null,
      partOfSpeech: definitions[0]?.partOfSpeech || null,
      audioUrlUs: null,
      audioUrlUk: null,
      definitions: definitions.slice(0, 8),
      synonyms: [],
      antonyms: [],
      examples: examples.slice(0, 5),
      wordFamily: [],
      collocations: [],
    };
  }
}

/** Free, keyless WordNet-backed word-relations API — https://www.datamuse.com/api.
 * Neither definition provider above reliably supplies synonyms/antonyms
 * (dictionaryapi.dev does for some words; Wiktionary's definition endpoint
 * never does), so this fills the gap for whichever one just resolved the
 * word — tried regardless of which provider supplied the definitions. */
async function fetchDatamuseRelated(word: string, relation: "rel_syn" | "rel_ant"): Promise<string[]> {
  try {
    const res = await fetch(`https://api.datamuse.com/words?${relation}=${encodeURIComponent(word)}&max=10`, {
      signal: AbortSignal.timeout(2000),
      next: { revalidate: false },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { word: string }[];
    return data.map((d) => d.word);
  } catch {
    // Best-effort enrichment, not required data — a failure here just means
    // this word keeps whatever synonyms/antonyms it already had (often none).
    return [];
  }
}

/** Only fills in whichever of synonyms/antonyms is actually missing — never
 * overrides real data a definition provider already supplied. */
async function enrichSynonymsAntonyms(word: string, synonyms: string[], antonyms: string[]): Promise<{ synonyms: string[]; antonyms: string[] }> {
  if (synonyms.length > 0 && antonyms.length > 0) return { synonyms, antonyms };

  const [newSynonyms, newAntonyms] = await Promise.all([
    synonyms.length > 0 ? Promise.resolve<string[]>([]) : fetchDatamuseRelated(word, "rel_syn"),
    antonyms.length > 0 ? Promise.resolve<string[]>([]) : fetchDatamuseRelated(word, "rel_ant"),
  ]);

  return {
    synonyms: synonyms.length > 0 ? synonyms : newSynonyms.slice(0, 10),
    antonyms: antonyms.length > 0 ? antonyms : newAntonyms.slice(0, 10),
  };
}

function resolveProviders(): DictionaryProvider[] {
  const provider = (process.env.DICTIONARY_PROVIDER ?? "dictionaryapi").toLowerCase();
  switch (provider) {
    // Add a licensed provider here (e.g. Merriam-Webster, Oxford Dictionaries
    // API) by implementing DictionaryProvider and prepending it — Wiktionary
    // stays last as the free fallback regardless of which primary is picked.
    case "dictionaryapi":
    default:
      return [new DictionaryApiDevProvider(), new WiktionaryProvider()];
  }
}

/** Cheap suffix-stripping for common English inflections — tried only after
 * every provider above has already failed to find the word as typed (most
 * inflected forms resolve directly via Wiktionary already; this is the last
 * resort for the ones that don't). Not a real lemmatizer, just enough
 * candidate guesses to catch the common cases; whichever candidate a
 * provider actually recognizes wins. */
function candidateBaseForms(word: string): string[] {
  const candidates = new Set<string>();
  const doubledConsonant = /([a-z])\1(ed|ing)$/;

  if (word.endsWith("ies") && word.length > 4) candidates.add(word.slice(0, -3) + "y");
  if (word.endsWith("es") && word.length > 3) candidates.add(word.slice(0, -2));
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) candidates.add(word.slice(0, -1));

  if (word.endsWith("ied") && word.length > 4) candidates.add(word.slice(0, -3) + "y");
  if (word.endsWith("ed") && word.length > 3) {
    candidates.add(word.slice(0, -2));
    candidates.add(word.slice(0, -1));
    if (doubledConsonant.test(word)) candidates.add(word.slice(0, -3));
  }

  if (word.endsWith("ing") && word.length > 4) {
    candidates.add(word.slice(0, -3));
    candidates.add(word.slice(0, -3) + "e");
    if (doubledConsonant.test(word)) candidates.add(word.slice(0, -4));
  }

  candidates.delete(word);
  return [...candidates];
}

const CACHE_TTL_DAYS = 60;
/** How many example sentences get a Vietnamese translation attempt — capped
 * to bound translation-API calls per lookup (MyMemory is rate-limited). */
const MAX_TRANSLATED_EXAMPLES = 2;

function fromCachedRow(cached: {
  word: string;
  ipa: string | null;
  partOfSpeech: string | null;
  meaningVi: string | null;
  audioUrlUs: string | null;
  audioUrlUk: string | null;
  definitions: unknown;
  synonyms: string[];
  antonyms: string[];
  examples: unknown;
  wordFamily: unknown;
  collocations: string[];
}): DictionaryResult {
  return {
    word: cached.word,
    ipa: cached.ipa,
    partOfSpeech: cached.partOfSpeech,
    meaningVi: cached.meaningVi,
    audioUrlUs: cached.audioUrlUs,
    audioUrlUk: cached.audioUrlUk,
    definitions: cached.definitions as unknown as DictionaryDefinition[],
    synonyms: cached.synonyms,
    antonyms: cached.antonyms,
    examples: cached.examples as unknown as DictionaryExample[],
    wordFamily: cached.wordFamily as unknown as string[],
    collocations: cached.collocations,
    source: "cache",
  };
}

export class DictionaryService {
  private providers: DictionaryProvider[];
  private translation: TranslationService;

  constructor(providers: DictionaryProvider[] = resolveProviders(), translation = new TranslationService()) {
    this.providers = providers;
    this.translation = translation;
  }

  /** Translates `text`, but treats a null/empty result *or* MyMemory just
   * echoing the English text back untranslated (a real, observed failure
   * mode for short strings it can't translate) as a failure — returning
   * null rather than caching English text as if it were the Vietnamese
   * meaning. */
  private async translateOrNull(text: string): Promise<string | null> {
    const translated = await this.translation.toVietnamese(text);
    if (!translated) return null;
    if (translated.trim().toLowerCase() === text.trim().toLowerCase()) return null;
    return translated;
  }

  /** Tries every provider for one exact word *concurrently* — awaiting them
   * one at a time would mean a slow/blocked primary (dictionaryapi.dev is
   * currently network-blocked from this VPS) adds its full timeout on top
   * of every fallback's latency instead of just racing it. Priority order
   * still decides the winner among whichever succeeded: the first provider
   * in `this.providers` with a real result wins, even if a later one in the
   * list happened to resolve first. A provider throwing (network/5xx) is
   * just skipped; `lastError` is only surfaced if every provider failed. */
  private async fetchFromProviders(word: string): Promise<{ result: RawResult | null; providerName: string | null; lastError: unknown }> {
    const settled = await Promise.allSettled(this.providers.map((provider) => provider.lookup(word)));

    for (let i = 0; i < settled.length; i++) {
      const outcome = settled[i];
      if (outcome.status === "fulfilled" && outcome.value) {
        return { result: outcome.value, providerName: this.providers[i].name, lastError: null };
      }
    }

    const rejected = settled.find((o): o is PromiseRejectedResult => o.status === "rejected");
    return { result: null, providerName: null, lastError: rejected?.reason ?? null };
  }

  async lookup(rawWord: string): Promise<DictionaryResult | null> {
    const word = rawWord.trim().toLowerCase();
    if (!word || !/^[a-z][a-z'-]*$/i.test(word)) return null;

    const cached = await db.dictionaryEntry.findUnique({ where: { word } });
    const ageDays = cached ? (Date.now() - cached.fetchedAt.getTime()) / 86_400_000 : Infinity;

    if (cached && ageDays < CACHE_TTL_DAYS) {
      // A cache hit missing its Vietnamese meaning and/or synonyms/antonyms
      // means a *previous* attempt at that specific piece failed or (for
      // synonyms/antonyms) predates this enrichment existing at all — retry
      // just what's missing (the rest of the cached row is already fresh
      // and correct) instead of serving a permanently-incomplete entry for
      // up to 60 days.
      const needsMeaning = cached.meaningVi === null;
      const needsSynonymsOrAntonyms = cached.synonyms.length === 0 || cached.antonyms.length === 0;
      if (needsMeaning || needsSynonymsOrAntonyms) {
        const definitions = cached.definitions as unknown as DictionaryDefinition[];
        const [retriedMeaning, enriched] = await Promise.all([
          needsMeaning ? this.translateOrNull(definitions[0]?.definition ?? word) : Promise.resolve(cached.meaningVi),
          needsSynonymsOrAntonyms
            ? enrichSynonymsAntonyms(word, cached.synonyms, cached.antonyms)
            : Promise.resolve({ synonyms: cached.synonyms, antonyms: cached.antonyms }),
        ]);
        if (retriedMeaning !== cached.meaningVi || enriched.synonyms.length !== cached.synonyms.length || enriched.antonyms.length !== cached.antonyms.length) {
          await db.dictionaryEntry.update({
            where: { word },
            data: { meaningVi: retriedMeaning, synonyms: enriched.synonyms, antonyms: enriched.antonyms },
          });
          return fromCachedRow({ ...cached, meaningVi: retriedMeaning, synonyms: enriched.synonyms, antonyms: enriched.antonyms });
        }
      }
      return fromCachedRow(cached);
    }

    let { result: fresh, providerName, lastError } = await this.fetchFromProviders(word);

    // Not found as typed — try a few common-inflection guesses (running ->
    // run, applications -> application) before giving up. Every provider
    // already covers a lot of this natively (Wiktionary especially), so
    // this is a last resort, not the primary path.
    if (!fresh) {
      for (const candidate of candidateBaseForms(word)) {
        const attempt = await this.fetchFromProviders(candidate);
        if (attempt.result) {
          fresh = attempt.result;
          providerName = attempt.providerName;
          break;
        }
      }
    }

    if (!fresh) {
      // Every provider (and every inflection guess) came back empty. If any
      // of those failures was a real network/upstream error rather than a
      // clean "not found", that's the more honest reason — serve stale
      // cache if we have it, else surface it as transient rather than
      // implying the word itself doesn't exist.
      if (lastError) {
        if (cached) return fromCachedRow(cached);
        throw lastError instanceof DictionaryLookupError ? lastError : new DictionaryLookupError(String(lastError));
      }
      return null;
    }

    const [meaningVi, examples, enriched] = await Promise.all([
      this.translateOrNull(fresh.definitions[0]?.definition ?? word),
      Promise.all(
        fresh.examples.map(async (ex, i) => ({
          en: ex.en,
          vi: i < MAX_TRANSLATED_EXAMPLES ? ((await this.translateOrNull(ex.en)) ?? undefined) : undefined,
        }))
      ),
      enrichSynonymsAntonyms(word, fresh.synonyms, fresh.antonyms),
    ]);
    fresh = { ...fresh, synonyms: enriched.synonyms, antonyms: enriched.antonyms };

    await db.dictionaryEntry.upsert({
      where: { word },
      create: {
        word,
        ipa: fresh.ipa,
        partOfSpeech: fresh.partOfSpeech,
        meaningVi,
        audioUrlUs: fresh.audioUrlUs,
        audioUrlUk: fresh.audioUrlUk,
        definitions: toJsonInput(fresh.definitions),
        synonyms: fresh.synonyms,
        antonyms: fresh.antonyms,
        examples: toJsonInput(examples),
        wordFamily: toJsonInput(fresh.wordFamily),
        collocations: fresh.collocations,
        provider: providerName ?? "unknown",
      },
      update: {
        ipa: fresh.ipa,
        partOfSpeech: fresh.partOfSpeech,
        meaningVi,
        audioUrlUs: fresh.audioUrlUs,
        audioUrlUk: fresh.audioUrlUk,
        definitions: toJsonInput(fresh.definitions),
        synonyms: fresh.synonyms,
        antonyms: fresh.antonyms,
        examples: toJsonInput(examples),
        wordFamily: toJsonInput(fresh.wordFamily),
        collocations: fresh.collocations,
        provider: providerName ?? "unknown",
        fetchedAt: new Date(),
      },
    });

    return { ...fresh, meaningVi, examples, source: "provider" };
  }
}
