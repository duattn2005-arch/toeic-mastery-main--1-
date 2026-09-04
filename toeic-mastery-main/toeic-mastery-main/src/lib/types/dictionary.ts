// Shared dictionary types — safe to import from both client and server code
// (no "server-only" dependency), unlike src/lib/services/dictionary-service.ts.

export interface DictionaryDefinition {
  partOfSpeech: string;
  definition: string;
  example?: string;
}

export interface DictionaryExample {
  en: string;
  vi?: string;
}

export interface DictionaryResult {
  word: string;
  ipa: string | null;
  partOfSpeech: string | null;
  meaningVi: string | null;
  audioUrlUs: string | null;
  audioUrlUk: string | null;
  definitions: DictionaryDefinition[];
  synonyms: string[];
  antonyms: string[];
  examples: DictionaryExample[];
  wordFamily: string[];
  collocations: string[];
  source: "cache" | "provider";
}
