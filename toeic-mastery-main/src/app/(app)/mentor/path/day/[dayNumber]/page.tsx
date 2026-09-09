import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getLearningPathDayDetail } from "@/lib/data/learning-path";
import { LearningPathDayRunner } from "@/components/mentor/learning-path-day-runner";

export const metadata: Metadata = { title: "Lộ trình học" };

export default async function LearningPathDayPage({ params }: { params: Promise<{ dayNumber: string }> }) {
  const { dayNumber: dayNumberParam } = await params;
  const dayNumber = Number(dayNumberParam);
  if (!Number.isInteger(dayNumber) || dayNumber < 1) notFound();

  const profile = await requireUser();
  const day = await getLearningPathDayDetail(profile.id, dayNumber);

  if (day.status === "LOCKED") redirect("/mentor/path");

  return (
    <LearningPathDayRunner dayNumber={day.dayNumber} focusParts={day.focusParts} summary={day.summary} items={day.items} />
  );
}
