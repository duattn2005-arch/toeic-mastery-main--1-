"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ClipboardPaste, Code2, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { importQuestionsAction } from "@/lib/actions/admin-questions";
import { AzotaQuickPasteImporter } from "@/components/admin/azota-quick-paste-importer";

const EXAMPLE = `[
  {
    "part": 5,
    "question": "The marketing team will submit the revised proposal _____ Friday afternoon.",
    "options": ["at", "by", "from", "during"],
    "correctAnswer": "B",
    "explanation": "\\"By + thời điểm\\" diễn tả deadline.",
    "difficulty": "medium"
  }
]`;

export function ImportQuestionsDialog({ testOptions = [] }: { testOptions?: { id: string; title: string }[] }) {
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"json" | "paste">("paste");
  const [json, setJson] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const router = useRouter();

  function handleImportJson() {
    startTransition(async () => {
      const result = await importQuestionsAction(json);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`Đã import ${result.imported} câu hỏi (trạng thái Nháp)`);
      setOpen(false);
      setJson("");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="size-4" /> Import câu hỏi
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] flex-col overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import câu hỏi</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          <Button type="button" variant={mode === "paste" ? "default" : "outline"} size="sm" onClick={() => setMode("paste")}>
            <ClipboardPaste className="size-4" /> Dán nhanh
          </Button>
          <Button type="button" variant={mode === "json" ? "default" : "outline"} size="sm" onClick={() => setMode("json")}>
            <Code2 className="size-4" /> JSON
          </Button>
        </div>

        {mode === "paste" ? (
          <AzotaQuickPasteImporter testOptions={testOptions} onImported={() => setOpen(false)} />
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">
              Dán một object hoặc mảng object theo định dạng dưới đây. Có thể thêm <code>&quot;testId&quot;</code> để gán vào đề thi và{" "}
              <code>&quot;status&quot;: &quot;PUBLISHED&quot;</code> để xuất bản ngay — nếu bỏ trống, câu hỏi sẽ ở trạng thái <b>Nháp</b>.
            </p>
            <Textarea value={json} onChange={(e) => setJson(e.target.value)} rows={12} placeholder={EXAMPLE} className="font-mono text-xs" />
            <DialogFooter>
              <Button variant="outline" onClick={() => setJson(EXAMPLE)}>
                Điền ví dụ
              </Button>
              <Button onClick={handleImportJson} disabled={pending || !json.trim()}>
                {pending && <Loader2 className="size-4 animate-spin" />}
                Import
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
