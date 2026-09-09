"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { MediaThumbUploader } from "@/components/admin/media-thumb-uploader";
import { ImportGuideCallout } from "@/components/admin/import-guide-callout";
import { importQuestionsAction } from "@/lib/actions/admin-questions";
import { parseAzotaQuestions } from "@/lib/services/azota-question-parser";
import { TEST_PART_VALUES } from "@/lib/validations/admin";
import { PART_META } from "@/lib/constants/toeic";

const OPTION_LABELS = ["A", "B", "C", "D"] as const;
const NO_EXPLANATION_PLACEHOLDER = "(Chưa có giải thích — vui lòng bổ sung)";

const AZOTA_EXAMPLE = `Câu 1. The marketing team will submit the revised proposal _____ Friday afternoon.
A. at
*B. by
C. from
D. during

Câu 2. All visitors must sign in at the front _____ before entering the building.
A. **reception**
B. receptive
C. receptively
D. receive`;

interface QuestionRow {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  imageUrl: string;
  audioUrl: string;
}

const emptyRow = (): QuestionRow => ({ prompt: "", options: ["", "", "", ""], correctIndex: 0, explanation: "", imageUrl: "", audioUrl: "" });

/**
 * Quizlet-card-style question editor — one numbered card per question, each
 * fully editable (prompt, options with a correct-answer toggle, image/audio,
 * explanation), same as the vocabulary card list. "+ Nhập" pastes an
 * Azota-style block into a preview, then hands the parsed questions to these
 * same editable cards (rather than writing straight to the database) so an
 * admin can fix a mis-parsed option or add missing media/explanations before
 * the single final save — mirrors manual entry exactly.
 */
