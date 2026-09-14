"use client";

import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface PassageText {
  label: string;
  content: string;
}

export function PassageViewer({
  title,
  texts,
  imageUrls = [],
  priority = false,
  imageSizes = "(max-width: 768px) 100vw, 480px",
}: {
  title?: string | null;
  texts: PassageText[];
  /** Up to 3 shared-stimulus images (e.g. a form plus a schedule for one
   * Part 7 double passage). Callers with only a single legacy `imageUrl`
   * should pass `imageUrl ? [imageUrl] : []`. */
  imageUrls?: string[];
  /** Set for the currently-visible passage in the live exam-taking flow so
   * its image fetches immediately instead of waiting on lazy-load — leave
   * off wherever many of these can render on one page at once (e.g. an
   * attempt review list), since marking all of those priority would just
   * make them all compete for bandwidth instead of loading any one faster. */
  priority?: boolean;
  /** Next/Image `sizes` hint — the box itself is always `w-full` of its
   * parent (no hardcoded cap), but this tells the optimizer which source
   * resolution to actually fetch, so it should roughly match how wide the
   * caller's own layout renders it. Defaults to a normal single-column
   * reading passage; a caller giving the image a wider column (e.g. the
   * exam runner's side-by-side group layout) should pass a wider hint too,
   * or the image displays upscaled/soft from a smaller-than-needed source. */
  imageSizes?: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      {title && <p className="text-sm font-semibold">{title}</p>}

      {imageUrls.length > 0 && (
        // flex-wrap + justify-center (not a plain grid) so a lone trailing
        // image — e.g. the 3rd of 3 wrapping to its own row — centers
        // itself instead of sticking to the left like an empty grid cell
        // would leave it. A fixed height (not aspect-[4/3]) gives portrait
        // screenshots (forms/receipts/emails — the common case for these)
        // as much room as landscape ones instead of being letterboxed down.
        <div className={imageUrls.length > 1 ? "flex flex-wrap justify-center gap-3" : undefined}>
          {imageUrls.map((url, i) => (
            <div
              key={url + i}
              className={cn(
                "relative w-full overflow-hidden rounded-xl bg-muted",
                imageUrls.length > 1 ? "h-72 sm:h-96 sm:w-[calc(50%-0.375rem)]" : "h-80 sm:h-[28rem]"
              )}
            >
              <Image src={url} alt="" fill priority={priority && i === 0} className="object-contain" sizes={imageSizes} />
            </div>
          ))}
        </div>
      )}

      {texts.length > 1 ? (
        <Tabs defaultValue="0" className="w-full">
          <TabsList>
            {texts.map((t, i) => (
              <TabsTrigger key={i} value={String(i)}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {texts.map((t, i) => (
            <TabsContent key={i} value={String(i)}>
              <div className="max-w-none whitespace-pre-line text-sm leading-relaxed text-foreground/90">{t.content}</div>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        texts[0] && (
          <div className="max-w-none whitespace-pre-line text-sm leading-relaxed text-foreground/90">{texts[0].content}</div>
        )
      )}
    </div>
  );
}
