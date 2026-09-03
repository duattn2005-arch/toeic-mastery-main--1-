"use client";

import * as React from "react";
import Link from "next/link";
import { Star, ExternalLink, Loader2, Crown } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WordAudioButton } from "@/components/dictionary/word-audio-button";
import { useDictionaryLookup } from "@/hooks/use-dictionary-lookup";
import { toggleSaveWordAction } from "@/lib/actions/dictionary";
import { FREE_DICTIONARY_LOOKUPS_PER_DAY } from "@/lib/constants/limits";
import { cn } from "@/lib/utils";

export function DictionaryPopupContent({
  word,
  compact = true,
  onNavigate,
}: {
  word: string;
  compact?: boolean;
  onNavigate?: () => void;
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

  const topDefinitions = compact ? data.definitions.slice(0, 2) : data.definitions;

  return (
    <div className="flex max-w-sm flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold">{data.word}</span>
            {data.partOfSpeech && (
              <Badge variant="secondary" className="text-[11px]">
                {data.partOfSpeech}
              </Badge>
            )}
          </div>
          {data.ipa && <span className="text-sm text-muted-foreground">/{data.ipa.replace(/\//g, "")}/</span>}
        </div>
        <div className="flex shrink-0 gap-1.5">
          <WordAudioButton word={data.word} audioUrl={data.audioUrlUs} region="US" />
          <WordAudioButton word={data.word} audioUrl={data.audioUrlUk} region="UK" />
        </div>
      </div>

      {data.meaningVi && <p className="text-sm font-medium text-primary">{data.meaningVi}</p>}

      {topDefinitions.length > 0 && (
        <ul className="flex flex-col gap-1.5 text-sm text-foreground/90">
          {topDefinitions.map((def, i) => (
            <li key={i}>
              <span className="text-muted-foreground">{i + 1}.</span> {def.definition}
              {def.example && (
                <span className="block pl-4 text-xs italic text-muted-foreground">&quot;{def.example}&quot;</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {data.synonyms.length > 0 && (
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Đồng nghĩa: </span>
          {data.synonyms.slice(0, 6).join(", ")}
        </div>
      )}

      {!compact && data.antonyms.length > 0 && (
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Trái nghĩa: </span>
          {data.antonyms.slice(0, 6).join(", ")}
        </div>
      )}

      {!compact && data.collocations.length > 0 && (
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Collocations: </span>
          {data.collocations.slice(0, 8).join(", ")}
        </div>
      )}

      <div className="mt-1 flex items-center gap-2">
        <Button size="sm" variant={saved ? "default" : "outline"} disabled={savePending} onClick={handleSave} className="flex-1">
          <Star className={cn("size-3.5", saved && "fill-current")} />
          Lưu từ
        </Button>
        <Button size="sm" variant="ghost" asChild onClick={onNavigate}>
          <Link href={`/dictionary/${encodeURIComponent(data.word)}`}>
            <ExternalLink className="size-3.5" />
            Xem chi tiết
          </Link>
        </Button>
      </div>
    </div>
  );
}
