"use client";

import * as React from "react";
import { ArrowLeftRight, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MediaThumbUploader } from "@/components/admin/media-thumb-uploader";
import { ImportGuideCallout } from "@/components/admin/import-guide-callout";

export interface WordRow {
  term: string;
  definition: string;
  imageUrl?: string;
  audioUrl?: string;
}

type Delimiter = "tab" | "comma" | "custom";
type CardDelimiter = "newline" | "semicolon" | "custom";

function resolveDelimiter(kind: Delimiter, custom: string): string {
  if (kind === "tab") return "\t";
  if (kind === "comma") return ",";
  return custom;
}
function resolveCardDelimiter(kind: CardDelimiter, custom: string): string {
  if (kind === "newline") return "\n";
  if (kind === "semicolon") return ";";
  return custom;
}

function parsePaste(text: string, termDefSep: string, cardSep: string): WordRow[] {
  if (!termDefSep || !cardSep || !text.trim()) return [];
  return text
    .split(cardSep)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(termDefSep);
      if (idx === -1) return { term: line.trim(), definition: "" };
      return { term: line.slice(0, idx).trim(), definition: line.slice(idx + termDefSep.length).trim() };
    })
    .filter((r) => r.term);
}

const emptyRow = (): WordRow => ({ term: "", definition: "", imageUrl: "", audioUrl: "" });

/**
 * Quizlet-style card list editor — one numbered card per term, each with an
 * image and audio slot, plus a "Nhập" modal that parses a whole pasted block
 * (from Word/Excel/Sheets) with configurable term/definition and card
 * delimiters into a live preview before replacing the card list. Shared by
 * the admin vocabulary page and the learner's saved-words page — only the
 * submit handler and labels differ between the two.
 */
