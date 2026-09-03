"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { importQuestionsAction } from "@/lib/actions/admin-questions";
import { parseAzotaQuestions } from "@/lib/services/azota-question-parser";
import { TEST_PART_VALUES } from "@/lib/validations/admin";
import { PART_META } from "@/lib/constants/toeic";

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

const NO_EXPLANATION_PLACEHOLDER = "(Chưa có giải thích — vui lòng bổ sung)";

/**
 * Azota-style "paste the whole thing" question importer — shared by the
 * questions list page's import dialog and the single-question add page
 * (Part 5-7 admins mostly want to paste several questions at once rather
 * than type one by one). Reuses the same importQuestionsAction pipeline as
 * strict JSON import, just producing that JSON from parsed pasted text.
 */
export function AzotaQuickPasteImporter({
  defaultPart = "PART5",
  defaultTestId = "",
  testOptions = [],
  onImported,
}: {
  defaultPart?: (typeof TEST_PART_VALUES)[number];
  defaultTestId?: string;
  testOptions?: { id: string; title: string }[];
  onImported?: () => void;
}) {
  const [pasteText, setPasteText] = React.useState("");
  const [part, setPart] = React.useState<(typeof TEST_PART_VALUES)[number]>(defaultPart);
  const [testId, setTestId] = React.useState(defaultTestId);
  const [status, setStatus] = React.useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [pending, startTransition] = React.useTransition();
  const router = useRouter();

  const parsed = React.useMemo(() => parseAzotaQuestions(pasteText), [pasteText]);

  function handleImport() {
    if (parsed.questions.length === 0) return;
    const partNumber = Number(part.replace("PART", ""));
    const payload = parsed.questions.map((q) => ({
      part: partNumber,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: NO_EXPLANATION_PLACEHOLDER,
      testId: testId || undefined,
      status,
    }));

    startTransition(async () => {
      const result = await importQuestionsAction(JSON.stringify(payload));
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        status === "PUBLISHED"
          ? `Đã import và xuất bản ${result.imported} câu hỏi.`
          : `Đã import ${result.imported} câu hỏi (trạng thái Nháp) — nhớ bổ sung giải thích trước khi xuất bản.`
      );
      setPasteText("");
      router.refresh();
      onImported?.();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        Dán đề dạng &quot;Câu N. ... A. ... B. ...&quot; — đánh dấu đáp án đúng bằng dấu <b>*</b> trước chữ cái (VD: <code>*B. by</code>) hoặc{" "}
        <b>in đậm</b> (VD: <code>**by**</code>). Có thể dán nhiều câu cùng lúc.
      </p>
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
          <Label className="mb-1.5">Trạng thái sau import</Label>
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
      <Textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} rows={12} placeholder={AZOTA_EXAMPLE} className="font-mono text-xs" />
      <p className="text-sm font-medium">
        Nhận diện được <span className="text-success">{parsed.questions.length} câu</span>
        {parsed.skippedCount > 0 && <span className="text-destructive"> · bỏ qua {parsed.skippedCount} câu (thiếu đáp án đúng hoặc thiếu lựa chọn)</span>}
      </p>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => setPasteText(AZOTA_EXAMPLE)}>
          Điền ví dụ
        </Button>
        <Button type="button" onClick={handleImport} disabled={pending || parsed.questions.length === 0}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Import {parsed.questions.length} câu
        </Button>
      </div>
    </div>
  );
}
