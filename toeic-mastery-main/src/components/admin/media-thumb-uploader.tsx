"use client";

import * as React from "react";
import { ImageIcon, Loader2, Music, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

const SIZE_MB: Record<"image" | "audio", number> = { image: 50, audio: 20 };
const ACCEPTED_TYPES: Record<"image" | "audio", string[]> = {
  image: ["image/png", "image/jpeg", "image/webp"],
  audio: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/ogg", "audio/mp4", "audio/x-m4a", "audio/aac"],
};

/**
 * Quizlet-card-style square media slot — click to upload, small trash overlay
 * to clear. Shared by the vocabulary card grid for the per-card image and
 * audio columns; kind picks accepted types/size limit and empty-state icon.
 */
export function MediaThumbUploader({
  kind,
  value,
  onChange,
  label,
}: {
  kind: "image" | "audio";
  value: string;
  onChange: (url: string) => void;
  label: string;
}) {
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    if (!ACCEPTED_TYPES[kind].includes(file.type)) {
      toast.error(kind === "image" ? "Chỉ hỗ trợ ảnh PNG, JPEG hoặc WebP" : "Chỉ hỗ trợ file âm thanh MP3, WAV, OGG, M4A hoặc AAC");
      return;
    }
    if (file.size > SIZE_MB[kind] * 1024 * 1024) {
      toast.error(`File phải nhỏ hơn ${SIZE_MB[kind]}MB`);
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("kind", kind);
      const res = await fetch("/api/upload/question-media", { method: "POST", body });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Tải lên thất bại");
      onChange(data.url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Tải lên thất bại");
    } finally {
      setUploading(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await uploadFile(file);
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    // Always swallow the paste — this input only exists to catch Ctrl+V /
    // right-click "Paste" clicks; it must never actually insert text.
    e.preventDefault();
    const file = Array.from(e.clipboardData?.items ?? [])
      .filter((item) => item.kind === "file" && ACCEPTED_TYPES[kind].includes(item.type))
      .map((item) => item.getAsFile())
      .find((f): f is File => f !== null);
    if (!file || uploading) return;
    void uploadFile(file);
  }

  return (
    <div className="relative">
      <input ref={inputRef} type="file" accept={ACCEPTED_TYPES[kind].join(",")} className="hidden" onChange={handleFileChange} />
      <div
        className={`relative flex size-[84px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/60 hover:bg-muted ${uploading ? "opacity-60" : ""}`}
      >
        {uploading ? (
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        ) : value && kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="size-full object-cover" />
        ) : value && kind === "audio" ? (
          <Music className="size-6 text-primary" />
        ) : kind === "image" ? (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <ImageIcon className="size-5" />
            <span className="text-[10px]">Ảnh</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <Upload className="size-5" />
            <span className="text-[10px]">Audio</span>
          </div>
        )}
        {/*
          Transparent text input stacked over the whole box, instead of a
          plain button: only an editable element gets a native "Paste" item
          in the browser's right-click menu, so this is what makes
          right-click-paste (not just Ctrl+V) work. Left click still opens
          the file picker; every paste is swallowed in handlePaste so no
          text ever actually lands in it.
        */}
        <input
          type="text"
          inputMode="none"
          autoComplete="off"
          disabled={uploading}
          onClick={(e) => {
            e.currentTarget.focus();
            inputRef.current?.click();
          }}
          onPaste={handlePaste}
          onChange={(e) => {
            e.currentTarget.value = "";
          }}
          title={`${label} — bấm để tải file lên, hoặc dán ảnh bằng Ctrl+V / chuột phải`}
          aria-label={label}
          className="absolute inset-0 size-full cursor-pointer border-0 bg-transparent p-0 text-transparent caret-transparent outline-none disabled:cursor-not-allowed"
        />
      </div>
      {value && !uploading && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onChange("");
          }}
          title="Xóa"
          className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full border border-border bg-card shadow-soft hover:bg-muted"
        >
          <Trash2 className="size-3.5" />
        </button>
      )}
    </div>
  );
}
