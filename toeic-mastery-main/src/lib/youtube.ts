/** Pulls the video id out of the common YouTube URL shapes (watch, share
 * link, embed, shorts, with or without www/m/music subdomains). Returns
 * null for anything that isn't recognizably a YouTube video URL. Plain
 * function (no "use client"/"use server") so both the paste-a-link UI and
 * the oEmbed API route can share the same validation logic. */
export function extractYouTubeVideoId(input: string): string | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\.|^m\.|^music\./, "");

  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return id || null;
  }

  if (host === "youtube.com") {
    if (url.pathname === "/watch") return url.searchParams.get("v");
    const embedMatch = url.pathname.match(/^\/embed\/([^/?]+)/);
    if (embedMatch) return embedMatch[1];
    const shortsMatch = url.pathname.match(/^\/shorts\/([^/?]+)/);
    if (shortsMatch) return shortsMatch[1];
  }

  return null;
}

export const YOUTUBE_HOSTS = ["www.youtube.com", "youtube.com", "youtu.be", "music.youtube.com", "m.youtube.com"];
