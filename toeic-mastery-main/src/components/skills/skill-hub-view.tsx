import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface SkillHubItem {
  part: string;
  meta: { label: string; shortLabel: string; slug: string; questionCount: number };
  accuracy: number;
  attempted: number;
  testCount: number;
}

const PART_DESCRIPTIONS: Record<string, string> = {
  PART1: "Nghe mô tả và chọn bức ảnh phù hợp nhất với câu nói.",
  PART2: "Nghe câu hỏi và chọn phản hồi phù hợp nhất trong 3 lựa chọn.",
  PART3: "Nghe đoạn hội thoại giữa 2-3 người và trả lời 3 câu hỏi.",
  PART4: "Nghe bài nói/thông báo ngắn và trả lời 3 câu hỏi.",
  PART5: "Hoàn thành câu với từ/cụm từ phù hợp về ngữ pháp và từ vựng.",
  PART6: "Hoàn thành đoạn văn (email, thông báo, bài viết) với 4 câu hỏi.",
  PART7: "Đọc hiểu đoạn văn đơn, đôi hoặc ba đoạn văn liên quan.",
};

export function SkillHubView({
  title,
  subtitle,
  items,
  basePath,
}: {
  title: string;
  subtitle: string;
  items: SkillHubItem[];
  basePath: "listening" | "reading";
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <Link key={item.part} href={`/${basePath}/${item.meta.slug}`}
            data-tour={basePath === "reading" && item.part === "PART5" ? "reading-part5-card" : undefined}
            className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-soft transition-colors hover:border-primary/40"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold">{item.meta.label}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{PART_DESCRIPTIONS[item.part]}</p>
              </div>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>

            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Độ chính xác</span>
              <span className="font-medium text-foreground">{item.attempted > 0 ? `${Math.round(item.accuracy * 100)}%` : "Chưa có dữ liệu"}</span>
            </div>
            <Progress value={item.accuracy * 100} className="h-1.5" />

            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>{item.testCount} đề luyện tập</span>
              <span>{item.meta.questionCount} câu / đề đầy đủ</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
