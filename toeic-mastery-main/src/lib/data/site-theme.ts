import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { DEFAULT_SITE_THEME_ID } from "@/lib/constants/site-themes";

/** Cached per-request (React `cache()`) so the app-shell layout and any page
 * that also needs it (e.g. the dashboard hero) share one DB round trip. */
export const getSiteThemeId = cache(async (userId: string): Promise<string> => {
  const settings = await db.userSettings.findUnique({ where: { userId }, select: { siteTheme: true } });
  return settings?.siteTheme ?? DEFAULT_SITE_THEME_ID;
});
