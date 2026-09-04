import Link from "next/link";
import { Layers } from "lucide-react";
import type { getVocabularyTopics } from "@/lib/data/vocabulary";

export type VocabularyTopicRow = Awaited<ReturnType<typeof getVocabularyTopics>>[number];

export const UNCATEGORIZED_LABEL = "Theo chủ đề";

/** Section/tab order: familiar context-based topics first, then the
 * band/Part/fixed-phrase groupings — any future category not listed here
 * falls back to appearing after these, in first-appearance order. */
export const CATEGORY_ORDER = [UNCATEGORIZED_LABEL, "Theo band điểm", "Theo Part", "Cụm từ cố định & thường gặp"];

export function groupTopicsByCategory(topics: VocabularyTopicRow[]) {
  const sections = new Map<string, VocabularyTopicRow[]>();
  for (const topic of topics) {
    const key = topic.category ?? UNCATEGORIZED_LABEL;
    const bucket = sections.get(key);
    if (bucket) bucket.push(topic);
    else sections.set(key, [topic]);
  }
  const orderedKeys = [...sections.keys()].sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a);
    const ib = CATEGORY_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return 0;
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
  return { sections, orderedKeys };
}

/** A flat grid of topic cards — no section heading, so it can be reused
 * standalone inside a single tab (VocabularyTabs) or wrapped in a
 * <section> per category (TopicSectionGrid). */
export function TopicGrid({ topics }: { topics: VocabularyTopicRow[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {topics.map((topic) => (
        <Link
          key={topic.id}
          href={`/vocabulary/topic/${topic.slug}`}
          className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft transition-colors hover:border-primary/40"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Layers className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold">{topic.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{topic._count.words} từ</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

/** Every vocabulary topic, grouped into sections by category — used by
 * /vocabulary/topics (still linked from a few other pages) so a user never
 * has to click "Xem tất cả" to see what exists there. */
export function TopicSectionGrid({ topics }: { topics: VocabularyTopicRow[] }) {
  const { sections, orderedKeys } = groupTopicsByCategory(topics);

  return (
    <div className="flex flex-col gap-8">
      {orderedKeys.map((key) => (
        <section key={key} className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">{key.toUpperCase()}</h2>
          <TopicGrid topics={sections.get(key)!} />
        </section>
      ))}
    </div>
  );
}
