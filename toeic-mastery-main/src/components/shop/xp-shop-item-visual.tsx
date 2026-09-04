import { Droplets, Flame, Flower2, Ghost, Leaf, Moon, Snowflake, Sparkle, Sparkles, Wind, Zap, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ShopItemRarity, ShopItemTheme } from "@/lib/constants/xp-shop";
import { RabbitIllustration } from "@/components/mascot/mascot-illustration";

const THEME_STYLES: Record<ShopItemTheme, { ring: string; glow: string; icon: LucideIcon; iconColor: string }> = {
  dawn: { ring: "from-amber-200 to-orange-400", glow: "#fb923c", icon: Sparkle, iconColor: "#f59e0b" },
  verdant: { ring: "from-lime-300 to-green-600", glow: "#4ade80", icon: Leaf, iconColor: "#16a34a" },
  aqua: { ring: "from-cyan-300 to-sky-600", glow: "#22d3ee", icon: Droplets, iconColor: "#0891b2" },
  storm: { ring: "from-slate-300 to-slate-600", glow: "#94a3b8", icon: Wind, iconColor: "#64748b" },
  ember: { ring: "from-amber-300 to-red-600", glow: "#f97316", icon: Flame, iconColor: "#ea580c" },
  frost: { ring: "from-sky-200 to-blue-600", glow: "#38bdf8", icon: Snowflake, iconColor: "#0284c7" },
  bloom: { ring: "from-pink-200 to-rose-500", glow: "#f472b6", icon: Flower2, iconColor: "#db2777" },
  shadow: { ring: "from-violet-400 to-zinc-900", glow: "#7c3aed", icon: Ghost, iconColor: "#8b5cf6" },
  thunder: { ring: "from-yellow-300 to-violet-700", glow: "#a78bfa", icon: Zap, iconColor: "#eab308" },
  arcane: { ring: "from-emerald-300 to-teal-700", glow: "#2dd4bf", icon: Sparkles, iconColor: "#0d9488" },
  elemental: { ring: "from-sky-400 via-white to-red-500", glow: "#f97316", icon: Flame, iconColor: "#ef4444" },
  cosmic: { ring: "from-indigo-300 via-fuchsia-400 to-purple-700", glow: "#e879f9", icon: Moon, iconColor: "#c026d3" },
};

/** Rarity drives *how much* motion a frame has, not its color/glyph (that's
 * THEME_STYLES) — more orbiting particles and a stronger glow the higher the
 * tier, so rarity reads at a glance even before the price/badge register. */
const RARITY_MOTION: Record<ShopItemRarity, { particles: number; ringPadding: string; glow: string }> = {
  COMMON: { particles: 2, ringPadding: "p-[2px]", glow: "0 0 5px" },
  RARE: { particles: 3, ringPadding: "p-[2px]", glow: "0 0 7px" },
  EPIC: { particles: 4, ringPadding: "p-[2.5px]", glow: "0 0 10px" },
  LEGENDARY: { particles: 5, ringPadding: "p-[3px]", glow: "0 0 14px" },
  MYTHIC: { particles: 6, ringPadding: "p-[3px]", glow: "0 0 20px" },
};

/** An avatar frame preview for the XP shop: a spinning themed gradient ring
 * around the app's own mascot, orbited by a handful of small glyph icons —
 * the count/glow scale with rarity, the color/glyph come from the item's
 * theme, so no two items in the catalog look identical. */
export function XpShopItemVisual({ rarity, theme, size = 80 }: { rarity: ShopItemRarity; theme: ShopItemTheme; size?: number }) {
  const style = THEME_STYLES[theme];
  const motion = RARITY_MOTION[rarity];
  const Icon = style.icon;
  const radius = size / 2 + 9;
  const angles = Array.from({ length: motion.particles }, (_, i) => (360 / motion.particles) * i);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className={cn("spin-slow absolute inset-0 rounded-full bg-gradient-to-br", style.ring, motion.ringPadding, rarity === "MYTHIC" && "ring-hue-shift")}
        style={{ boxShadow: `${motion.glow} ${style.glow}` }}
      >
        <div className="flex size-full items-center justify-center rounded-full bg-card">
          <RabbitIllustration state="success" className="size-[55%]" />
        </div>
      </div>

      <div className={cn("absolute inset-0", rarity === "MYTHIC" ? "spin-reverse-slow" : "spin-slow")} aria-hidden>
        {angles.map((angle, i) => (
          <span key={i} className="absolute top-1/2 left-1/2" style={{ transform: `rotate(${angle}deg) translate(${radius}px)` }}>
            <Icon
              className="particle-twinkle size-3 -translate-x-1/2 -translate-y-1/2"
              style={{ animationDelay: `${i * 0.25}s`, color: style.iconColor, filter: `drop-shadow(0 0 3px ${style.glow})` }}
            />
          </span>
        ))}
      </div>
    </div>
  );
}
