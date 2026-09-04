import {
  CloudLightning,
  Droplets,
  Flame,
  Flower2,
  Ghost,
  Leaf,
  Moon,
  Shell,
  Skull,
  Snowflake,
  Sparkle,
  Sparkles,
  Star,
  Sun,
  Sunrise,
  Waves,
  Wind,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { ShopItemRarity, ShopItemTheme } from "@/lib/constants/xp-shop";
import { RabbitIllustration } from "@/components/mascot/mascot-illustration";

interface Glyph {
  icon: LucideIcon;
  color: string;
}

interface ThemeStyle {
  /** Thin inset ring color the wreath sits on. */
  ringTint: string;
  glow: string;
  /** Two alternating glyphs per theme (e.g. flower + leaf for bloom) — a
   * single repeated icon read as flat; alternating pairs is what makes the
   * ring look like an arranged wreath instead of a row of stamped copies. */
  primary: Glyph;
  secondary: Glyph;
}

const THEME_STYLES: Record<ShopItemTheme, ThemeStyle> = {
  dawn: { ringTint: "#fbbf24", glow: "#fb923c", primary: { icon: Sparkle, color: "#f59e0b" }, secondary: { icon: Sunrise, color: "#fb923c" } },
  verdant: { ringTint: "#65a30d", glow: "#4ade80", primary: { icon: Leaf, color: "#16a34a" }, secondary: { icon: Sun, color: "#84cc16" } },
  aqua: { ringTint: "#0891b2", glow: "#22d3ee", primary: { icon: Droplets, color: "#0891b2" }, secondary: { icon: Shell, color: "#06b6d4" } },
  storm: { ringTint: "#64748b", glow: "#94a3b8", primary: { icon: Wind, color: "#64748b" }, secondary: { icon: Waves, color: "#475569" } },
  ember: { ringTint: "#ea580c", glow: "#f97316", primary: { icon: Flame, color: "#ea580c" }, secondary: { icon: Sun, color: "#f59e0b" } },
  frost: { ringTint: "#0284c7", glow: "#38bdf8", primary: { icon: Snowflake, color: "#0284c7" }, secondary: { icon: Star, color: "#38bdf8" } },
  bloom: { ringTint: "#db2777", glow: "#f472b6", primary: { icon: Flower2, color: "#db2777" }, secondary: { icon: Sparkle, color: "#f472b6" } },
  shadow: { ringTint: "#7c3aed", glow: "#7c3aed", primary: { icon: Ghost, color: "#8b5cf6" }, secondary: { icon: Skull, color: "#581c87" } },
  thunder: { ringTint: "#a78bfa", glow: "#a78bfa", primary: { icon: Zap, color: "#eab308" }, secondary: { icon: CloudLightning, color: "#7c3aed" } },
  arcane: { ringTint: "#0d9488", glow: "#2dd4bf", primary: { icon: Sparkles, color: "#0d9488" }, secondary: { icon: Star, color: "#059669" } },
  elemental: { ringTint: "#f97316", glow: "#f97316", primary: { icon: Flame, color: "#ef4444" }, secondary: { icon: Snowflake, color: "#0284c7" } },
  cosmic: { ringTint: "#c026d3", glow: "#e879f9", primary: { icon: Moon, color: "#c026d3" }, secondary: { icon: Star, color: "#a855f7" } },
};

/** Rarity drives how dense/bright the wreath is, not its color/glyphs (that's
 * THEME_STYLES) — a Mythic item has more than double a Common one's glyph
 * count and a much stronger glow, so rarity reads at a glance. */
const RARITY_MOTION: Record<ShopItemRarity, { count: number; glow: string }> = {
  COMMON: { count: 6, glow: "0 0 4px" },
  RARE: { count: 8, glow: "0 0 6px" },
  EPIC: { count: 10, glow: "0 0 9px" },
  LEGENDARY: { count: 12, glow: "0 0 13px" },
  MYTHIC: { count: 14, glow: "0 0 18px" },
};

/** An avatar frame preview for the XP shop: a ring of alternating themed
 * glyph icons wreathed around the app's own mascot, slowly spinning — glyph
 * pair + color come from the item's theme, count/glow from its rarity, so no
 * two items in the catalog look alike and rarer items visibly read denser
 * and brighter. */
export function XpShopItemVisual({ rarity, theme, size = 92 }: { rarity: ShopItemRarity; theme: ShopItemTheme; size?: number }) {
  const style = THEME_STYLES[theme];
  const motion = RARITY_MOTION[rarity];
  const radius = size / 2 + 5;

  const glyphs = Array.from({ length: motion.count }, (_, i) => {
    const isPrimary = i % 2 === 0;
    return { angle: (360 / motion.count) * i, glyph: isPrimary ? style.primary : style.secondary, iconSize: isPrimary ? 12 : 9.5 };
  });

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className={cn("absolute inset-0 rounded-full", rarity === "MYTHIC" ? "spin-reverse-slow" : "spin-slow", rarity === "MYTHIC" && "ring-hue-shift")}
        style={{ boxShadow: `inset 0 0 0 1.5px ${style.ringTint}66, ${motion.glow} ${style.glow}` }}
      />

      <div className="absolute inset-[12%] flex items-center justify-center rounded-full bg-card">
        <RabbitIllustration state="success" className="size-[62%]" />
      </div>

      <div className={cn("absolute inset-0", rarity === "MYTHIC" ? "spin-reverse-slow" : "spin-slow")} aria-hidden>
        {glyphs.map(({ angle, glyph, iconSize }, i) => {
          const Icon = glyph.icon;
          return (
            <span key={i} className="absolute top-1/2 left-1/2" style={{ transform: `rotate(${angle}deg) translate(${radius}px)` }}>
              <Icon
                className="particle-twinkle -translate-x-1/2 -translate-y-1/2"
                style={{
                  width: iconSize,
                  height: iconSize,
                  animationDelay: `${i * 0.12}s`,
                  color: glyph.color,
                  filter: `drop-shadow(0 0 2px ${style.glow})`,
                }}
              />
            </span>
          );
        })}
      </div>
    </div>
  );
}
