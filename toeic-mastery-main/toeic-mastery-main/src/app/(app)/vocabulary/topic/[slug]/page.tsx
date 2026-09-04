import type { Metadata } from "next";
import Link from "next/link";
import { Gamepad2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getTopicWithWords } from "@/lib/data/vocabulary";
import { VocabularyCard } from "@/components/vocabulary/vocabulary-card";
import { StartLearningButton } from "@/components/vocabulary/start-learning-button";
import { Button } from "@/components/ui/button";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug.replace(/-/g, " ") };
}

export default async function VocabularyTopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await requireUser();
  const { topic, words } = await getTopicWithWords(slug, profile.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{topic.name}</h1>
          {topic.description && <p className="mt-1 text-sm text-muted-foreground">{topic.description}</p>}
          <p className="mt-1 text-xs text-muted-foreground">{words.length} từ vựng</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={`/vocabulary/topic/${slug}/study`}>
              <Gamepad2 className="size-4" /> Học & Chơi
            </Link>
          </Button>
          <StartLearningButton vocabularyWordIds={words.map((w) => w.id)} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {words.map((word) => (
          <VocabularyCard
            key={word.id}
            word={{
              id: word.id,
              word: word.word,
              ipa: word.ipa,
              partOfSpeech: word.partOfSpeech,
              meaningVi: word.meaningVi,
              exampleEn: word.exampleEn,
              audioUrlUs: word.audioUrlUs,
              audioUrlUk: word.audioUrlUk,
              isTracked: word.isTracked,
              isLearned: word.isLearned,
            }}
          />
        ))}
      </div>
    </div>
  );
}
