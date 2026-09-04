import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getSkillHubData } from "@/lib/data/skill-hub";
import { SkillHubView } from "@/components/skills/skill-hub-view";
import { ListeningHubTour } from "@/components/listening/listening-hub-tour";

export const metadata: Metadata = { title: "Listening" };

export default async function ListeningPage() {
  const profile = await requireUser();
  const items = await getSkillHubData(profile.id, "LISTENING");

  return (
    <>
      <SkillHubView
        title="Listening"
        subtitle="Luyện nghe theo từng Part — Photographs, Question-Response, Conversations, Talks."
        items={items}
        basePath="listening"
      />
      <ListeningHubTour />
    </>
  );
}
