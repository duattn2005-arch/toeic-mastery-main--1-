import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getAuthedProfileOrNull, isPro } from "@/lib/auth";
import { getSavedWordExportRows } from "@/lib/data/bookmarks";
import { VocabularyPdfDocument } from "@/lib/pdf/vocabulary-pdf-document";

export async function POST(request: Request) {
  const profile = await getAuthedProfileOrNull();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // PDF export is a Pro perk (see pro-card.tsx's benefits list) — was never
  // actually enforced here, so a Free account could hit this route directly.
  if (!isPro(profile)) return NextResponse.json({ error: "PRO_REQUIRED" }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as { wordIds?: string[] };
  const rows = await getSavedWordExportRows(profile.id, body.wordIds);
  if (rows.length === 0) return NextResponse.json({ error: "Không có từ nào để xuất" }, { status: 400 });

  const generatedAt = new Date().toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  const buffer = await renderToBuffer(VocabularyPdfDocument({ rows, generatedAt }));

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="tu-vung-cua-toi-${Date.now()}.pdf"`,
    },
  });
}
