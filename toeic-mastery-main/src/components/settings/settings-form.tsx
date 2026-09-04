"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Moon, Sun } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/store/settings-store";
import { updateSettingsAction } from "@/lib/actions/profile";
import type { SettingsInput } from "@/lib/validations/profile";

const SPEEDS = [0.75, 1, 1.25, 1.5];

export function SettingsForm({ initial }: { initial: SettingsInput }) {
  const { theme, setTheme } = useTheme();
  const store = useSettingsStore();
  const [language, setLanguage] = React.useState(initial.language);
  const [reminderEnabled, setReminderEnabled] = React.useState(initial.dailyReminderEnabled);
  const [reminderTime, setReminderTime] = React.useState(initial.dailyReminderTime ?? "20:00");

  async function persist(patch: Partial<SettingsInput>) {
    const payload: SettingsInput = {
      theme: (theme?.toUpperCase() as SettingsInput["theme"]) ?? "LIGHT",
      language,
      audioAutoplay: store.audioAutoplay,
      defaultPlaybackSpeed: store.defaultPlaybackSpeed,
      dictionaryPopupEnabled: store.dictionaryPopupEnabled,
      dailyReminderEnabled: reminderEnabled,
      dailyReminderTime: reminderTime,
      ...patch,
    };
    const result = await updateSettingsAction(payload);
    if (result.error) toast.error(result.error);
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      <SettingRow label="Giao diện" description="Chọn chế độ sáng hoặc tối.">
        <div className="flex gap-1.5 rounded-lg border border-input p-1">
          {(["light", "dark"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTheme(t);
                void persist({ theme: t.toUpperCase() as SettingsInput["theme"] });
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium",
                theme === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              )}
            >
              {t === "light" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
              {t === "light" ? "Sáng" : "Tối"}
            </button>
          ))}
        </div>
      </SettingRow>

      <SettingRow label="Ngôn ngữ" description="Ngôn ngữ hiển thị giao diện.">
        <Select
          value={language}
          onValueChange={(v) => {
            setLanguage(v as "vi" | "en");
            void persist({ language: v as "vi" | "en" });
          }}
        >
          <SelectTrigger size="sm" className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vi">Tiếng Việt</SelectItem>
            <SelectItem value="en">English</SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow label="Tự động phát audio" description="Tự động phát audio khi mở câu hỏi nghe.">
        <Switch
          checked={store.audioAutoplay}
          onCheckedChange={(v) => {
            store.setAudioAutoplay(v);
            void persist({ audioAutoplay: v });
          }}
        />
      </SettingRow>

      <SettingRow label="Tốc độ phát mặc định" description="Tốc độ phát audio mặc định trong bài luyện tập.">
        <Select
          value={String(store.defaultPlaybackSpeed)}
          onValueChange={(v) => {
            store.setDefaultPlaybackSpeed(Number(v));
            void persist({ defaultPlaybackSpeed: Number(v) });
          }}
        >
          <SelectTrigger size="sm" className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SPEEDS.map((s) => (
              <SelectItem key={s} value={String(s)}>
                {s}x
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow label="Từ điển khi bôi đen" description="Hiện popup tra từ khi bôi đen văn bản tiếng Anh.">
        <Switch
          checked={store.dictionaryPopupEnabled}
          onCheckedChange={(v) => {
            store.setDictionaryPopupEnabled(v);
            void persist({ dictionaryPopupEnabled: v });
          }}
        />
      </SettingRow>

      <SettingRow label="Nhắc nhở học mỗi ngày" description="Nhận nhắc nhở duy trì streak học tập.">
        <div className="flex items-center gap-3">
          {reminderEnabled && (
            <Input
              type="time"
              value={reminderTime}
              onChange={(e) => {
                setReminderTime(e.target.value);
                void persist({ dailyReminderTime: e.target.value });
              }}
              className="h-8 w-28"
            />
          )}
          <Switch
            checked={reminderEnabled}
            onCheckedChange={(v) => {
              setReminderEnabled(v);
              void persist({ dailyReminderEnabled: v });
            }}
          />
        </div>
      </SettingRow>
    </div>
  );
}

function SettingRow({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}
