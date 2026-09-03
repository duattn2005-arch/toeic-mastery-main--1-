import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getSkillHubData } from "@/lib/data/skill-hub";
import { SkillHubView } from "@/components/skills/skill-hub-view";

export const metadata: Metadata = { title: "Reading" };

export default async function ReadingPage() {
  const profile = await requireUser();
  const items = await getSkillHubData(profile.id, "READING");

  return (
    <SkillHubView
      title="Reading"
      subtitle="Luyện đọc theo từng Part — Incomplete Sentences, Text Completion, Reading Comprehension."
      items={items}
      basePath="reading"
    />
  );
}
