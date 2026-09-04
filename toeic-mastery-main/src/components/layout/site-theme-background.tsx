import { getSiteTheme } from "@/lib/constants/site-themes";

/**
 * Ambient wallpaper behind the entire authenticated app shell — the same
 * theme the dashboard hero shows at full clarity, dimmed here so it reads
 * as a subtle backdrop rather than competing with page content (reading
 * passages, exam questions, vocab tables all still sit on their own opaque
 * `bg-card` surfaces, unaffected).
 *
 * Renders nothing for the default "aurora" theme — that case keeps
 * app-shell's plain `bg-background`, zero visual change for anyone who
 * hasn't picked a theme. No "use client" needed: plain CSS + a native
 * autoplaying <video>, no hooks.
 */
export function SiteThemeBackground({ themeId }: { themeId: string }) {
  const theme = getSiteTheme(themeId);
  if (theme.media === "gradient") return null;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${theme.imageSrc ?? theme.previewSrc}), linear-gradient(135deg, ${theme.swatchFrom}, ${theme.swatchTo})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      {theme.media === "video" && theme.videoSrc && (
        <video
          className="absolute inset-0 size-full object-cover"
          src={theme.videoSrc}
          poster={theme.previewSrc}
          autoPlay
          muted
          loop
          playsInline
        />
      )}
      {/* Dims the art down to an ambient tint using the app's own background
          token, so it still adapts correctly between light/dark mode instead
          of a hardcoded black/white scrim. */}
      <div className="absolute inset-0 bg-background/75" />
    </div>
  );
}
