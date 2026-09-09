import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getExamData } from "@/lib/data/exam";
import { ExamRunner } from "@/components/exam/exam-runner";

export const metadata: Metadata = { title: "Đang làm bài" };

export default async function ExamPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const profile = await requireUser();

  const attemptStatus = await db.attempt.findUnique({ where: { id: attemptId }, select: { userId: true, status: true } });
  if (attemptStatus?.status === "SUBMITTED") redirect(`/history/${attemptId}`);

  const data = await getExamData(attemptId, profile.id);

  return (
    <div className="-mt-6 sm:mt-0">
      <ExamRunner data={data} />
    </div>
  );
}
