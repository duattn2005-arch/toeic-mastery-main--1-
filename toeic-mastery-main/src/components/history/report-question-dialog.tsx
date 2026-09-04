"use client";

import * as React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { reportQuestionAction } from "@/lib/actions/reports";

const REASONS = [
  { value: "wrong_answer", label: "Đáp án không chính xác" },
  { value: "unclear_question", label: "Câu hỏi không rõ ràng" },
  { value: "audio_issue", label: "Lỗi audio" },
  { value: "typo", label: "Lỗi chính tả / nội dung" },
  { value: "other", label: "Khác" },
];

export function ReportQuestionDialog({ questionId }: { questionId: string }) {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("wrong_answer");
  const [message, setMessage] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function handleSubmit() {
    startTransition(async () => {
      const result = await reportQuestionAction({ questionId, reason, message: message || undefined });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Cảm ơn bạn đã báo lỗi. Đội ngũ nội dung sẽ kiểm tra sớm.");
      setOpen(false);
      setMessage("");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          <AlertTriangle className="size-3.5" /> Báo lỗi
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Báo lỗi câu hỏi</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Loại lỗi</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Mô tả thêm (không bắt buộc)</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Mô tả chi tiết vấn đề bạn gặp phải..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Gửi báo cáo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
