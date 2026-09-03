import "server-only";

export interface TranslationProvider {
  name: string;
  translate(text: string, targetLang: string): Promise<string | null>;
}

/**
 * Free, keyless provider — good enough for short word/phrase translation in
 * development. Rate-limited; not meant for high-volume production traffic.
 */
class MyMemoryProvider implements TranslationProvider {
  name = "mymemory";

  async translate(text: string, targetLang: string): Promise<string | null> {
    const url = new URL("https://api.mymemory.translated.net/get");
    url.searchParams.set("q", text);
    url.searchParams.set("langpair", `en|${targetLang}`);

    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      responseData?: { translatedText?: string };
    };
    return data.responseData?.translatedText?.trim() || null;
  }
}

/** Requires GOOGLE_TRANSLATE_API_KEY (aliased from TRANSLATION_API_KEY). */
class GoogleTranslateProvider implements TranslationProvider {
  name = "google";
  constructor(private apiKey: string) {}

  async translate(text: string, targetLang: string): Promise<string | null> {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${this.apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: text, target: targetLang, source: "en", format: "text" }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      data?: { translations?: { translatedText?: string }[] };
    };
    return data.data?.translations?.[0]?.translatedText ?? null;
  }
}

/** Requires DEEPL_API_KEY (aliased from TRANSLATION_API_KEY). Free-tier host. */
class DeepLProvider implements TranslationProvider {
  name = "deepl";
  constructor(private apiKey: string) {}

  async translate(text: string, targetLang: string): Promise<string | null> {
    const res = await fetch("https://api-free.deepl.com/v2/translate", {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${this.apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ text, target_lang: targetLang.toUpperCase() }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { translations?: { text?: string }[] };
    return data.translations?.[0]?.text ?? null;
  }
}

function resolveProvider(): TranslationProvider {
  const provider = (process.env.TRANSLATION_PROVIDER ?? "mymemory").toLowerCase();
  const apiKey = process.env.TRANSLATION_API_KEY ?? "";

  switch (provider) {
    case "google":
      return apiKey ? new GoogleTranslateProvider(apiKey) : new MyMemoryProvider();
    case "deepl":
      return apiKey ? new DeepLProvider(apiKey) : new MyMemoryProvider();
    default:
      return new MyMemoryProvider();
  }
}

export class TranslationService {
  private provider: TranslationProvider;

  constructor(provider: TranslationProvider = resolveProvider()) {
    this.provider = provider;
  }

  async toVietnamese(text: string): Promise<string | null> {
    try {
      return await this.provider.translate(text, "vi");
    } catch {
      return null;
    }
  }
}
