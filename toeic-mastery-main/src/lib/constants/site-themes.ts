/**
 * Registry of selectable site-wide "Live theme" wallpapers (see ProCard's
 * benefit list). A plain string id is stored on UserSettings.siteTheme
 * instead of a Prisma enum so new themes can ship without a migration.
 *
 * Each non-default theme currently points at a hand-drawn placeholder SVG
 * under public/themes/<id>/background.svg (see public/themes/README.md) —
 * swap any of those files for a real photo/video export whenever one's
 * ready, no code change needed as long as the path here is updated to
 * match. Every background is layered as CSS `background-image` (image
 * themes) or an absolutely-positioned <video> with that same file as
 * `poster` (video themes) over the theme's swatch gradient, so a missing
 * file just falls back to the gradient instead of a broken-image glyph.
 *
 * Rendered in two places: full-clarity on the dashboard hero
 * (dashboard-hero.tsx) and as a dimmed ambient backdrop behind every page
 * in the app shell (site-theme-background.tsx) — both read the same
 * registry entry so the two stay visually consistent.
 */

export type SiteThemeMedia = "gradient" | "image" | "video";

export interface SiteTheme {
  id: string;
  name: string;
  description: string;
  tier: "FREE" | "PRO";
  media: SiteThemeMedia;
  /** Public path to a still preview image (gallery card + video poster). */
  previewSrc?: string;
  /** Public path to the full-res background photo (media: "image"). */
  imageSrc?: string;
  /** Public path to the looping background video (media: "video"). */
  videoSrc?: string;
  /** Gradient fallback shown while/if the real asset is missing. */
  swatchFrom: string;
  swatchTo: string;
}

export const DEFAULT_SITE_THEME_ID = "aurora";

export const SITE_THEMES: SiteTheme[] = [
  {
    id: "aurora",
    name: "Aurora",
    description: "Gradient chuyển động tím – xanh dương (mặc định).",
    tier: "FREE",
    media: "gradient",
    swatchFrom: "#6a4bf0",
    swatchTo: "#2f8fe0",
  },
  {
    id: "lily-pond-cat",
    name: "Mèo đen bên hồ sen",
    description: "Chú mèo viết bài dưới lá sen giữa hồ hoa súng.",
    tier: "FREE",
    media: "image",
    previewSrc: "/themes/lily-pond-cat/background.svg",
    imageSrc: "/themes/lily-pond-cat/background.svg",
    swatchFrom: "#3c6e52",
    swatchTo: "#1f3d2e",
  },
  {
    id: "torii-sunset",
    name: "Cổng Torii hoàng hôn",
    description: "Ngồi ngắm hoàng hôn cùng chú chó nhỏ bên cổng torii.",
    tier: "FREE",
    media: "image",
    previewSrc: "/themes/torii-sunset/background.svg",
    imageSrc: "/themes/torii-sunset/background.svg",
    swatchFrom: "#4a3b6b",
    swatchTo: "#c98a4b",
  },
  {
    id: "rainy-living-room",
    name: "Phòng khách chiều mưa",
    description: "Ghi chú bên cửa sổ chiều mưa cùng mèo cưng.",
    tier: "FREE",
    media: "image",
    previewSrc: "/themes/rainy-living-room/background.svg",
    imageSrc: "/themes/rainy-living-room/background.svg",
    swatchFrom: "#3a4a63",
    swatchTo: "#1c2740",
  },
  {
    id: "tokyo-rain-desk",
    name: "Bàn học đêm mưa Tokyo",
    description: "Góc học tập nhìn ra Tokyo Tower dưới mưa đêm — nền video chuyển động.",
    tier: "PRO",
    media: "video",
    previewSrc: "/themes/tokyo-rain-desk/background.svg",
    videoSrc: "/themes/tokyo-rain-desk/loop.mp4",
    swatchFrom: "#1e2a4a",
    swatchTo: "#0d1224",
  },
  {
    id: "attic-tokyo-view",
    name: "Gác mái nhìn phố đêm",
    description: "Góc gác mái ấm cúng, poster phim hoạt hình quanh tường.",
    tier: "PRO",
    media: "image",
    previewSrc: "/themes/attic-tokyo-view/background.svg",
    imageSrc: "/themes/attic-tokyo-view/background.svg",
    swatchFrom: "#2b2545",
    swatchTo: "#141225",
  },
  {
    id: "balcony-night",
    name: "Ban công đêm sao",
    description: "Học bài trên ban công đầy đèn dây cùng chú mèo bên cạnh.",
    tier: "PRO",
    media: "image",
    previewSrc: "/themes/balcony-night/background.svg",
    imageSrc: "/themes/balcony-night/background.svg",
    swatchFrom: "#2a2350",
    swatchTo: "#160f33",
  },
  {
    id: "jungle-view",
    name: "Ban công rừng nhiệt đới",
    description: "Nhìn ra thung lũng rừng mù sương lúc hoàng hôn — nền video chuyển động.",
    tier: "PRO",
    media: "video",
    previewSrc: "/themes/jungle-view/background.svg",
    videoSrc: "/themes/jungle-view/loop.mp4",
    swatchFrom: "#274a3b",
    swatchTo: "#0f2419",
  },
  {
    id: "pixel-cottage",
    name: "Bếp nhỏ pixel art",
    description: "Góc bếp ấm áp phong cách pixel art, nhìn ra đồng quê.",
    tier: "PRO",
    media: "image",
    previewSrc: "/themes/pixel-cottage/background.svg",
    imageSrc: "/themes/pixel-cottage/background.svg",
    swatchFrom: "#4a3423",
    swatchTo: "#231509",
  },
];

const THEME_BY_ID = new Map(SITE_THEMES.map((theme) => [theme.id, theme]));

export function getSiteTheme(id: string | null | undefined): SiteTheme {
  return (id && THEME_BY_ID.get(id)) || THEME_BY_ID.get(DEFAULT_SITE_THEME_ID)!;
}
