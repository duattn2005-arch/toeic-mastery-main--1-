import { Bell, Moon, Music, Palette } from "lucide-react";
import { SITE_THEMES } from "@/lib/constants/site-themes";

const PREVIEW_THEMES = SITE_THEMES.filter((t) => t.media !== "gradient").slice(0, 3);

function IconRow({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-2.5 py-2 text-left">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-3.5" />
      </span>
      <span className="text-xs leading-snug text-foreground">{label}</span>
    </div>
  );
}

/**
 * Rich content for DashboardTour's icon-cluster step — mounted into that
 * one step's driver.js popover via onPopoverRender (see use-tour-driver.ts)
 * instead of the plain-text `description` every other step uses. This is
 * the former standalone IconGuidePopup's body, reused verbatim so the tour
 * step now looks exactly like that deleted dialog once did, just spotlit
 * on the real icons instead of floating as a second, disconnected overlay.
 */
export function DashboardTourIconCluster() {
  return (
    <div className="flex flex-col gap-2 pt-1">
      <p className="text-xs text-muted-foreground">Vài icon nhỏ ở góc trên bên phải giúp buổi học của bạn thoải mái hơn:</p>

      <div className="grid grid-cols-2 gap-1.5">
        <IconRow icon={Music} label="Nhạc Lo-fi/Chill tăng tập trung" />
        <IconRow icon={Palette} label="Live theme đổi nền web" />
        <IconRow icon={Moon} label="Dark Mode bảo vệ mắt" />
        <IconRow icon={Bell} label="Nhắc lịch giữ chuỗi Streak" />
      </div>

      {PREVIEW_THEMES.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5 overflow-hidden rounded-lg">
          {PREVIEW_THEMES.map((theme) => (
            <div
              key={theme.id}
              className="h-10 bg-cover bg-center"
              style={{
                backgroundImage: theme.previewSrc
                  ? `url(${theme.previewSrc}), linear-gradient(135deg, ${theme.swatchFrom}, ${theme.swatchTo})`
                  : `linear-gradient(135deg, ${theme.swatchFrom}, ${theme.swatchTo})`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
