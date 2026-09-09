import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { refreshLearningPathForUser } from "@/lib/services/mentor/learning-path-replanner";

/**
 * Daily baseline sweep — "theo dõi họ mỗi ngày để đưa ra lộ trình tối ưu cá
 * nhân hóa". The reactive trigger in learning-path-progress.ts already
 * re-plans the moment a day completes, so this run is mostly a no-op for
 * learners who were active; it exists for everyone else — a learner who
 * hasn't touched a LearningPathDay item today but did other practice (or
 * simply so a path never goes more than a day stale even if nothing
 * triggered it reactively).
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activePaths = await db.learningPath.findMany({
    where: { status: "ACTIVE" },
    select: { userId: true },
    distinct: ["userId"],
  });

  let succeeded = 0;
  let failed = 0;
  for (const { userId } of activePaths) {
    try {
      await refreshLearningPathForUser(userId);
      succeeded += 1;
    } catch (err) {
      failed += 1;
      console.error("refreshLearningPathForUser failed", userId, err);
    }
  }

  return NextResponse.json({ processed: activePaths.length, succeeded, failed });
}
