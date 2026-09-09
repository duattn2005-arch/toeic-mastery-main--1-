import { NextResponse } from "next/server";
import { extractYouTubeVideoId, YOUTUBE_HOSTS } from "@/lib/youtube";
import { rateLimit, clientKeyFromRequest } from "@/lib/rate-limit";

/** Fetches a YouTube video's title/thumbnail via the public oEmbed endpoint
 * server-side, rather than calling it from the browser — avoids depending on
 * YouTube's CORS behavior (undocumented, could change) and keeps the
 * external call in one place we control. */
export async function GET(request: Request) {
  const limit = rateLimit(`youtube-oembed:${clientKeyFromRequest(request)}`, 30, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ error: "Quá nhiều yêu cầu, vui lòng thử lại sau." }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url");
  if (!rawUrl) return NextResponse.json({ error: "Thiếu url" }, { status: 400 });

  let videoUrl: URL;
  try {
    videoUrl = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: "URL không hợp lệ" }, { status: 400 });
  }
  if (!YOUTUBE_HOSTS.includes(videoUrl.hostname)) {
    return NextResponse.json({ error: "Chỉ hỗ trợ link YouTube" }, { status: 400 });
  }

  const videoId = extractYouTubeVideoId(rawUrl);
  if (!videoId) return NextResponse.json({ error: "Không nhận diện được video từ link này" }, { status: 400 });

  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(rawUrl)}&format=json`);
    if (!res.ok) return NextResponse.json({ error: "Không tìm thấy video" }, { status: 404 });
    const data = (await res.json()) as { title?: string; thumbnail_url?: string };
    return NextResponse.json({
      id: videoId,
      title: data.title ?? "Video YouTube",
      thumbnailUrl: data.thumbnail_url ?? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    });
  } catch {
    return NextResponse.json({ error: "Không lấy được thông tin video" }, { status: 502 });
  }
}
