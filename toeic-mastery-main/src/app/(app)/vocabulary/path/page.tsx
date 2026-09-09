import { redirect } from "next/navigation";

/** The 20-day path overview now lives as the default tab on /vocabulary
 * itself (see VocabularyTabs) — this route stays only so old links/bookmarks
 * still land somewhere sensible. */
export default function VocabularyPathRedirectPage() {
  redirect("/vocabulary");
}
