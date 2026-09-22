import { NextResponse } from "next/server";
import { getAuthedProfileOrNull } from "@/lib/auth";
import { buildCompetencyHeatmap } from "@/lib/services/mentor/competency-heatmap";

/**
 * GET: this learner's full competency heatmap (docs/ai-mentor-
 * architecture.md mục 12) — every PART/GRAMMAR_TOPIC/STRATEGIC_LABEL with
 * enough sample size, weighted score, and RED/YELLOW/GREEN band. Powers
 * the dashboard's weak-area reordering (mentor-heatmap-priority.ts) and any
 * future heatmap visualization; read-only, no side effects.
 */
export async function GET() {
  const profile = await getAuthedProfileOrNull();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const heatmap = await buildCompetencyHeatmap(profile.id);
  return NextResponse.json({ heatmap });
}
