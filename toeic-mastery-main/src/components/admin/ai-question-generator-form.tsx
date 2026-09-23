"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateAiQuestionsAction } from "@/lib/actions/admin-ai-questions";
import { PART_META, DIFFICULTY_LABEL_VI } from "@/lib/constants/toeic";
import type { Difficulty, TestPart } from "@/generated/prisma/enums";

// PART1 excluded — see ai-question-generator.ts's top comment (needs a real
// photo, which nothing here can fabricate).
const SELECTABLE_PARTS: TestPart[] = ["PART2", "PART3", "PART4", "PART5", "PART6", "PART7"];
const GROUPED_PARTS = new Set<TestPart>(["PART3", "PART4", "PART6", "PART7"]);
const DIFFICULTIES: Difficulty[] = ["EASY", "MEDIUM", "HARD"];

export function AiQuestionGeneratorForm() {
  const router = useRouter();
  const [part, setPart] = React.useState<TestPart>("PART5");
  const [difficulty, setDifficulty] = React.useState<Difficulty>("HARD");
  const [count, setCount] = React.useState(5);
  const [pending, startTransition] = React.useTransition();
  const [lastResult, setLastResult] = React.useState<{ part: TestPart; attempted: number; saved: number } | null>(null);

  const isGrouped = GROUPED_PARTS.has(part);
  const maxCount = isGrouped ? 5 : 10;

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateAiQuestionsAction(part, difficulty, count);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      const saved = result.saved ?? 0;
      const attempted = result.attempted ?? 0;
      toast.success(
        saved === attempted
          ? `Đã tạo ${saved} câu hỏi (Nháp) — vượt qua bước AI tự xác thực.`
          : `Đã tạo ${saved}/${attempted} câu (Nháp) — ${attempted - saved} câu bị loại vì AI tự kiểm tra lại không khớp đáp án.`
      );
      setLastResult({ part, attempted, saved });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div>
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Sparkles className="size-4 text-primary" /> AI tự sinh câu hỏi
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          AI soạn câu hỏi rồi <b>tự giải lại độc lập</b> để kiểm tra đáp án trước khi lưu — chỉ câu nào AI tự xác nhận đúng mới được lưu, ở trạng thái{" "}
          <b>Nháp</b>. Bạn vẫn cần xem lại và bấm &quot;Xuất bản&quot; thì học viên mới thấy được.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label>Part</Label>
          <Select value={part} onValueChange={(v) => setPart(v as TestPart)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SELECTABLE_PARTS.map((p) => (
                <SelectItem key={p} value={p}>
                  {PART_META[p].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Độ khó</Label>
          <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTIES.map((d) => (
                <SelectItem key={d} value={d}>
                  {DIFFICULTY_LABEL_VI[d]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>{isGrouped ? "Số bộ đề (mỗi bộ 3-4 câu)" : "Số câu hỏi"}</Label>
          <Input
            type="number"
            min={1}
            max={maxCount}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(maxCount, Number(e.target.value) || 1)))}
          />
        </div>
      </div>

      {isGrouped && (
        <p className="text-xs text-muted-foreground">
          {PART_META[part].label} cần một bài {part === "PART3" || part === "PART4" ? "nghe" : "đọc"} chung kèm nhiều câu hỏi — AI sẽ soạn cả bài lẫn câu
          hỏi liên quan trong 1 bộ.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={handleGenerate} disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {pending ? "Đang sinh và tự kiểm chứng…" : "Sinh câu hỏi"}
        </Button>
        {lastResult && (
          <Link
            href={`/admin/questions?status=DRAFT&part=${lastResult.part}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            Xem {lastResult.saved} câu vừa tạo để duyệt →
          </Link>
        )}
      </div>
      {pending && <p className="text-xs text-muted-foreground">Mỗi câu cần 1 lượt AI tự kiểm tra lại riêng, có thể mất khoảng 30 giây - vài phút.</p>}
    </div>
  );
}
