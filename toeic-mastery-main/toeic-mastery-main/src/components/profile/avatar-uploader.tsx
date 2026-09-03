"use client";

import * as React from "react";
import { Camera, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { updateAvatarAction } from "@/lib/actions/profile";

const MAX_SIZE_MB = 3;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function AvatarUploader({ userId, initialUrl }: { userId: string; initialUrl: string | null }) {
  const [url, setUrl] = React.useState(initialUrl);
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
      const path = `${userId}/avatar-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const result = await updateAvatarAction(data.publicUrl);
      if (result.error) throw new Error(result.error);

      setUrl(data.publicUrl);
      toast.success("Đã cập nhật ảnh đại diện");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Tải ảnh thất bại");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex size-20 items-center justify-center overflow-hidden rounded-full bg-muted">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="size-full object-cover" />
        ) : (
          <User className="size-8 text-muted-foreground" />
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Loader2 className="size-5 animate-spin text-white" />
          </div>
        )}
      </div>
      <div>
        <input ref={inputRef} type="file" accept={ACCEPTED_TYPES.join(",")} className="hidden" onChange={handleFileChange} />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-input bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
        >
          <Camera className="size-3.5" /> Đổi ảnh đại diện
        </button>
        <p className="mt-1 text-[11px] text-muted-foreground">PNG, JPEG hoặc WebP, tối đa {MAX_SIZE_MB}MB</p>
      </div>
    </div>
  );
}