export function QuestionCardListEditor({
  testOptions,
  defaultTestId = "",
}: {
  testOptions: { id: string; title: string }[];
  defaultTestId?: string;
}) {
  const [rows, setRows] = React.useState<QuestionRow[]>(() => [emptyRow()]);
  const [part, setPart] = React.useState<(typeof TEST_PART_VALUES)[number]>("PART5");
  const [testId, setTestId] = React.useState(defaultTestId);
  const [status, setStatus] = React.useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [importOpen, setImportOpen] = React.useState(false);
  const [pasteText, setPasteText] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const router = useRouter();

  const parsed = React.useMemo(() => parseAzotaQuestions(pasteText), [pasteText]);

  function applyImport() {
    if (parsed.questions.length === 0) return;
    setRows(
      parsed.questions.map((q) => ({
        prompt: q.question,
        options: q.options,
        correctIndex: Math.max(0, q.options.findIndex((_, i) => OPTION_LABELS[i] === q.correctAnswer)),
        explanation: "",
        imageUrl: "",
        audioUrl: "",
      }))
    );
    setImportOpen(false);
    setPasteText("");
  }

  function updateRow<K extends keyof QuestionRow>(i: number, field: K, value: QuestionRow[K]) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  }
  function updateOption(i: number, oi: number, value: string) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, options: r.options.map((o, k) => (k === oi ? value : o)) } : r)));
  }
  function addOption(i: number) {
    setRows((prev) => prev.map((r, idx) => (idx === i && r.options.length < 4 ? { ...r, options: [...r.options, ""] } : r)));
  }
  function removeOption(i: number, oi: number) {
    setRows((prev) =>
      prev.map((r, idx) => {
        if (idx !== i || r.options.length <= 2) return r;
        const options = r.options.filter((_, k) => k !== oi);
        const correctIndex = r.correctIndex === oi ? 0 : r.correctIndex > oi ? r.correctIndex - 1 : r.correctIndex;
        return { ...r, options, correctIndex };
      })
    );
  }
  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }
  function removeRow(i: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));
  }
  function clearAll() {
    setRows([emptyRow()]);
  }

  function handleSubmit() {
    const payload = rows
      .filter((r) => r.prompt.trim() && r.options.filter((o) => o.trim()).length >= 2)
      .map((r) => ({
        part: Number(part.replace("PART", "")),
        question: r.prompt.trim(),
        options: r.options.map((o) => o.trim()).filter(Boolean),
        correctAnswer: OPTION_LABELS[r.correctIndex],
        explanation: r.explanation.trim() || NO_EXPLANATION_PLACEHOLDER,
        imageUrl: r.imageUrl || undefined,
        audioUrl: r.audioUrl || undefined,
        testId: testId || undefined,
        status,
      }));

    if (payload.length === 0) {
      toast.error("Cần ít nhất 1 câu hỏi có đủ câu hỏi và tối thiểu 2 lựa chọn");
      return;
    }

    startTransition(async () => {
      const result = await importQuestionsAction(JSON.stringify(payload));
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        status === "PUBLISHED" ? `Đã tạo và xuất bản ${payload.length} câu hỏi.` : `Đã lưu ${payload.length} câu hỏi (trạng thái Nháp).`
      );
      setRows([emptyRow()]);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <Label className="mb-1.5">Part</Label>
          <Select value={part} onValueChange={(v) => setPart(v as (typeof TEST_PART_VALUES)[number])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TEST_PART_VALUES.map((p) => (
                <SelectItem key={p} value={p}>
                  {PART_META[p].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1.5">Thuộc đề thi (không bắt buộc)</Label>
          <Select value={testId || "none"} onValueChange={(v) => setTestId(v === "none" ? "" : v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Chưa gán —</SelectItem>
              {testOptions.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1.5">Trạng thái</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as "DRAFT" | "PUBLISHED")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Nháp (duyệt sau)</SelectItem>
              <SelectItem value="PUBLISHED">Xuất bản ngay</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
        <div className="flex flex-col gap-0.5">
          <Button type="button" onClick={() => setImportOpen(true)} className="w-fit shadow-sm">
            <Upload className="size-4" /> Nhập nhiều câu cùng lúc
          </Button>
          <p className="text-xs text-muted-foreground">Dán cả đề đã soạn sẵn thay vì gõ tay từng câu — xem thêm hướng dẫn trong popup.</p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="ghost" size="icon" title="Xóa tất cả" className="text-destructive hover:text-destructive">
              <Trash2 className="size-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xóa tất cả câu hỏi?</AlertDialogTitle>
              <AlertDialogDescription>Toàn bộ {rows.length} câu đang nhập sẽ bị xóa khỏi danh sách này (chưa lưu vào hệ thống).</AlertDialogDescription>
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
                aria-label="Xóa câu hỏi"
                className="size-7"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            <div className="flex flex-col gap-4 p-4">
              <div className="flex flex-col gap-1.5">
                <Textarea rows={2} value={row.prompt} onChange={(e) => updateRow(i, "prompt", e.target.value)} className="bg-muted/40" />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Câu hỏi</span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
                <div className="flex flex-col gap-2">
                  {row.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2 rounded-xl border border-border bg-background p-2">
                      <button
                        type="button"
                        onClick={() => updateRow(i, "correctIndex", oi)}
                        className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                          row.correctIndex === oi ? "border-success bg-success text-white" : "border-input text-muted-foreground"
                        }`}
                        title="Đánh dấu là đáp án đúng"
                      >
                        {OPTION_LABELS[oi]}
                      </button>
                      <Input value={opt} onChange={(e) => updateOption(i, oi, e.target.value)} className="flex-1 bg-muted/40" />
                      {row.options.length > 2 && (
                        <Button type="button" variant="ghost" size="icon" className="size-7 shrink-0" onClick={() => removeOption(i, oi)}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {row.options.length < 4 && (
                    <button type="button" onClick={() => addOption(i)} className="self-start text-xs font-medium text-primary hover:underline">
                      + Thêm lựa chọn
                    </button>
                  )}
                </div>
                <div className="flex items-start gap-2">
                  <MediaThumbUploader kind="image" value={row.imageUrl} onChange={(url) => updateRow(i, "imageUrl", url)} label="Ảnh (Part 1, bảng biểu)" />
                  <MediaThumbUploader kind="audio" value={row.audioUrl} onChange={(url) => updateRow(i, "audioUrl", url)} label="Audio (Part 1-4)" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Textarea
                  rows={2}
                  value={row.explanation}
                  onChange={(e) => updateRow(i, "explanation", e.target.value)}
                  placeholder="Có thể bổ sung sau"
                  className="bg-muted/40"
                />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Giải thích (tiếng Việt)</span>
              </div>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addRow} className="self-start">
          <Plus className="size-4" /> Thêm câu hỏi
        </Button>
      </div>

      <Button type="button" onClick={handleSubmit} disabled={pending} className="self-start">
        {pending && <Loader2 className="size-4 animate-spin" />}
        Lưu tất cả câu hỏi
      </Button>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Nhập dữ liệu</DialogTitle>
            <DialogDescription>Dán nhiều câu hỏi cùng lúc, hệ thống tự tách thành từng thẻ để bạn chỉnh sửa trước khi lưu.</DialogDescription>
          </DialogHeader>

          <ImportGuideCallout>
            <p className="font-medium">Định dạng cần dán</p>
            <p className="text-muted-foreground">
              Mỗi câu bắt đầu bằng dòng &quot;Câu N.&quot; (hoặc &quot;Question N.&quot;), theo sau là 2-4 dòng lựa chọn A./B./C./D. — đánh dấu
              đáp án đúng bằng dấu <b>*</b> trước chữ cái (VD: <code className="rounded bg-background px-1.5 py-0.5">*B. by</code>) hoặc{" "}
              <b>in đậm</b> (VD: <code className="rounded bg-background px-1.5 py-0.5">**by**</code>). Bấm &quot;Điền ví dụ&quot; bên dưới để xem
              mẫu.
            </p>
          </ImportGuideCallout>

          <Textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} rows={12} placeholder={AZOTA_EXAMPLE} className="font-mono text-xs" />
          <p className="text-sm font-medium">
            Nhận diện được <span className="text-success">{parsed.questions.length} câu</span>
            {parsed.skippedCount > 0 && <span className="text-destructive"> · bỏ qua {parsed.skippedCount} câu (thiếu đáp án đúng hoặc thiếu lựa chọn)</span>}
          </p>

          <DialogFooter className="sm:justify-between">
            <Button type="button" variant="outline" onClick={() => setPasteText(AZOTA_EXAMPLE)} className="sm:mr-auto">
              Điền ví dụ
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setImportOpen(false)}>
                Hủy nhập
              </Button>
              <Button type="button" onClick={applyImport} disabled={parsed.questions.length === 0}>
                Nhập {parsed.questions.length > 0 ? parsed.questions.length : ""} câu
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
