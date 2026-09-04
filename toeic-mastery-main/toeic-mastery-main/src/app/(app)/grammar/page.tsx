import type { Metadata } from "next";
import Link from "next/link";
import { SpellCheck2 } from "lucide-react";
import { getGrammarTopics } from "@/lib/data/grammar";

export const metadata: Metadata = { title: "Ngữ pháp" };

export default async function GrammarPage() {
  const topics = await getGrammarTopics();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ngữ pháp</h1>
        <p className="mt-1 text-sm text-muted-foreground">Lý thuyết, ví dụ và bài luyện tập cho từng chủ điểm ngữ pháp TOEIC.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((topic) => (
          <Link
            key={topic.id}
            href={`/grammar/${topic.slug}`}
            className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft transition-colors hover:border-primary/40"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <SpellCheck2 className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">{topic.title}</p>
              {topic.summary && <p className="mt-0.5 text-xs text-muted-foreground">{topic.summary}</p>}
              {topic._count.questions > 0 && (
                <p className="mt-1 text-[11px] font-medium text-primary">{topic._count.questions} câu luyện tập</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
