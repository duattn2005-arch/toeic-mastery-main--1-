import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PartDetailView } from "@/components/skills/part-detail-view";

export const metadata: Metadata = { title: "Listening Part 1" };

export default async function ListeningPart1Page() {
  const profile = await requireUser();
  return <PartDetailView part="PART1" userId={profile.id} />;
}
