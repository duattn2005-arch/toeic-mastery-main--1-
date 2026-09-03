"use client";

import * as React from "react";
import { Loader2, Music, Upload } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

const MAX_SIZE_MB = 20;
const ACCEPTED_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/ogg", "audio/mp4", "audio/x-m4a", "audio/aac"];

/**
 * Direct-to-Supabase-Storage upload for question audio (Part 1-4) — same
 * client-side pattern as AvatarUploader, uploading straight from the
 * browser to the `question-media` bucket rather than routing file bytes
 * through a Server Action (which would hit Next's default 1MB body limit).
 * The resulting public URL fills the same `audioUrl` field the form already
 * has, so pasting a URL directly still works as a fallback.
 */
export function QuestionAudioUploader({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Chỉ hỗ trợ file âm thanh MP3, WAV, OGG, M4A hoặc AAC");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File âm thanh phải nhỏ hơn ${MAX_SIZE_MB}MB`);
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `audio/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage.from("question-media").upload(path, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("question-media").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Đã tải file âm thanh lên");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Tải file thất bại");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://.../audio.mp3 (hoặc tải file lên)" className="flex-1" />
        <input ref={inputRef} type="file" accept={ACCEPTED_TYPES.join(",")} className="hidden" onChange={handleFileChange} />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-input bg-card px-3 py-2 text-xs font-medium hover:bg-muted disabled:opacity-50"
        >
          {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
          Tải file lên
        </button>
      </div>
      <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <Music className="size-3" /> MP3, WAV, OGG, M4A hoặc AAC, tối đa {MAX_SIZE_MB}MB
      </p>
    </div>
  );
}