export function WordListEditor({
  onSubmit,
  submitLabel = "Lưu tất cả",
  termLabel = "Thuật ngữ",
  definitionLabel = "Định nghĩa",
}: {
  onSubmit: (rows: WordRow[]) => Promise<{ error?: string } | void>;
  submitLabel?: string;
  termLabel?: string;
  definitionLabel?: string;
}) {
  const [rows, setRows] = React.useState<WordRow[]>(() => [emptyRow(), emptyRow()]);
  const [importOpen, setImportOpen] = React.useState(false);
  const [pasteText, setPasteText] = React.useState("");
  const [termDefKind, setTermDefKind] = React.useState<Delimiter>("tab");
  const [termDefCustom, setTermDefCustom] = React.useState("");
  const [cardKind, setCardKind] = React.useState<CardDelimiter>("newline");
  const [cardCustom, setCardCustom] = React.useState("");
  const [pending, setPending] = React.useState(false);

  const previewRows = React.useMemo(
    () => parsePaste(pasteText, resolveDelimiter(termDefKind, termDefCustom), resolveCardDelimiter(cardKind, cardCustom)),
    [pasteText, termDefKind, termDefCustom, cardKind, cardCustom]
  );

  function applyImport() {
    if (previewRows.length === 0) return;
    setRows(previewRows.map((r) => ({ ...r, imageUrl: "", audioUrl: "" })));
    setImportOpen(false);
    setPasteText("");
  }

  function updateRow(i: number, field: keyof WordRow, value: string) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  }
  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }
  function removeRow(i: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));
  }
  function swapAll() {
    setRows((prev) => prev.map((r) => ({ ...r, term: r.definition, definition: r.term })));
  }
  function clearAll() {
    setRows([emptyRow(), emptyRow()]);
  }

  async function handleSubmit() {
    const valid = rows.filter((r) => r.term.trim() && r.definition.trim());
    if (valid.length === 0) {
      toast.error("Cần ít nhất 1 từ có đủ thuật ngữ và định nghĩa");
      return;
    }
    setPending(true);
    const result = await onSubmit(valid);
    setPending(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`Đã thêm ${valid.length} từ`);
    setRows([emptyRow(), emptyRow()]);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
        <div className="flex flex-col gap-0.5">
          <Button type="button" onClick={() => setImportOpen(true)} className="w-fit shadow-sm">
            <Upload className="size-4" /> Nhập nhiều thẻ cùng lúc
          </Button>
          <p className="text-xs text-muted-foreground">Dán từ Excel/Word thay vì gõ tay từng thẻ — xem thêm hướng dẫn trong popup.</p>
        </div>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon" onClick={swapAll} title={`Đổi chỗ ${termLabel} / ${definitionLabel}`}>
            <ArrowLeftRight className="size-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="ghost" size="icon" title="Xóa tất cả" className="text-destructive hover:text-destructive">
                <Trash2 className="size-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xóa tất cả thẻ?</AlertDialogTitle>
                <AlertDialogDescription>Toàn bộ {rows.length} thẻ đang nhập sẽ bị xóa khỏi danh sách này (chưa lưu vào hệ thống).</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={clearAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Xóa tất cả
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {rows.map((row, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <span className="text-sm font-semibold text-muted-foreground">{i + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeRow(i)}
                disabled={rows.length <= 1}
                aria-label="Xóa thẻ"
                className="size-7"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-[1fr_1.3fr_auto]">
              <div className="flex flex-col gap-1.5">
                <Input value={row.term} onChange={(e) => updateRow(i, "term", e.target.value)} className="bg-muted/40" />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{termLabel}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <Textarea rows={3} value={row.definition} onChange={(e) => updateRow(i, "definition", e.target.value)} className="bg-muted/40" />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{definitionLabel}</span>
              </div>
              <div className="flex items-start gap-2">
                <MediaThumbUploader kind="image" value={row.imageUrl ?? ""} onChange={(url) => updateRow(i, "imageUrl", url)} label="Ảnh minh họa" />
                <MediaThumbUploader kind="audio" value={row.audioUrl ?? ""} onChange={(url) => updateRow(i, "audioUrl", url)} label="Audio phát âm" />
              </div>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addRow} className="self-start">
          <Plus className="size-4" /> Thêm thẻ
        </Button>
      </div>

      <Button type="button" onClick={handleSubmit} disabled={pending} className="self-start">
        {pending && <Loader2 className="size-4 animate-spin" />} {submitLabel}
      </Button>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Nhập dữ liệu</DialogTitle>
            <DialogDescription>Chép và dán dữ liệu ở đây (từ Word, Excel, Google Docs, v.v.)</DialogDescription>
          </DialogHeader>

          <ImportGuideCallout>
            <p className="font-medium">Mẹo dán nhanh</p>
            <p className="text-muted-foreground">
              Copy nguyên 2 cột ({termLabel.toLowerCase()} và {definitionLabel.toLowerCase()}) từ Excel/Google Sheets/Word rồi dán thẳng vào ô bên
              dưới — mỗi dòng tự tách thành 1 thẻ, dấu Tab giữa 2 cột tự phân tách {termLabel.toLowerCase()}/{definitionLabel.toLowerCase()}. Dữ
              liệu khác định dạng (dùng dấu phẩy, chấm phẩy...) thì chọn lại dấu phân tách bên dưới.
            </p>
            <p className="text-muted-foreground">
              Ví dụ: <code className="rounded bg-background px-1.5 py-0.5">hello&nbsp;&nbsp;&nbsp;xin chào</code>
            </p>
          </ImportGuideCallout>

          <Textarea
            rows={8}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={`${termLabel} 1\t${definitionLabel} 1\n${termLabel} 2\t${definitionLabel} 2\n${termLabel} 3\t${definitionLabel} 3`}
            className="font-mono text-sm"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-xs font-semibold text-muted-foreground">GIỮA {termLabel.toUpperCase()} VÀ {definitionLabel.toUpperCase()}</p>
              <RadioGroup value={termDefKind} onValueChange={(v) => setTermDefKind(v as Delimiter)} className="gap-1.5">
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="tab" /> Tab
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="comma" /> Phẩy
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="custom" />
                  <Input
                    placeholder="Tùy chỉnh"
                    value={termDefCustom}
                    onFocus={() => setTermDefKind("custom")}
                    onChange={(e) => {
                      setTermDefCustom(e.target.value);
                      setTermDefKind("custom");
                    }}
                    className="h-8"
                  />
                </label>
              </RadioGroup>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold text-muted-foreground">GIỮA CÁC THẺ</p>
              <RadioGroup value={cardKind} onValueChange={(v) => setCardKind(v as CardDelimiter)} className="gap-1.5">
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="newline" /> Dòng mới
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="semicolon" /> Chấm phẩy
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="custom" />
                  <Input
                    placeholder="Tùy chỉnh"
                    value={cardCustom}
                    onFocus={() => setCardKind("custom")}
                    onChange={(e) => {
                      setCardCustom(e.target.value);
                      setCardKind("custom");
                    }}
                    className="h-8"
                  />
                </label>
              </RadioGroup>
            </div>
          </div>

          <div>
            <Label className="mb-2">
              Xem trước <span className="font-normal text-muted-foreground">{previewRows.length} thẻ</span>
            </Label>
            <div className="max-h-56 overflow-y-auto rounded-xl border border-border">
              {previewRows.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">Chưa có dữ liệu để xem trước.</p>
              ) : (
                previewRows.map((r, i) => (
                  <div key={i} className="flex items-start gap-3 border-b border-border p-3 last:border-0">
                    <span className="mt-2 w-4 shrink-0 text-center text-xs text-muted-foreground">{i + 1}</span>
                    <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-lg bg-muted/50 px-3 py-2">
                        <p className="text-sm">{r.term}</p>
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{termLabel}</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 px-3 py-2">
                        <p className="text-sm">{r.definition}</p>
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{definitionLabel}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setImportOpen(false)}>
              Hủy nhập
            </Button>
            <Button type="button" onClick={applyImport} disabled={previewRows.length === 0}>
              Nhập {previewRows.length > 0 ? previewRows.length : ""} thẻ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
