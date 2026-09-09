import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PartDetailView } from "@/components/skills/part-detail-view";

export const metadata: Metadata = { title: "Reading Part 6" };

export default async function ReadingPart6Page() {
  const profile = await requireUser();
  return <PartDetailView part="PART6" userId={profile.id} />;
}
