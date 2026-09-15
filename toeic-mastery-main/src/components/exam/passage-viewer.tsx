"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ZoomableImage } from "@/components/exam/zoomable-image";

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
        // Always stacked one-per-row full width, never side-by-side — a
        // 2-up grid halves each image's width, which is the opposite of
        // what these (almost always tall form/e-mail/receipt screenshots)
        // need. Each is independently click-to-zoom (ZoomableImage) for
        // when even a full-width inline image is still too small to read.
        <div className="flex flex-col gap-3">
          {imageUrls.map((url, i) => (
            <ZoomableImage
              key={url + i}
              src={url}
              loading={priority && i === 0 ? "eager" : "lazy"}
              className="max-h-[80vh]"
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
