import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PartDetailView } from "@/components/skills/part-detail-view";

export const metadata: Metadata = { title: "Listening Part 3" };

export default async function ListeningPart3Page() {
  const profile = await requireUser();
  return <PartDetailView part="PART3" userId={profile.id} />;
}
