import { Info } from "lucide-react";
import type { ReactNode } from "react";

/** Attention-grabbing tip box shown at the top of "Nhập" import modals, so
 * admins actually notice the expected paste format instead of guessing. */
export function ImportGuideCallout({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2.5 rounded-xl border border-primary/25 bg-primary/5 p-3 text-sm">
      <Info className="mt-0.5 size-4 shrink-0 text-primary" />
      <div className="flex flex-col gap-1 text-foreground/90">{children}</div>
    </div>
  );
}
