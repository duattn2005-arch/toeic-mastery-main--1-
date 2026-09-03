"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Crown, Palette, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { updateSiteThemeAction } from "@/lib/actions/site-theme";
import { SITE_THEMES, type SiteTheme } from "@/lib/constants/site-themes";

function ThemeCard({
  theme,
  active,
  locked,
  pending,
  onSelect,
}: {
  theme: SiteTheme;
  active: boolean;
  locked: boolean;
  pending: boolean;
  onSelect: (theme: SiteTheme) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(theme)}
      disabled={pending}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border-2 text-left transition-colors disabled:cursor-wait",
        active ? "border-primary" : "border-transparent hover:border-border"
      )}
    >
      <div
        className="relative h-28 w-full bg-cover bg-center"
        style={{
          backgroundImage: theme.previewSrc
            ? `linear-gradient(to top, rgba(0,0,0,.35), rgba(0,0,0,0)), url(${theme.previewSrc}), linear-gradient(135deg, ${theme.swatchFrom}, ${theme.swatchTo})`
            : `linear-gradient(135deg, ${theme.swatchFrom}, ${theme.swatchTo})`,
        }}
      >
        {theme.media === "video" && (
          <PlayCircle className="absolute bottom-2 right-2 size-5 text-white drop-shadow" aria-hidden />
        )}
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/45">
            <Crown className="size-6 text-amber-300" />
          </div>
        )}
        {active && (
          <div className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="size-3.5" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-0.5 bg-card p-3">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium">{theme.name}</span>
          {theme.tier === "PRO" && (
            <Badge variant="outline" className="border-amber-400/50 text-amber-500">
              PRO
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{theme.description}</span>
      </div>
    </button>
  );
}

/** Header-corner entry point for the site-wide "Live theme" wallpaper —
 * lives in the same icon cluster as the dark-mode toggle so it's reachable
 * from every page, not just the dashboard. Applying a theme updates
 * UserSettings.siteTheme and revalidates the whole app-shell layout, so the
 * new wallpaper shows up immediately behind every page. */
export function SiteThemeGallery({ currentThemeId, isPro }: { currentThemeId: string; isPro: boolean }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  function handleSelect(theme: SiteTheme) {
    if (theme.id === currentThemeId) return;

    if (theme.tier === "PRO" && !isPro) {
      toast("Nâng cấp Pro để mở khóa Live theme chuyển động này.", {
        action: { label: "Nâng cấp", onClick: () => router.push("/pricing") },
      });
      return;
    }

    startTransition(async () => {
      const result = await updateSiteThemeAction(theme.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`Đã áp dụng theme "${theme.name}" cho toàn bộ trang web`);
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label="Đổi giao diện Live theme" className="rounded-full">
          <Palette className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Live theme cho toàn bộ trang web</DialogTitle>
          <DialogDescription>
            Chọn hình nền động — áp dụng ngay cho mọi trang, không chỉ Dashboard. Theme PRO có nền ảnh/video chất lượng cao, cập nhật thường xuyên.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {SITE_THEMES.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              active={theme.id === currentThemeId}
              locked={theme.tier === "PRO" && !isPro}
              pending={pending}
              onSelect={handleSelect}
            />
          ))}
        </div>
        {!isPro && (
          <p className="text-center text-xs text-muted-foreground">
            <Link href="/pricing" className="font-medium text-primary underline underline-offset-2">
              Nâng cấp Pro
            </Link>{" "}
            để mở khóa toàn bộ theme, gồm nền video chuyển động.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
