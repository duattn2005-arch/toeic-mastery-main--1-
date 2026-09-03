import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PartDetailView } from "@/components/skills/part-detail-view";

export const metadata: Metadata = { title: "Reading Part 7" };

export default async function ReadingPart7Page() {
  const profile = await requireUser();
  return <PartDetailView part="PART7" userId={profile.id} />;
}
