import { NextResponse } from "next/server";
import { DictionaryService, DictionaryLookupError } from "@/lib/services/dictionary-service";
import { rateLimit, clientKeyFromRequest } from "@/lib/rate-limit";
import { getAuthedProfileOrNull } from "@/lib/auth";
import { hasReachedDictionaryLimit } from "@/lib/services/dictionary-limit";

export async function GET(request: Request, { params }: { params: Promise<{ word: string }> }) {
  const limit = rateLimit(`dictionary:${clientKeyFromRequest(request)}`, 60, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ error: "Quá nhiều yêu cầu, vui lòng thử lại sau." }, { status: 429 });
  }

  const { word } = await params;
  const decoded = decodeURIComponent(word).trim();

  if (!decoded || decoded.length > 60) {
    return NextResponse.json({ error: "Từ không hợp lệ" }, { status: 400 });
  }

  const profile = await getAuthedProfileOrNull();
  if (profile && (await hasReachedDictionaryLimit(profile))) {
    return NextResponse.json({ error: "LIMIT_REACHED" }, { status: 403 });
  }

  const service = new DictionaryService();
  let result;
  try {
    result = await service.lookup(decoded);
  } catch (err) {
    if (err instanceof DictionaryLookupError) {
      return NextResponse.json({ error: "Có lỗi khi tra cứu, vui lòng thử lại sau." }, { status: 503 });
    }
    throw err;
  }

  if (!result) {
    return NextResponse.json({ error: "Không tìm thấy từ này" }, { status: 404 });
  }

  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
  });
}
