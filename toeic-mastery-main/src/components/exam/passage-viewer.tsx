"use client";

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
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      {title && <p className="text-sm font-semibold">{title}</p>}

      {imageUrls.length > 0 && (
        // flex-wrap + justify-center (not a plain grid) so a lone trailing
        // image — e.g. the 3rd of 3 wrapping to its own row — centers
        // itself instead of sticking to the left like an empty grid cell
        // would leave it. A plain <img> at w-full (not next/image inside a
        // fixed-height box) so it renders at its own natural aspect ratio
        // and actually fills the column width — these are almost always
        // portrait form/e-mail/receipt screenshots, which a fixed-height
        // object-contain box was squeezing down to a narrow strip with
        // empty space on both sides instead of filling out.
        <div className={imageUrls.length > 1 ? "flex flex-wrap justify-center gap-3" : undefined}>
          {imageUrls.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url + i}
              src={url}
              alt=""
              loading={priority && i === 0 ? "eager" : "lazy"}
              className={cn(
                "max-h-[75vh] w-full rounded-xl border border-border bg-muted object-contain",
                imageUrls.length > 1 && "sm:w-[calc(50%-0.375rem)]"
              )}
            />
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
