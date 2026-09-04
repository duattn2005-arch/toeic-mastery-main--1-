import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getPathDayDetail } from "@/lib/data/vocabulary-path";
import { PathDayRunner } from "@/components/vocabulary/path/path-day-runner";

export const metadata: Metadata = { title: "Từ vựng 20 ngày" };

export default async function VocabularyPathDayPage({ params }: { params: Promise<{ dayNumber: string }> }) {
  const { dayNumber: dayNumberParam } = await params;
  const dayNumber = Number(dayNumberParam);
  if (!Number.isInteger(dayNumber) || dayNumber < 1) notFound();

  const profile = await requireUser();
  const day = await getPathDayDetail(dayNumber, profile.id);

  if (!day.isUnlocked) redirect("/vocabulary");

  return (
    <PathDayRunner
      dayId={day.dayId}
      dayNumber={day.dayNumber}
      tierLabel={day.tierLabel}
      totalDays={day.totalDays}
      initialStepsCompleted={day.stepsCompleted}
      initialStars={day.stars}
      items={day.items}
      starredTerms={day.starredTerms}
    />
  );
}
