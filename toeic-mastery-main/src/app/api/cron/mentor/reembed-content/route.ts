import { NextResponse, type NextRequest } from "next/server";
import { syncAllContentEmbeddings } from "@/lib/services/mentor/content-sync";

/**
 * Incremental RAG re-indexing — run on a schedule (see vercel.json) so any
 * grammar lesson, vocabulary word/topic, or newly published question shows
 * up in AI Mentor's retrieval within one run, without a full re-embed.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const counts = await syncAllContentEmbeddings();
  return NextResponse.json({ reembedded: counts });
}
