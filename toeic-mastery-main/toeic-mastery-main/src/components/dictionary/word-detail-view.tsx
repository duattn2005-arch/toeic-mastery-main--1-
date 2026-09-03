"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star, StickyNote } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { WordAudioButton } from "@/components/dictionary/word-audio-button";
import { toggleSaveWordAction, toggleFavoriteWordAction, updateSavedWordNoteAction } from "@/lib/actions/dictionary";
import type { DictionaryResult } from "@/lib/types/dictionary";

export function WordDetailView({
  result,
  initialSaved,
  initialFavorite,
  initialNote,
}: {
  result: DictionaryResult;
  initialSaved: boolean;
  initialFavorite: boolean;
  initialNote: string;
}) {
  const router = useRouter();
  const [saved, setSaved] = React.useState(initialSaved);
  const [favorite, setFavorite] = React.useState(initialFavorite);
  const [note, setNote] = React.useState(initialNote);
  const [savingNote, startNoteTransition] = React.useTransition();
  const [pending, startTransition] = React.useTransition();

  function handleSave() {
    startTransition(async () => {
      const res = await toggleSaveWordAction(result.word);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setSaved(!!res.saved);
      router.refresh();
    });
  }

  function handleFavorite() {
    if (!saved) {
      toast.info("Hãy lưu từ trước khi đánh dấu yêu thích");
      return;
    }
    startTransition(async () => {
      const res = await toggleFavoriteWordAction(result.word);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setFavorite((f) => !f);
    });
  }

  function handleSaveNote() {
    startNoteTransition(async () => {
      const res = await updateSavedWordNoteAction(result.word, note);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Đã lưu ghi chú");
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-3">
              <h1 className="text-3xl font-semibold">{result.word}</h1>
              {result.partOfSpeech && <Badge variant="secondary">{result.partOfSpeech}</Badge>}
            </div>
            {result.ipa && <p className="mt-1 text-sm text-muted-foreground">/{result.ipa.replace(/\//g, "")}/</p>}
            {result.meaningVi && <p className="mt-2 text-lg font-medium text-primary">{result.meaningVi}</p>}
          </div>
          <div className="flex items-center gap-2">
            <WordAudioButton word={result.word} audioUrl={result.audioUrlUs} region="US" />
            <WordAudioButton word={result.word} audioUrl={result.audioUrlUk} region="UK" />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button variant={saved ? "default" : "outline"} size="sm" disabled={pending} onClick={handleSave}>
            <Star className={saved ? "size-4 fill-current" : "size-4"} /> {saved ? "Đã lưu" : "Lưu từ"}
          </Button>
          <Button variant={favorite ? "default" : "outline"} size="sm" disabled={pending} onClick={handleFavorite}>
            <Star className={favorite ? "size-4 fill-current" : "size-4"} /> Yêu thích
          </Button>
        </div>
      </div>

      {result.definitions.length > 0 && (
        <Section title="Định nghĩa">
          <ol className="flex flex-col gap-3">
            {result.definitions.map((d, i) => (
              <li key={i} className="text-sm">
                <span className="mr-1.5 text-xs font-medium text-muted-foreground">{d.partOfSpeech}</span>
                {d.definition}
                {d.example && <p className="mt-0.5 pl-4 text-xs italic text-muted-foreground">&quot;{d.example}&quot;</p>}
              </li>
            ))}
          </ol>
        </Section>
      )}

      {result.examples.length > 0 && (
        <Section title="Ví dụ">
          <ul className="flex flex-col gap-2 text-sm">
            {result.examples.map((ex, i) => (
              <li key={i} className="rounded-lg bg-accent/40 p-2.5">
                <p>{ex.en}</p>
                {ex.vi && <p className="mt-0.5 text-muted-foreground">{ex.vi}</p>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {result.synonyms.length > 0 && (
          <Section title="Đồng nghĩa (Synonyms)">
            <div className="flex flex-wrap gap-1.5">
              {result.synonyms.map((s) => (
                <Badge key={s} variant="outline">
                  {s}
                </Badge>
              ))}
            </div>
          </Section>
        )}
        {result.antonyms.length > 0 && (
          <Section title="Trái nghĩa (Antonyms)">
            <div className="flex flex-wrap gap-1.5">
              {result.antonyms.map((s) => (
                <Badge key={s} variant="outline">
                  {s}
                </Badge>
              ))}
            </div>
          </Section>
        )}
      </div>

      {result.collocations.length > 0 && (
        <Section title="Collocations">
          <div className="flex flex-wrap gap-1.5">
            {result.collocations.map((c) => (
              <Badge key={c} variant="outline">
                {c}
              </Badge>
            ))}
          </div>
        </Section>
      )}

      <Section title="Ghi chú của bạn">
        <div className="flex flex-col gap-2.5">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Thêm ghi chú cá nhân cho từ này..." />
          <Button size="sm" variant="outline" className="self-start" onClick={handleSaveNote} disabled={savingNote || !saved}>
            {savingNote ? <Loader2 className="size-3.5 animate-spin" /> : <StickyNote className="size-3.5" />}
            Lưu ghi chú
          </Button>
          {!saved && <p className="text-xs text-muted-foreground">Lưu từ trước để thêm ghi chú.</p>}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}
