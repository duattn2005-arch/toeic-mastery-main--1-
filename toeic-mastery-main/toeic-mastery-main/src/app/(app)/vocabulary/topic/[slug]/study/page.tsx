import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getTopicStudyItems } from "@/lib/data/vocabulary";
import { StudyGameLauncher } from "@/components/study-game/study-game-launcher";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { topicName } = await getTopicStudyItems(slug);
  return { title: `Học & Chơi — ${topicName}` };
}

export default async function VocabularyTopicStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await requireUser();
  const { topicName, items, starredTerms } = await getTopicStudyItems(slug, profile.id);

  return (
    <StudyGameLauncher
      items={items}
      title={topicName}
      backHref={`/vocabulary/topic/${slug}`}
      backLabel="Quay lại danh sách từ"
      trackable
      initialStarredTerms={starredTerms}
    />
  );
}
