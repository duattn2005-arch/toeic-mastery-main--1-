"use client";

import * as React from "react";
import { ClipboardPaste, ListChecks, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export interface WordRow {
  term: string;
  definition: string;
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

const emptyRow = (): WordRow => ({ term: "", definition: "" });

/**
 * Quizlet-style word list editor — row-by-row manual entry, or paste a whole
 * block of text (from Word/Excel/Sheets) with configurable term/definition
 * and card delimiters, auto-parsed into rows with a live preview count.
 * Shared by the admin vocabulary page and the learner's saved-words page —
 * only the submit handler and labels differ between the two.
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
  const [mode, setMode] = React.useState<"rows" | "import">("rows");
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
    setRows(previewRows);
    setMode("rows");
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
      <div className="flex gap-2">
        <Button type="button" variant={mode === "rows" ? "default" : "outline"} size="sm" onClick={() => setMode("rows")}>
          <ListChecks className="size-4" /> Nhập từng thẻ
        </Button>
        <Button type="button" variant={mode === "import" ? "default" : "outline"} size="sm" onClick={() => setMode("import")}>
          <ClipboardPaste className="size-4" /> Dán nhanh
        </Button>
      </div>

      {mode === "import" ? (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
          <div>
            <Label htmlFor="word-paste">Dán dữ liệu (từ Word, Excel, Google Docs,...)</Label>
            <Textarea
              id="word-paste"
              rows={8}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={"Từ 1\tĐịnh nghĩa 1\nTừ 2\tĐịnh nghĩa 2\nTừ 3\tĐịnh nghĩa 3"}
              className="mt-1.5 font-mono text-sm"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-xs font-semibold text-muted-foreground">GIỮA THUẬT NGỮ VÀ ĐỊNH NGHĨA</p>
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
          <p className="text-sm font-medium">Xem trước: {previewRows.length} thẻ</p>
          <Button type="button" onClick={applyImport} disabled={previewRows.length === 0} className="self-start">
            Nhập {previewRows.length} thẻ
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {rows.map((row, i) => (
            <div key={i} className="flex items-start gap-2 rounded-xl border border-border bg-card p-3">
              <span className="mt-2.5 w-5 shrink-0 text-center text-xs text-muted-foreground">{i + 1}</span>
              <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                <Input placeholder={termLabel} value={row.term} onChange={(e) => updateRow(i, "term", e.target.value)} />
                <Input placeholder={definitionLabel} value={row.definition} onChange={(e) => updateRow(i, "definition", e.target.value)} />
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(i)} disabled={rows.length <= 1} aria-label="Xóa thẻ">
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addRow} className="self-start">
            <Plus className="size-4" /> Thêm thẻ
          </Button>
        </div>
      )}

      <Button type="button" onClick={handleSubmit} disabled={pending} className="self-start">
        {pending && <Loader2 className="size-4 animate-spin" />} {submitLabel}
      </Button>
    </div>
  );
}
