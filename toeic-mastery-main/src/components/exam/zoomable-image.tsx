"use client";

import * as React from "react";
import { ZoomIn } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Any image shown while taking a test — tap/click it to open a near
 * full-screen, scrollable view. Reading-passage images (forms, e-mails,
 * receipts) are usually tall screenshots that still don't fully fit one
 * viewport even zoomed in, so the dialog itself scrolls (DialogContent is
 * already `overflow-y-auto`) rather than trying to shrink the image down
 * to fit — that's the whole point of zooming in.
 */
export function ZoomableImage({
  src,
  alt = "",
  loading,
  className,
}: {
  src: string;
  alt?: string;
  loading?: "eager" | "lazy";
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative block w-full cursor-zoom-in overflow-hidden rounded-xl text-left"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading={loading} className={cn("w-full rounded-xl border border-border bg-muted object-contain", className)} />
        <span className="pointer-events-none absolute right-2 bottom-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <ZoomIn className="size-3" /> Chạm để phóng to
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[95vh] max-w-[95vw] overflow-y-auto p-2 sm:max-w-[95vw]">
          <DialogTitle className="sr-only">Ảnh phóng to</DialogTitle>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className="w-full rounded-lg" />
        </DialogContent>
      </Dialog>
    </>
  );
}
