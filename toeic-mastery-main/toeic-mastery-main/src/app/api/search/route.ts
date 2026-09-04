import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export interface SearchResultItem {
  type: "test" | "vocabulary" | "grammar" | "dictionary";
  title: string;
  subtitle?: string;
  href: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (q.length < 2) {
    return NextResponse.json({ results: [] satisfies SearchResultItem[] });
  }

  const [tests, words, grammarTopics] = await Promise.all([
    db.test.findMany({
      where: { status: "PUBLISHED", title: { contains: q, mode: "insensitive" } },
      select: { id: true, title: true, difficulty: true },
      take: 5,
    }),
    db.vocabularyWord.findMany({
      where: { word: { contains: q, mode: "insensitive" } },
      select: { word: true, meaningVi: true },
      take: 5,
    }),
    db.grammarTopic.findMany({
      where: { title: { contains: q, mode: "insensitive" } },
      select: { slug: true, title: true, summary: true },
      take: 5,
    }),
  ]);

  const results: SearchResultItem[] = [
    ...tests.map((t) => ({
      type: "test" as const,
      title: t.title,
      subtitle: `Đề thi · ${t.difficulty}`,
      href: `/practice/${t.id}`,
    })),
    ...words.map((w) => ({
      type: "vocabulary" as const,
      title: w.word,
      subtitle: w.meaningVi,
      href: `/dictionary/${encodeURIComponent(w.word)}`,
    })),
    ...grammarTopics.map((g) => ({
      type: "grammar" as const,
      title: g.title,
      subtitle: g.summary ?? "Ngữ pháp",
      href: `/grammar/${g.slug}`,
    })),
    {
      type: "dictionary" as const,
      title: `Tra "${q}" trong từ điển`,
      href: `/dictionary/${encodeURIComponent(q)}`,
    },
  ];

  return NextResponse.json({ results });
}
