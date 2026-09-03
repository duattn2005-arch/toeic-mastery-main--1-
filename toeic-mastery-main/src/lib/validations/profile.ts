import { z } from "zod";

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Họ tên tối thiểu 2 ký tự").max(80),
  targetScore: z.coerce.number().int().min(10, "Điểm mục tiêu tối thiểu 10").max(990, "Điểm mục tiêu tối đa 990"),
  examDate: z.string().nullable(),
  dailyStudyTargetMinutes: z.coerce.number().int().min(5).max(600),
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const settingsSchema = z.object({
  theme: z.enum(["LIGHT", "DARK", "SYSTEM"]),
  language: z.enum(["vi", "en"]),
  audioAutoplay: z.boolean(),
  defaultPlaybackSpeed: z.coerce.number().min(0.5).max(2),
  dictionaryPopupEnabled: z.boolean(),
  dailyReminderEnabled: z.boolean(),
  dailyReminderTime: z.string().nullable(),
});
export type SettingsInput = z.infer<typeof settingsSchema>;
