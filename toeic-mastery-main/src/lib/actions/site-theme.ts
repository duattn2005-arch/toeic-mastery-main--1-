"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentProfile, isPro } from "@/lib/auth";
import { getSiteTheme } from "@/lib/constants/site-themes";
import type { ActionResult } from "@/lib/actions/profile";

export async function updateSiteThemeAction(themeId: string): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Vui lòng đăng nhập" };

  const theme = getSiteTheme(themeId);
  if (theme.id !== themeId) return { error: "Theme không tồn tại" };
  if (theme.tier === "PRO" && !isPro(profile)) return { error: "Theme này dành cho tài khoản Pro" };

  await db.userSettings.upsert({
    where: { userId: profile.id },
    create: { userId: profile.id, siteTheme: theme.id },
    update: { siteTheme: theme.id },
  });

  // The theme now renders on every authenticated page (app-shell layout +
  // the dashboard hero specifically), not just /dashboard.
  revalidatePath("/", "layout");
  return {};
}
