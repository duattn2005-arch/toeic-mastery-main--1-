"use client";

import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PassageText {
  label: string;
  content: string;
}

export function PassageViewer({
  title,
  texts,
  imageUrl,
  priority = false,
}: {
  title?: string | null;
  texts: PassageText[];
  imageUrl?: string | null;
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

      {imageUrl && (
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted">
          <Image src={imageUrl} alt="" fill priority={priority} className="object-contain" sizes="(max-width: 768px) 100vw, 480px" />
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
