import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PartDetailView } from "@/components/skills/part-detail-view";

export const metadata: Metadata = { title: "Listening Part 2" };

export default async function ListeningPart2Page() {
  const profile = await requireUser();
  return <PartDetailView part="PART2" userId={profile.id} />;
}
