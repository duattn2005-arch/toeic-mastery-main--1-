import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { GraduationCap } from "lucide-react";

interface DueWord {
  vocabularyWord: { word: string; meaningVi: string; partOfSpeech: string | null };
}

export function DueWordList({ words }: { words: DueWord[] }) {
  if (words.length === 0) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="Không có từ nào cần ôn hôm nay"
        description="Hãy khám phá thêm chủ đề từ vựng mới."
        actionLabel="Khám phá từ vựng"
        actionHref="/vocabulary/topics"
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {words.map((w) => (
          <div key={w.vocabularyWord.word} className="flex items-center justify-between rounded-xl border border-border bg-card px-3.5 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{w.vocabularyWord.word}</p>
              <p className="truncate text-xs text-muted-foreground">{w.vocabularyWord.meaningVi}</p>
            </div>
            {w.vocabularyWord.partOfSpeech && (
              <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {w.vocabularyWord.partOfSpeech}
              </span>
            )}
          </div>
        ))}
      </div>
      <Button asChild className="mt-1">
        <Link href="/vocabulary/review">Ôn tập ngay</Link>
      </Button>
    </div>
  );
}
