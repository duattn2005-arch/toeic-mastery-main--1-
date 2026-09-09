import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthedProfileOrNull } from "@/lib/auth";

/**
 * Fetches a MentorTest for taking — question content and options, but never
 * `correctLabel` or `distractorExplanation` (those would leak the answer
 * before /api/mentor/tests/[id]/submit grades it).
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getAuthedProfileOrNull();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const mentorTest = await db.mentorTest.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      status: true,
      score: true,
      passThreshold: true,
      dimensionType: true,
      dimensionKey: true,
      difficulty: true,
      questions: {
        orderBy: { orderIndex: "asc" },
        select: {
          orderIndex: true,
          question: {
            select: {
              id: true,
              part: true,
              prompt: true,
              imageUrl: true,
              audioUrl: true,
              transcript: true,
              options: { orderBy: { label: "asc" }, select: { label: true, content: true } },
            },
          },
        },
      },
    },
  });

  if (!mentorTest || mentorTest.userId !== profile.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    mentorTest: {
      id: mentorTest.id,
      status: mentorTest.status,
      score: mentorTest.score,
      passThreshold: mentorTest.passThreshold,
      dimensionType: mentorTest.dimensionType,
      dimensionKey: mentorTest.dimensionKey,
      difficulty: mentorTest.difficulty,
      questions: mentorTest.questions.map((q) => ({
        id: q.question.id,
        part: q.question.part,
        prompt: q.question.prompt,
        imageUrl: q.question.imageUrl,
        audioUrl: q.question.audioUrl,
        transcript: q.question.transcript,
        options: q.question.options,
      })),
    },
  });
}
