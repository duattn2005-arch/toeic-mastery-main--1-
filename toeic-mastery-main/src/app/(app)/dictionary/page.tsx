import type { Metadata } from "next";
import Link from "next/link";
import { BookA, Star } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getRecentSearches, getSavedWords } from "@/lib/data/dictionary-history";
import { DictionarySearch } from "@/components/dictionary/dictionary-search";
import { DictionaryTour } from "@/components/dictionary/dictionary-tour";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Từ điển" };

export default async function DictionaryPage() {
  const profile = await requireUser();
  const [recent, saved] = await Promise.all([getRecentSearches(profile.id), getSavedWords(profile.id)]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Từ điển thông minh</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tra nghĩa, phát âm, ví dụ — hoặc bôi đen bất kỳ từ nào trên trang để tra nhanh.
        </p>
      </div>

      <DictionarySearch />

      {recent.length > 0 && (
        <section>
          <h2 className="mb-2.5 text-sm font-semibold text-muted-foreground">TÌM KIẾM GẦN ĐÂY</h2>
          <div className="flex flex-wrap gap-2">
            {recent.map((r) => (
              <Link key={r.id} href={`/dictionary/${encodeURIComponent(r.word)}`}>
                <Badge variant="outline" className="cursor-pointer px-3 py-1.5 text-sm hover:bg-muted">
                  {r.word}
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2.5 text-sm font-semibold text-muted-foreground">TỪ ĐÃ LƯU</h2>
        {saved.length === 0 ? (
          <EmptyState icon={BookA} title="Chưa lưu từ nào" description="Tra một từ và nhấn “Lưu từ” để thêm vào đây." />
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {saved.map((s) => (
              <Link
                key={s.id}
                href={`/dictionary/${encodeURIComponent(s.word)}`}
                className="flex items-center justify-between rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm hover:border-primary/40"
              >
                {s.word}
                {s.isFavorite && <Star className="size-3.5 fill-current text-warning" />}
              </Link>
            ))}
          </div>
        )}
      </section>

      <DictionaryTour />
    </div>
  );
}
