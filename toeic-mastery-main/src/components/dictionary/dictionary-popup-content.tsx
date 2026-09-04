"use client";

import * as React from "react";
import Link from "next/link";
import { Star, ExternalLink, Loader2, Crown, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { WordAudioButton } from "@/components/dictionary/word-audio-button";
import { useDictionaryLookup } from "@/hooks/use-dictionary-lookup";
import { toggleSaveWordAction } from "@/lib/actions/dictionary";
import { FREE_DICTIONARY_LOOKUPS_PER_DAY } from "@/lib/constants/limits";
import { cn } from "@/lib/utils";

/** Maps the English part-of-speech tags providers return (dictionaryapi.dev,
 * Wiktionary) to the Vietnamese abbreviation learners expect — neither
 * provider localizes this itself. Unrecognized tags fall back to the raw
 * string rather than disappearing. */
const POS_VI: Record<string, string> = {
  noun: "danh từ",
  pronoun: "đại từ",
  verb: "động từ",
  adjective: "tính từ",
  adverb: "trạng từ",
  preposition: "giới từ",
  conjunction: "liên từ",
  interjection: "thán từ",
  exclamation: "thán từ",
  determiner: "hạn định từ",
  article: "mạo từ",
  numeral: "số từ",
};

function posLabel(pos: string | null): string | null {
  if (!pos) return null;
  return POS_VI[pos.toLowerCase()] ?? pos;
}

export function DictionaryPopupContent({
  word,
  compact = true,
  onNavigate,
  onClose,
}: {
  word: string;
  compact?: boolean;
  onNavigate?: () => void;
  /** Renders a close button in the header. Omit when the wrapper already
   * provides its own close affordance (e.g. the mobile Sheet's built-in X). */
  onClose?: () => void;
}) {
  const { data, isLoading, isError, error } = useDictionaryLookup(word);
  const [saved, setSaved] = React.useState(false);
  const [savePending, startSaveTransition] = React.useTransition();

  function handleSave() {
    startSaveTransition(async () => {
      const result = await toggleSaveWordAction(word);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setSaved(!!result.saved);
      toast.success(result.saved ? `Đã lưu "${word}"` : `Đã bỏ lưu "${word}"`);
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Đang tra &quot;{word}&quot;...
      </div>
    );
  }

  if (error instanceof Error && error.message === "LIMIT_REACHED") {
    return (
      <div className="flex flex-col items-center gap-2 p-4 text-center">
        <Crown className="size-6 text-primary" />
        <p className="text-sm font-medium">Nâng cấp tài khoản để tiếp tục tra cứu</p>
        <p className="text-xs text-muted-foreground">Bạn đã dùng hết {FREE_DICTIONARY_LOOKUPS_PER_DAY} lượt tra miễn phí hôm nay.</p>
        <Button asChild size="sm" onClick={onNavigate}>
          <Link href="/pricing">Nâng cấp Pro</Link>
        </Button>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Không tìm thấy nghĩa của &quot;{word}&quot;. {error instanceof Error ? error.message : ""}
      </div>
    );
  }

  const synonymCap = compact ? 6 : 12;
  const antonymCap = compact ? 6 : 12;
  const exampleCap = compact ? 2 : 4;
  const phraseCap = compact ? 3 : 8;

  const meaning = data.meaningVi ?? data.definitions[0]?.definition ?? null;
  const examples = data.examples.slice(0, exampleCap);
  const pos = posLabel(data.partOfSpeech);

  return (
    <div className="flex max-w-sm flex-col gap-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <span className="text-xl leading-none font-bold">{data.word}</span>
          {(data.ipa || pos) && (
            <div className="flex flex-wrap items-center gap-1.5">
              {data.ipa && (
                <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
                  /{data.ipa.replace(/\//g, "")}/
                </span>
              )}
              {pos && (
                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                  {pos}
                </span>
              )}
            </div>
          )}
          <div className="flex shrink-0 gap-1.5">
            <WordAudioButton word={data.word} audioUrl={data.audioUrlUs} region="US" />
            <WordAudioButton word={data.word} audioUrl={data.audioUrlUk} region="UK" />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            size="sm"
            variant={saved ? "default" : "outline"}
            disabled={savePending}
            onClick={handleSave}
            className="h-7 gap-1 rounded-full px-2.5 text-xs"
          >
            <Star className={cn("size-3.5", saved && "fill-current")} />
            {saved ? "Đã lưu" : "Lưu"}
          </Button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
              aria-label="Đóng"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {meaning && (
        <p className="rounded-xl border border-border bg-muted/40 p-3 text-sm leading-relaxed font-medium text-foreground">
          {meaning}
        </p>
      )}

      {(data.synonyms.length > 0 || data.antonyms.length > 0) && (
        <div className="flex flex-col gap-2.5">
          {data.synonyms.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Đồng nghĩa</span>
              <div className="flex flex-wrap gap-1.5">
                {data.synonyms.slice(0, synonymCap).map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-success/20 bg-success/10 px-2.5 py-1 text-xs font-medium text-success"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          {data.antonyms.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Trái nghĩa</span>
              <div className="flex flex-wrap gap-1.5">
                {data.antonyms.slice(0, antonymCap).map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-destructive/20 bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {data.synonymsLocked && (
        <Link
          href="/pricing"
          onClick={onNavigate}
          className="flex items-center gap-1.5 rounded-lg bg-accent/50 px-2.5 py-1.5 text-xs font-medium text-primary hover:underline"
        >
          <Crown className="size-3.5" /> Nâng cấp Pro để xem từ đồng nghĩa & trái nghĩa
        </Link>
      )}

      {examples.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Ví dụ</span>
          <div className="flex flex-col gap-2">
            {examples.map((ex, i) => (
              <div key={i} className="rounded-lg border-l-[3px] border-info bg-info/5 px-3 py-2">
                <p className="text-sm text-foreground italic">&quot;{ex.en}&quot;</p>
                {ex.vi && <p className="mt-0.5 text-xs text-muted-foreground">{ex.vi}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.collocations.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Cụm từ</span>
          <div className="flex flex-wrap gap-1.5">
            {data.collocations.slice(0, phraseCap).map((c) => (
              <span key={c} className="rounded-lg bg-muted px-2.5 py-1.5 text-xs font-medium text-foreground">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      <Button size="sm" variant="ghost" asChild onClick={onNavigate} className="h-auto self-end px-2 py-1 text-xs">
        <Link href={`/dictionary/${encodeURIComponent(data.word)}`}>
          <ExternalLink className="size-3.5" />
          Xem chi tiết
        </Link>
      </Button>
    </div>
  );
}
