import "server-only";
import { db } from "@/lib/db";
import type { Prisma, TestPart } from "@/generated/prisma/client";

export interface TestListFilters {
  category?: "ALL" | "FULL" | "LISTENING" | "READING" | TestPart;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  completion?: "ALL" | "COMPLETED" | "NOT_COMPLETED";
  sort?: "NEWEST" | "RATING";
}

export async function getTestList(userId: string, filters: TestListFilters) {
  const where: Prisma.TestWhereInput = { status: "PUBLISHED" };

  switch (filters.category) {
    case "FULL":
      where.isFullTest = true;
      break;
    case "LISTENING":
      where.isFullTest = false;
      where.listeningQuestions = { gt: 0 };
      break;
    case "READING":
      where.isFullTest = false;
      where.readingQuestions = { gt: 0 };
      break;
    case undefined:
    case "ALL":
      break;
    default:
      where.isFullTest = false;
      where.sections = { some: { part: filters.category } };
  }

  if (filters.difficulty) where.difficulty = filters.difficulty;

  const tests = await db.test.findMany({
    where,
    orderBy: filters.sort === "RATING" ? { attempts: { _count: "desc" } } : { createdAt: "desc" },
    include: {
      _count: { select: { attempts: true } },
      attempts: {
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: { id: true, status: true, currentQuestionIndex: true, totalScore: true },
      },
    },
  });

  const bestScores = await db.attempt.groupBy({
    by: ["testId"],
    where: { userId, status: "SUBMITTED", testId: { in: tests.map((t) => t.id) } },
    _max: { totalScore: true },
  });
  const bestScoreByTest = new Map(bestScores.map((b) => [b.testId, b._max.totalScore]));

  const mapped = tests.map((t) => {
    const latestAttempt = t.attempts[0] ?? null;
    const isCompleted = latestAttempt?.status === "SUBMITTED";
    const isInProgress = latestAttempt?.status === "IN_PROGRESS";
    return {
      id: t.id,
      title: t.title,
      difficulty: t.difficulty,
      totalQuestions: t.totalQuestions,
      durationMinutes: t.durationMinutes,
      isFullTest: t.isFullTest,
      usersCompleted: t._count.attempts,
      bestScore: bestScoreByTest.get(t.id) ?? null,
      isCompleted,
      isInProgress,
      progressPercent: isInProgress && latestAttempt ? Math.round((latestAttempt.currentQuestionIndex / t.totalQuestions) * 100) : null,
      resumeAttemptId: isInProgress ? latestAttempt!.id : null,
    };
  });

  if (filters.completion === "COMPLETED") return mapped.filter((t) => t.isCompleted);
  if (filters.completion === "NOT_COMPLETED") return mapped.filter((t) => !t.isCompleted);
  return mapped;
}

export type TestListItem = Awaited<ReturnType<typeof getTestList>>[number];
