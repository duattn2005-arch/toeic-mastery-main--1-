import { NextResponse } from "next/server";
import { getAuthedProfileOrNull } from "@/lib/auth";
import { completeLearningPathItem, LearningPathItemNotFoundError } from "@/lib/services/mentor/learning-path-progress";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getAuthedProfileOrNull();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const result = await completeLearningPathItem(profile.id, id);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof LearningPathItemNotFoundError) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    throw err;
  }
}
