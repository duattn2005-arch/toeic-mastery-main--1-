"use client";

import * as React from "react";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

const MAX_SIZE_MB = 50;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

/**
 * Direct-to-Supabase-Storage upload for question/test images — same pattern
 * as QuestionAudioUploader, uploading straight from the browser to the
 * `question-media` bucket rather than routing file bytes through a Server
 * Action (which would hit Next's default 1MB body limit). The resulting
 * public URL fills the same imageUrl/thumbnailUrl field the form already
 * has, so pasting a URL directly still works as a fallback.
 */
export function ImageUploader({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Chỉ hỗ trợ ảnh PNG, JPEG hoặc WebP");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Ảnh phải nhỏ hơn ${MAX_SIZE_MB}MB`);
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `images/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage.from("question-media").upload(path, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("question-media").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Đã tải ảnh lên");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Tải ảnh thất bại");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {value && (
        <div className="relative w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="max-h-40 rounded-lg border border-border object-contain" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full border border-border bg-card shadow-soft hover:bg-muted"
            title="Xóa ảnh"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}
      <div className="flex gap-2">
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://.../anh.png (hoặc tải file lên)" className="flex-1" />
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
        <ImageIcon className="size-3" /> PNG, JPEG hoặc WebP, tối đa {MAX_SIZE_MB}MB
      </p>
    </div>
  );
}
