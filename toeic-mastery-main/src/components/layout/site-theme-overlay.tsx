import { Bird } from "lucide-react";

/**
 * Per-theme decorative motion layered over a photo/video Live theme's
 * background — drifting clouds, a bird crossing the sky, moonlight sweeping
 * the water — so it reads as alive rather than a still image. Purely
 * cosmetic (aria-hidden, pointer-events-none). Rendered by both
 * DashboardHero (full clarity) and SiteThemeBackground (dimmed site-wide
 * backdrop) for every photo/video theme; returns null for any theme without
 * a hand-tuned overlay yet, so adding a new theme to the registry never
 * requires touching this file's callers — only this file, once one's ready.
 */
export function SiteThemeOverlay({ themeId }: { themeId: string }) {
  switch (themeId) {
    case "lily-pond-cat":
      return <LilyPondCatOverlay />;
    default:
      return null;
  }
}

function LilyPondCatOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Clouds drifting through the upper sky — staggered size/speed/delay
          for a loose parallax feel instead of three identical shapes marching
          in lockstep. */}
      <div className="cloud-drift h-5 w-24 rounded-full bg-white/25 blur-md" style={{ top: "6%", animationDuration: "68s" }} />
      <div className="cloud-drift h-4 w-16 rounded-full bg-white/15 blur-md" style={{ top: "13%", animationDuration: "95s", animationDelay: "-40s" }} />
      <div className="cloud-drift h-3 w-14 rounded-full bg-white/20 blur-sm" style={{ top: "3%", animationDuration: "52s", animationDelay: "-18s" }} />

      {/* A couple of birds crossing the moonlit sky at different heights/paces. */}
      <Bird className="bird-flight size-3 text-black/35" style={{ animationDuration: "22s" }} />
      <Bird className="bird-flight size-2.5 text-black/25" style={{ animationDuration: "27s", animationDelay: "-11s" }} />

      {/* Moonlight sweeping across the pond's surface. */}
      <div
        className="water-shimmer bottom-0 h-1/4 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent blur-sm"
        style={{ animationDuration: "11s" }}
      />
    </div>
  );
}
