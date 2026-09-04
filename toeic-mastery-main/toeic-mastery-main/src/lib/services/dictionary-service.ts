import "server-only";
import { db } from "@/lib/db";
import { TranslationService } from "@/lib/services/translation-service";
import type { Prisma } from "@/generated/prisma/client";
import type { DictionaryDefinition, DictionaryExample, DictionaryResult } from "@/lib/types/dictionary";

export type { DictionaryDefinition, DictionaryExample, DictionaryResult };

/** Thrown for a transient upstream failure (network error, timeout, rate
 * limit, 5xx) — distinct from a genuine "this word doesn't exist" (which
 * resolves to `null`, not an exception), so callers can tell a user "thử lại
 * sau" instead of wrongly implying the word itself is invalid. */
export class DictionaryLookupError extends Error {}

/** Prisma's Json input type requires structural compatibility our narrow
 * interfaces don't declare (no index signature) — this is a plain data cast. */
function toJsonInput<T>(value: T): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

interface DictionaryProvider {
  name: string;
  lookup(word: string): Promise<Omit<DictionaryResult, "meaningVi" | "source"> | null>;
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

/** Free, keyless dictionary API — https://dictionaryapi.dev */
class DictionaryApiDevProvider implements DictionaryProvider {
  name = "dictionaryapi";

  async lookup(word: string) {
    let res: Response;
    try {
      res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, {
        signal: AbortSignal.timeout(6000),
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

function resolveProvider(): DictionaryProvider {
  const provider = (process.env.DICTIONARY_PROVIDER ?? "dictionaryapi").toLowerCase();
  switch (provider) {
    // Add a licensed provider here (e.g. Merriam-Webster, Oxford Dictionaries
    // API) by implementing DictionaryProvider and adding a case — no call
    // sites need to change.
    case "dictionaryapi":
    default:
      return new DictionaryApiDevProvider();
  }
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
  private provider: DictionaryProvider;
  private translation: TranslationService;

  constructor(provider: DictionaryProvider = resolveProvider(), translation = new TranslationService()) {
    this.provider = provider;
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

  async lookup(rawWord: string): Promise<DictionaryResult | null> {
    const word = rawWord.trim().toLowerCase();
    if (!word || !/^[a-z][a-z'-]*$/i.test(word)) return null;

    const cached = await db.dictionaryEntry.findUnique({ where: { word } });
    const ageDays = cached ? (Date.now() - cached.fetchedAt.getTime()) / 86_400_000 : Infinity;

    if (cached && ageDays < CACHE_TTL_DAYS) {
      // A cache hit with no Vietnamese meaning means a *previous* translation
      // attempt failed — retry just the translation (English data is already
      // fresh and correct) instead of serving a permanently-broken meaning
      // for up to 60 days.
      if (cached.meaningVi === null) {
        const definitions = cached.definitions as unknown as DictionaryDefinition[];
        const retried = await this.translateOrNull(definitions[0]?.definition ?? word);
        if (retried) {
          await db.dictionaryEntry.update({ where: { word }, data: { meaningVi: retried } });
          return fromCachedRow({ ...cached, meaningVi: retried });
        }
      }
      return fromCachedRow(cached);
    }

    let fresh;
    try {
      fresh = await this.provider.lookup(word);
    } catch (err) {
      // Upstream is down/rate-limited right now — serve stale cache instead
      // of telling the user the word doesn't exist, if we have anything at
      // all to fall back to.
      if (cached) return fromCachedRow(cached);
      throw err instanceof DictionaryLookupError ? err : new DictionaryLookupError(String(err));
    }
    if (!fresh) return null;

    const meaningVi = await this.translateOrNull(fresh.definitions[0]?.definition ?? word);
    const examples: DictionaryExample[] = await Promise.all(
      fresh.examples.map(async (ex, i) => ({
        en: ex.en,
        vi: i < MAX_TRANSLATED_EXAMPLES ? ((await this.translateOrNull(ex.en)) ?? undefined) : undefined,
      }))
    );

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
        provider: this.provider.name,
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
        provider: this.provider.name,
        fetchedAt: new Date(),
      },
    });

    return { ...fresh, meaningVi, examples, source: "provider" };
  }
}
