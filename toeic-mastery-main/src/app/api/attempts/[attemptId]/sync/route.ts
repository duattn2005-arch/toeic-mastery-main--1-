import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAuthedProfileOrNull } from "@/lib/auth";
import { rateLimit, clientKeyFromRequest } from "@/lib/rate-limit";
import { MAX_STUDY_SYNC_GAP_SEC } from "@/lib/constants/study";

const syncSchema = z.object({
  remainingSec: z.number().int().min(0),
  currentQuestionIndex: z.number().int().min(0),
  answers: z
    .array(
      z.object({
        questionId: z.string().uuid(),
        selectedLabel: z.string().length(1).nullable(),
        isFlagged: z.boolean(),
        /** First-ever label the learner picked for this question — set
         * once client-side (see exam-store.ts's setAnswer) and reported
         * as-is every sync; the server never derives it itself. */
        initialSelectedLabel: z.string().length(1).nullable(),
        answerChangeCount: z.number().int().min(0),
        /** Seconds of active-viewing time accrued since the LAST sync of
         * this question (not the running total) — added via `increment`,
         * see exam-store.ts's syncedTimeMs bookkeeping. */
        timeSpentDeltaSec: z.number().int().min(0),
      })
    )
    .default([]),
});

export async function POST(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const profile = await getAuthedProfileOrNull();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = rateLimit(`exam-sync:${profile.id}:${clientKeyFromRequest(request)}`, 30, 10_000);
  if (!limit.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const { attemptId } = await params;
  const body = syncSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const attempt = await db.attempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.userId !== profile.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (attempt.status !== "IN_PROGRESS") {
    return NextResponse.json({ error: "Attempt already finished" }, { status: 409 });
  }

  const { remainingSec, currentQuestionIndex, answers } = body.data;

  // Real wall-clock delta since the last checkpoint, not derived from the
  // countdown — see MAX_STUDY_SYNC_GAP_SEC for why.
  const gapSec = Math.min(
    Math.max(0, Math.round((Date.now() - attempt.lastSyncedAt.getTime()) / 1000)),
    MAX_STUDY_SYNC_GAP_SEC
  );

  // firstAnsweredAt must stay immutable once set (unlike answeredAt, which
  // keeps moving to "now" below) — an upsert alone can't express "only on
  // first insert" for an existing row, so read which questions already
  // have one before building the write batch.
  const alreadyFirstAnswered = new Set(
    (
      await db.attemptAnswer.findMany({
        where: { attemptId, questionId: { in: answers.map((a) => a.questionId) }, firstAnsweredAt: { not: null } },
        select: { questionId: true },
      })
    ).map((r) => r.questionId)
  );

  await db.$transaction([
    db.attempt.update({
      where: { id: attemptId },
      data: { remainingSec, currentQuestionIndex, lastSyncedAt: new Date() },
    }),
    // Keeps "Tổng giờ học" reacting to real study time as the exam
    // progresses, instead of the linked StudySession sitting at its
    // creation-time default of 0 for the whole attempt.
    db.studySession.updateMany({ where: { attemptId }, data: { durationSec: { increment: gapSec } } }),
    ...answers.map((a) =>
      db.attemptAnswer.upsert({
        where: { attemptId_questionId: { attemptId, questionId: a.questionId } },
        create: {
          attemptId,
          questionId: a.questionId,
          selectedLabel: a.selectedLabel,
          isFlagged: a.isFlagged,
          initialSelectedLabel: a.initialSelectedLabel,
          answerChangeCount: a.answerChangeCount,
          timeSpentSec: a.timeSpentDeltaSec,
          firstAnsweredAt: a.selectedLabel ? new Date() : null,
          answeredAt: a.selectedLabel ? new Date() : null,
        },
        update: {
          selectedLabel: a.selectedLabel,
          isFlagged: a.isFlagged,
          initialSelectedLabel: a.initialSelectedLabel,
          answerChangeCount: a.answerChangeCount,
          timeSpentSec: { increment: a.timeSpentDeltaSec },
          ...(alreadyFirstAnswered.has(a.questionId) ? {} : { firstAnsweredAt: a.selectedLabel ? new Date() : undefined }),
          answeredAt: a.selectedLabel ? new Date() : null,
        },
      })
    ),
  ]);

  return NextResponse.json({ ok: true, syncedAt: new Date().toISOString() });
}
