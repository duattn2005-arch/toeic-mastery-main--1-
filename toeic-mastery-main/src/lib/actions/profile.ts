"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentProfile } from "@/lib/auth";
import { profileSchema, settingsSchema, type ProfileInput, type SettingsInput } from "@/lib/validations/profile";

export interface ActionResult {
  error?: string;
}

export async function updateProfileAction(input: ProfileInput): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Vui lòng đăng nhập" };

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  await db.profile.update({
    where: { id: profile.id },
    data: {
      fullName: parsed.data.fullName,
      targetScore: parsed.data.targetScore,
      examDate: parsed.data.examDate ? new Date(parsed.data.examDate) : null,
      dailyStudyTargetMinutes: parsed.data.dailyStudyTargetMinutes,
    },
  });

  revalidatePath("/account/profile");
  revalidatePath("/dashboard");
  return {};
}

export async function updateAvatarAction(avatarUrl: string): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Vui lòng đăng nhập" };

  await db.profile.update({ where: { id: profile.id }, data: { avatarUrl } });
  revalidatePath("/account/profile");
  return {};
}

export async function updateSettingsAction(input: SettingsInput): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Vui lòng đăng nhập" };

  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  await db.userSettings.upsert({
    where: { userId: profile.id },
    create: { userId: profile.id, ...parsed.data },
    update: parsed.data,
  });

  revalidatePath("/settings");
  return {};
}
