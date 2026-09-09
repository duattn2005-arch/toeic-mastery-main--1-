import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PartDetailView } from "@/components/skills/part-detail-view";

export const metadata: Metadata = { title: "Reading Part 5" };

export default async function ReadingPart5Page() {
  const profile = await requireUser();
  return <PartDetailView part="PART5" userId={profile.id} />;
}
