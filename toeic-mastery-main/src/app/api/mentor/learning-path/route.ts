import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthedProfileOrNull } from "@/lib/auth";

/** Current ACTIVE LearningPath with every day/item — small enough at
 * MVP path lengths (<=60 days, a handful of items each) to return whole,
 * no pagination. */
export async function GET() {
  const profile = await getAuthedProfileOrNull();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const path = await db.learningPath.findFirst({
    where: { userId: profile.id, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    include: {
      days: {
        orderBy: { dayNumber: "asc" },
        include: { items: { orderBy: { orderIndex: "asc" } } },
      },
    },
  });

  return NextResponse.json({ path });
}
