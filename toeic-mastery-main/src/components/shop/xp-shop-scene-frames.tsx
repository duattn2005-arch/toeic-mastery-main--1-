import { cn } from "@/lib/utils";
import type { ShopItemRarity } from "@/lib/constants/xp-shop";
import { RabbitIllustration } from "@/components/mascot/mascot-illustration";

/**
 * Every shop item (see XP_SHOP_ITEMS in xp-shop.ts) gets its own bespoke
 * illustrated scene here, dispatched by item id in xp-shop-item-visual.tsx —
 * not by theme. Items sharing a theme (e.g. the three "ember" items) still
 * need to look different from each other, so the unit of illustration is
 * the item, with the theme only loosely informing its color family.
 */

/** Rarity still modulates intensity here, just expressed per-scene (more
 * waves/bubbles, brighter flame glow, etc.) rather than through one shared
 * "particle count" knob like a generic wreath would use. */
function rarityScale(rarity: ShopItemRarity): { extra: boolean; glow: number } {
  switch (rarity) {
    case "COMMON":
      return { extra: false, glow: 5 };
    case "RARE":
      return { extra: false, glow: 7 };
    case "EPIC":
      return { extra: true, glow: 10 };
    case "LEGENDARY":
      return { extra: true, glow: 14 };
    case "MYTHIC":
      return { extra: true, glow: 20 };
  }
}

function FrameShell({
  size,
  ring,
  glow,
  className,
  children,
}: {
  size: number;
  ring: string;
  glow: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full p-[3px]" style={{ background: ring, boxShadow: `0 0 ${glow} color-mix(in oklab, ${ring.match(/#[0-9a-f]{6}/i)?.[0] ?? "#888"} 70%, transparent)` }}>
        <div className="flex size-full items-center justify-center rounded-full bg-card">
          <RabbitIllustration state="success" className="size-[60%]" />
        </div>
      </div>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Shared decorative primitives — each scene composes a handful of these
 * with its own placement/colors/timing rather than every scene hand-rolling
 * its own one-off shapes. Angle-placed primitives all use the same
 * convention: `rotate(angleDeg) translateY(-radius)`, i.e. 0deg is straight
 * up and angles increase clockwise, so scenes can mix e.g. StaticLeaf and
 * Horn on the same ring and have their angles agree.
 * ---------------------------------------------------------------------- */

function Wave({ left, bottom, hue, delay, duration }: { left: string; bottom: string; hue: string; delay: string; duration: string }) {
  return (
    <svg viewBox="0 0 24 10" className="wave-bob absolute h-3.5 w-8" style={{ left, bottom, color: hue, animationDelay: delay, animationDuration: duration }} aria-hidden>
      <path d="M0,7 Q3,2 6,7 T12,7 T18,7 T24,7 L24,10 L0,10 Z" fill="currentColor" />
    </svg>
  );
}

function Bubble({ left, top, size, hue, delay }: { left: string; top: string; size: number; hue: string; delay: string }) {
  return <span className="rise-fade absolute rounded-full" style={{ left, top, width: size, height: size, background: hue, animationDelay: delay }} aria-hidden />;
}

function Flame({ left, bottom, height, delay }: { left: string; bottom: string; height: number; delay: string }) {
  return (
    <svg viewBox="0 0 24 24" className="flame-flicker absolute origin-bottom" style={{ left, bottom, height, width: height * 0.75, animationDelay: delay }} aria-hidden>
      <path d="M12 2c2 4-2 5-2 8a3 3 0 0 0 6 0c0-1-1-2-1-2 2 1 3 3 3 5a6 6 0 1 1-12 0c0-5 4-7 6-11z" fill="url(#flame-grad)" />
      <defs>
        <linearGradient id="flame-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Petal({ left, size, hue, delay, duration, fallDistance }: { left: string; size: number; hue: string; delay: string; duration: string; fallDistance: number }) {
  return (
    <svg
      viewBox="0 0 12 14"
      className="fall-drift absolute top-1/2"
      style={{ left, width: size, height: size * 1.15, marginTop: -size * 0.6, animationDelay: delay, animationDuration: duration, "--fall-distance": `${fallDistance}px` } as React.CSSProperties}
      aria-hidden
    >
      <path d="M6 0C9 2 12 5 6 14C0 5 3 2 6 0Z" fill={hue} />
    </svg>
  );
}

function BambooLeaf({ left, size, delay, duration, fallDistance }: { left: string; size: number; delay: string; duration: string; fallDistance: number }) {
  return (
    <svg
      viewBox="0 0 16 8"
      className="fall-drift absolute top-1/2"
      style={{ left, width: size, height: size * 0.5, marginTop: -size * 0.25, animationDelay: delay, animationDuration: duration, "--fall-distance": `${fallDistance}px` } as React.CSSProperties}
      aria-hidden
    >
      <path d="M0 4C5 0 11 0 16 4C11 8 5 8 0 4Z" fill="#65a30d" />
    </svg>
  );
}

function StaticLeaf({ angleDeg, size }: { angleDeg: number; size: number }) {
  return (
    <div className="absolute top-1/2 left-1/2" style={{ transform: `rotate(${angleDeg}deg) translateY(-${size * 1.6}px)` }} aria-hidden>
      <svg viewBox="0 0 16 8" width={size} height={size * 0.5} className="sway origin-bottom">
        <path d="M0 4C5 0 11 0 16 4C11 8 5 8 0 4Z" fill="#4d7c0f" />
      </svg>
    </div>
  );
}

/** A broader, brighter-green maple-style leaf — distinct silhouette and
 * color from bamboo's leaf, so leaf-based scenes don't read as twins. */
function MapleLeaf({ left, size, delay, duration, fallDistance }: { left: string; size: number; delay: string; duration: string; fallDistance: number }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className="fall-drift absolute top-1/2"
      style={{ left, width: size, height: size, marginTop: -size * 0.5, animationDelay: delay, animationDuration: duration, "--fall-distance": `${fallDistance}px` } as React.CSSProperties}
      aria-hidden
    >
      <path d="M8 0C9 3 12 3 13 1C13 4 15 5 15 5C13 6 13 8 14 9C11 8 11 10 12 12C9 10 9 12 8 16C7 12 7 10 4 12C5 10 5 8 2 9C3 8 3 6 1 5C1 5 3 4 3 1C4 3 7 3 8 0Z" fill="#22c55e" />
    </svg>
  );
}

function StaticMapleLeaf({ angleDeg, size, hue = "#16a34a" }: { angleDeg: number; size: number; hue?: string }) {
  return (
    <div className="absolute top-1/2 left-1/2" style={{ transform: `rotate(${angleDeg}deg) translateY(-${size * 1.6}px)` }} aria-hidden>
      <svg viewBox="0 0 16 16" width={size} height={size} className="sway origin-bottom">
        <path d="M8 0C9 3 12 3 13 1C13 4 15 5 15 5C13 6 13 8 14 9C11 8 11 10 12 12C9 10 9 12 8 16C7 12 7 10 4 12C5 10 5 8 2 9C3 8 3 6 1 5C1 5 3 4 3 1C4 3 7 3 8 0Z" fill={hue} />
      </svg>
    </div>
  );
}

function Frond({ angleDeg, size, delay, hasNut }: { angleDeg: number; size: number; delay: string; hasNut?: boolean }) {
  return (
    <div className="absolute top-1/2 left-1/2" style={{ transform: `rotate(${angleDeg}deg) translateY(-${size * 0.95}px)` }} aria-hidden>
      <svg viewBox="0 0 16 26" width={size * 0.5} height={size} className="sway origin-bottom" style={{ animationDelay: delay }}>
        <path d="M8 26C8 26 0 18 2 8C3 3 8 0 8 0C8 0 13 3 14 8C16 18 8 26 8 26Z" fill="#16a34a" />
        <path d="M8 26V4" stroke="#15803d" strokeWidth="0.8" />
      </svg>
      {hasNut && <span className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-[#78350f]" />}
    </div>
  );
}

function Crown({ size }: { size: number }) {
  return (
    <div className="float-y absolute top-0 left-1/2 -translate-x-1/2" style={{ marginTop: -size * 0.48 }} aria-hidden>
      <svg viewBox="0 0 24 18" width={size * 0.7} height={size * 0.52}>
        <path d="M3 15L3 6 L8 10 L12 3 L16 10 L21 6 L21 15 Z" fill="url(#crown-grad)" stroke="#92400e" strokeWidth="0.6" />
        <rect x="3" y="14" width="18" height="3" rx="1" fill="url(#crown-grad)" stroke="#92400e" strokeWidth="0.6" />
        <circle cx="8" cy="10" r="1.3" fill="#fca5a5" />
        <circle cx="12" cy="3.5" r="1.5" fill="#93c5fd" />
        <circle cx="16" cy="10" r="1.3" fill="#fca5a5" />
        <defs>
          <linearGradient id="crown-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/** A frozen counterpart to Crown — ice shards instead of gold, for Glacier
 * Crown. */
function IceCrown({ size }: { size: number }) {
  return (
    <div className="float-y absolute top-0 left-1/2 -translate-x-1/2" style={{ marginTop: -size * 0.46 }} aria-hidden>
      <svg viewBox="0 0 24 18" width={size * 0.68} height={size * 0.5}>
        <path d="M3 15L3 6 L8 10 L12 2 L16 10 L21 6 L21 15 Z" fill="url(#ice-crown-grad)" stroke="#0c4a6e" strokeWidth="0.6" />
        <rect x="3" y="14" width="18" height="3" rx="1" fill="url(#ice-crown-grad)" stroke="#0c4a6e" strokeWidth="0.6" />
        <circle cx="12" cy="4" r="1.6" fill="#f0f9ff" />
        <defs>
          <linearGradient id="ice-crown-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f0f9ff" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/** A four-point sparkle glint. `hue` keeps one shape reading as different
 * materials (gold sunlight vs. teal magic vs. violet stardust) across
 * scenes. */
function Sparkle({ left, top, size, delay, hue = "#fde047" }: { left: string; top: string; size: number; delay: string; hue?: string }) {
  return (
    <svg viewBox="0 0 20 20" className="particle-twinkle absolute" style={{ left, top, width: size, height: size, animationDelay: delay }} aria-hidden>
      <path d="M10 0C10 6 14 10 20 10C14 10 10 14 10 20C10 14 6 10 0 10C6 10 10 6 10 0Z" fill={hue} />
    </svg>
  );
}

/** A puffy cloud drifting slowly side to side (Storm Sail). */
function Cloud({ left, top, scale, delay }: { left: string; top: string; scale: number; delay: string }) {
  return (
    <svg viewBox="0 0 32 16" className="drift-x absolute" style={{ left, top, width: 32 * scale, height: 16 * scale, animationDelay: delay }} aria-hidden>
      <path d="M6 13a5 5 0 0 1-1-9.9A6 6 0 0 1 16 3a5 5 0 0 1 7 5 4 4 0 0 1-1 8H6Z" fill="#94a3b8" />
    </svg>
  );
}

/** A lightning bolt that strikes rather than breathes — see the `bolt-flash`
 * keyframes (Storm Sail, Thunder Crest). */
function Bolt({ left, top, size, delay, hue = "#facc15" }: { left: string; top: string; size: number; delay: string; hue?: string }) {
  return (
    <svg viewBox="0 0 12 20" className="bolt-flash absolute" style={{ left, top, width: size, height: size * 1.6, animationDelay: delay }} aria-hidden>
      <path d="M7 0L0 12H4L3 20L11 8H6.5L9.5 0Z" fill={hue} />
    </svg>
  );
}

/** A falling six-point snowflake (Frost Halo, Glacier Crown). */
function Snowflake({ left, size, delay, duration, fallDistance }: { left: string; size: number; delay: string; duration: string; fallDistance: number }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className="fall-drift absolute top-1/2"
      style={{ left, width: size, height: size, marginTop: -size * 0.5, animationDelay: delay, animationDuration: duration, "--fall-distance": `${fallDistance}px` } as React.CSSProperties}
      aria-hidden
    >
      <g stroke="#e0f2fe" strokeWidth="1.6" strokeLinecap="round">
        <path d="M8 0V16M1.5 4L14.5 12M1.5 12L14.5 4" />
      </g>
    </svg>
  );
}

/** A fixed ice spike jutting out from the ring, gently breathing in size
 * (Frost Halo, Glacier Crown, Elemental Clash). */
function IceSpike({ angleDeg, size }: { angleDeg: number; size: number }) {
  return (
    <div className="absolute top-1/2 left-1/2" style={{ transform: `rotate(${angleDeg}deg) translateY(-${size * 1.5}px)` }} aria-hidden>
      <svg viewBox="0 0 10 16" width={size * 0.55} height={size} className="ring-bounce">
        <path d="M5 0L9 10L5 16L1 10Z" fill="#7dd3fc" stroke="#e0f2fe" strokeWidth="0.6" />
      </svg>
    </div>
  );
}

/** A curling wisp of smoke that drifts and fades (Shadow Horns' haze,
 * Emerald Wand's aura) — see the `wisp-drift` keyframes. */
function Wisp({ left, top, size, hue, delay, duration }: { left: string; top: string; size: number; hue: string; delay: string; duration: string }) {
  return (
    <svg viewBox="0 0 20 30" className="wisp-drift absolute" style={{ left, top, width: size, height: size * 1.5, color: hue, animationDelay: delay, animationDuration: duration }} aria-hidden>
      <path d="M10 30C10 30 2 22 4 14C5 9 10 8 10 8C10 8 13 4 10 0C16 3 18 9 15 14C12 19 10 24 10 30Z" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

/** A dewdrop resting near the ring, with a glinting highlight (Morning
 * Dew). */
function Dewdrop({ angleDeg, size, delay }: { angleDeg: number; size: number; delay: string }) {
  return (
    <div className="absolute top-1/2 left-1/2" style={{ transform: `rotate(${angleDeg}deg) translateY(-${size * 1.55}px)` }} aria-hidden>
      <svg viewBox="0 0 10 14" width={size * 0.5} height={size * 0.7}>
        <path d="M5 0C5 0 10 7 10 10a5 5 0 0 1-10 0C0 7 5 0 5 0Z" fill="url(#dew-grad)" opacity="0.92" />
        <ellipse cx="3.4" cy="8.2" rx="1.1" ry="1.6" fill="#ffffff" opacity="0.75" />
        <defs>
          <linearGradient id="dew-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="100%" stopColor="#7dd3fc" />
          </linearGradient>
        </defs>
      </svg>
      <span className="particle-twinkle absolute -top-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-white" style={{ animationDelay: delay }} />
    </div>
  );
}

/** A small sailboat cresting the frame's edge, mast tilting with the wind
 * (Storm Sail). */
function SailBoat({ left, bottom, size }: { left: string; bottom: string; size: number }) {
  return (
    <svg viewBox="0 0 20 26" className="sway absolute origin-bottom" style={{ left, bottom, width: size, height: size * 1.3 }} aria-hidden>
      <path d="M10 26V4" stroke="#e2e8f0" strokeWidth="1.2" />
      <path d="M10 4L18 16H10Z" fill="#e2e8f0" />
      <path d="M10 8L4 17H10Z" fill="#cbd5e1" />
      <path d="M2 24C6 26 14 26 18 24" stroke="#64748b" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** A spark shooting outward along a fixed angle, like a comet's tail (Spark
 * Trail). */
function CometTrail({ angleDeg, size, hue, delay, duration }: { angleDeg: number; size: number; hue: string; delay: string; duration: string }) {
  return (
    <div className="absolute top-1/2 left-1/2" style={{ transform: `rotate(${angleDeg}deg)` }} aria-hidden>
      <svg
        viewBox="0 0 6 16"
        className="rise-fade absolute"
        style={{ left: -size * 0.15, top: -size * 1.6, width: size * 0.3, height: size, color: hue, animationDelay: delay, animationDuration: duration }}
      >
        <path d="M3 0C3 0 6 8 3 16C0 8 3 0 3 0Z" fill="currentColor" />
      </svg>
    </div>
  );
}

/** A spiral whirlpool churning around the whole frame (Riptide Ring). */
function Whirlpool({ size }: { size: number }) {
  const s = size * 1.15;
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
      <svg viewBox="0 0 40 40" width={s} height={s} className="spin-reverse-slow" style={{ opacity: 0.55 }}>
        <path d="M20 20C20 20 30 18 30 10C30 4 24 2 20 4C14 7 14 15 20 18C28 22 34 16 32 8" fill="none" stroke="#0e7490" strokeWidth="2" strokeLinecap="round" />
        <path d="M20 20C20 20 10 22 10 30C10 36 16 38 20 36C26 33 26 25 20 22C12 18 6 24 8 32" fill="none" stroke="#22d3ee" strokeWidth="1.6" strokeLinecap="round" opacity="0.85" />
      </svg>
    </div>
  );
}

/** Two dark rings collapsing toward a black center, pulsing (Voidwalker). */
function VoidPortal({ size }: { size: number }) {
  const s = size * 0.9;
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
      <svg viewBox="0 0 40 40" width={s} height={s} className="portal-pulse">
        <circle cx="20" cy="20" r="16" fill="none" stroke="#7c3aed" strokeWidth="1.5" opacity="0.55" />
        <circle cx="20" cy="20" r="10" fill="none" stroke="#c4b5fd" strokeWidth="1.2" opacity="0.5" />
        <circle cx="20" cy="20" r="4" fill="#1e1b3a" opacity="0.9" />
      </svg>
    </div>
  );
}

/** A translucent ribbon of aurora light sweeping across the top of the
 * frame (Aurora Genesis). */
function AuroraRibbon({ top, hue, delay, duration }: { top: string; hue: string; delay: string; duration: string }) {
  return (
    <svg
      viewBox="0 0 60 20"
      className="aurora-wave absolute left-1/2 -translate-x-1/2 mix-blend-screen"
      style={{ top, width: "78%", height: 18, color: hue, animationDelay: delay, animationDuration: duration }}
      aria-hidden
    >
      <path d="M0 10C10 2 20 18 30 10C40 2 50 18 60 10" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.75" />
    </svg>
  );
}

/** A four-petal bloom that never wilts, glowing brighter as it "breathes"
 * (Eternal Bloom). */
function BloomFlower({ size }: { size: number }) {
  return (
    <div className="bloom-pulse absolute top-0 left-1/2 -translate-x-1/2" style={{ marginTop: -size * 0.34 }} aria-hidden>
      <svg viewBox="0 0 24 24" width={size * 0.42} height={size * 0.42}>
        <g fill="#fb7185">
          <ellipse cx="12" cy="6" rx="4" ry="5" />
          <ellipse cx="12" cy="18" rx="4" ry="5" />
          <ellipse cx="6" cy="12" rx="5" ry="4" />
          <ellipse cx="18" cy="12" rx="5" ry="4" />
        </g>
        <circle cx="12" cy="12" r="3.4" fill="#fde047" />
      </svg>
    </div>
  );
}

/** A small star orbiting at a fixed radius, twinkling (Starforged Halo). */
function OrbitStar({ angleDeg, radius, size, delay }: { angleDeg: number; radius: number; size: number; delay: string }) {
  return (
    <div className="absolute top-1/2 left-1/2" style={{ transform: `rotate(${angleDeg}deg) translateY(-${radius}px)` }} aria-hidden>
      <svg viewBox="0 0 12 12" width={size} height={size} className="particle-twinkle" style={{ animationDelay: delay }}>
        <path d="M6 0L7.4 4.6L12 6L7.4 7.4L6 12L4.6 7.4L0 6L4.6 4.6Z" fill="#fef08a" />
      </svg>
    </div>
  );
}

/** A shooting star streaking across a corner (Starforged Halo). */
function MeteorStreak({ delay }: { delay: string }) {
  return <span className="meteor-streak absolute top-[10%] left-[14%] h-0.5 w-4 rounded-full bg-gradient-to-r from-white to-transparent" style={{ animationDelay: delay }} aria-hidden />;
}

/** A glowing stepping-stone along a path arcing around the ring (Moonlit
 * Path). */
function PathDot({ angleDeg, radius, size, delay }: { angleDeg: number; radius: number; size: number; delay: string }) {
  return (
    <span
      className="particle-twinkle absolute top-1/2 left-1/2 rounded-full bg-indigo-200"
      style={{ width: size, height: size, transform: `rotate(${angleDeg}deg) translateY(-${radius}px)`, animationDelay: delay }}
      aria-hidden
    />
  );
}

/** A fixed horn curling up from the ring (Shadow Horns, Devil Headset). */
function Horn({ angleDeg, size, hue }: { angleDeg: number; size: number; hue: string }) {
  return (
    <div className="absolute top-1/2 left-1/2" style={{ transform: `rotate(${angleDeg}deg) translateY(-${size * 1.5}px)` }} aria-hidden>
      <svg viewBox="0 0 10 22" width={size * 0.4} height={size} className="ring-bounce">
        <path d="M5 22C5 22 0 14 2 6C3 2 5 0 5 0C5 0 7 2 8 6C10 14 5 22 5 22Z" fill={hue} />
      </svg>
    </div>
  );
}

/** A crystal shard hovering near the ring, bobbing (Shadow Horns). */
function FloatingCrystal({ left, top, size, hue, delay }: { left: string; top: string; size: number; hue: string; delay: string }) {
  return (
    <svg viewBox="0 0 12 16" className="float-y absolute" style={{ left, top, width: size, height: size * 1.3, animationDelay: delay }} aria-hidden>
      <path d="M6 0L12 6L6 16L0 6Z" fill={hue} opacity="0.9" />
    </svg>
  );
}

/** A curved devil's tail swinging like a pendulum (Devil Headset). */
function DevilTail({ left, bottom, size }: { left: string; bottom: string; size: number }) {
  return (
    <svg viewBox="0 0 16 24" className="sway absolute origin-top" style={{ left, bottom, width: size, height: size * 1.5 }} aria-hidden>
      <path d="M2 0C2 0 16 6 12 16C10 21 4 22 2 20" fill="none" stroke="#b91c1c" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M2 20L6 17M2 20L1 24" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** A gaming-headset band arcing over the top of the frame (Devil
 * Headset). */
function HeadsetBand({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 40 24" className="absolute top-0 left-1/2 -translate-x-1/2" width={size * 0.6} height={size * 0.36} style={{ marginTop: -size * 0.1 }} aria-hidden>
      <path d="M4 20C4 6 36 6 36 20" fill="none" stroke="#1e1b3a" strokeWidth="3" strokeLinecap="round" />
      <circle cx="4" cy="20" r="3.5" fill="#7c2d12" />
      <circle cx="36" cy="20" r="3.5" fill="#7c2d12" />
    </svg>
  );
}

/** A black-and-gold armor crest hovering above the frame, with a violet
 * gem (Thunder Crest). */
function Crest({ size }: { size: number }) {
  return (
    <div className="float-y absolute top-0 left-1/2 -translate-x-1/2" style={{ marginTop: -size * 0.3 }} aria-hidden>
      <svg viewBox="0 0 16 20" width={size * 0.34} height={size * 0.42}>
        <path d="M8 0L16 6V12C16 17 8 20 8 20C8 20 0 17 0 12V6Z" fill="url(#crest-grad)" stroke="#1e293b" strokeWidth="0.6" />
        <path d="M8 4L11 9H5Z" fill="#a78bfa" />
        <defs>
          <linearGradient id="crest-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#111827" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/** A wand fixed at the ring's edge, gem tip glinting (Emerald Wand
 * Aura). */
function MagicWand({ left, top, size, rotate }: { left: string; top: string; size: number; rotate: number }) {
  return (
    <svg viewBox="0 0 10 44" className="absolute" style={{ left, top, width: size * 0.22, height: size, transform: `rotate(${rotate}deg)` }} aria-hidden>
      <path d="M5 44V10" stroke="#78350f" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M5 2L7 7L12 8L7 10L5 15L3 10L-2 8L3 7Z" fill="#34d399" />
    </svg>
  );
}

/** A phoenix silhouette rising above the frame, wings spread (Phoenix
 * Ember). */
function PhoenixBird({ size }: { size: number }) {
  return (
    <div className="float-y absolute top-0 left-1/2 -translate-x-1/2" style={{ marginTop: -size * 0.4 }} aria-hidden>
      <svg viewBox="0 0 40 30" width={size * 0.62} height={size * 0.46}>
        <path
          d="M20 28C20 28 4 24 2 12C1 6 6 2 10 4C8 8 10 14 14 16C12 10 14 4 20 0C26 4 28 10 26 16C30 14 32 8 30 4C34 2 39 6 38 12C36 24 20 28 20 28Z"
          fill="url(#phoenix-grad)"
        />
        <defs>
          <linearGradient id="phoenix-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="60%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#b91c1c" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/** A moss-veined blade crossing the frame diagonally (Verdant Blade). */
function Blade({ size }: { size: number }) {
  return (
    <div className="absolute top-1/2 left-1/2" style={{ transform: "translate(-50%, -50%) rotate(28deg)" }} aria-hidden>
      <svg viewBox="0 0 10 90" width={size * 0.16} height={size * 1.25}>
        <path d="M5 0L8 14V78L5 90L2 78V14Z" fill="url(#blade-grad)" stroke="#334155" strokeWidth="0.6" />
        <path d="M0 66C4 64 6 64 10 66" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
        <path d="M2 40C5 42 5 42 8 40" stroke="#22c55e" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
        <rect x="2" y="76" width="6" height="6" fill="#78350f" />
        <defs>
          <linearGradient id="blade-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/** A vermillion torii gate framing the top of the ring (Sakura Shrine). */
function ToriiGate({ size }: { size: number }) {
  return (
    <div className="absolute top-0 left-1/2 -translate-x-1/2" style={{ marginTop: -size * 0.24 }} aria-hidden>
      <svg viewBox="0 0 40 22" width={size * 0.62} height={size * 0.34}>
        <rect x="0" y="0" width="40" height="4" rx="1" fill="#b91c1c" />
        <rect x="2" y="6" width="36" height="2.6" rx="1" fill="#7f1d1d" />
        <rect x="6" y="2" width="3.4" height="20" fill="#b91c1c" />
        <rect x="30.6" y="2" width="3.4" height="20" fill="#b91c1c" />
      </svg>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Bespoke per-item scenes — grouped by theme family for readability, one
 * export per XP_SHOP_ITEMS entry.
 * ---------------------------------------------------------------------- */

// --- dawn ------------------------------------------------------------------

/** Daily Spark (Common) — a small sun rising with rays, a couple of
 * sunlight sparkles drifting past. */
export function DailySparkFrame({ size, rarity }: { size: number; rarity: ShopItemRarity }) {
  const { glow } = rarityScale(rarity);
  return (
    <FrameShell size={size} ring="linear-gradient(145deg, #fde68a, #f59e0b)" glow={`${glow}px`}>
      <div className="float-y absolute bottom-0 left-1/2 -translate-x-1/2" style={{ marginBottom: -size * 0.16 }} aria-hidden>
        <svg viewBox="0 0 32 20" width={size * 0.5} height={size * 0.32}>
          <circle cx="16" cy="18" r="9" fill="url(#sun-grad)" />
          <g stroke="#fb923c" strokeWidth="1.6" strokeLinecap="round">
            <path d="M16 2v4M4 10h4M28 10h-4M7 3l3 3M25 3l-3 3" />
          </g>
          <defs>
            <linearGradient id="sun-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <Sparkle left="10%" top="20%" size={8} delay="0s" />
      <Sparkle left="84%" top="30%" size={6} delay="0.6s" />
      <Sparkle left="50%" top="4%" size={5} delay="1.1s" hue="#fed7aa" />
    </FrameShell>
  );
}

/** Morning Dew (Common) — dewdrops resting around the ring, glinting in
 * pale morning light. */
export function MorningDewFrame({ size, rarity }: { size: number; rarity: ShopItemRarity }) {
  const { glow } = rarityScale(rarity);
  return (
    <FrameShell size={size} ring="linear-gradient(145deg, #f0f9ff, #7dd3fc)" glow={`${glow}px`}>
      <Dewdrop angleDeg={-40} size={size * 0.28} delay="0s" />
      <Dewdrop angleDeg={30} size={size * 0.24} delay="0.8s" />
      <Dewdrop angleDeg={160} size={size * 0.2} delay="1.5s" />
      <Dewdrop angleDeg={-150} size={size * 0.18} delay="2.2s" />
      <Sparkle left="72%" top="10%" size={6} delay="0.4s" hue="#e0f2fe" />
    </FrameShell>
  );
}

// --- verdant -----------------------------------------------------------------

/** Leaf Whisper (Common) — a few light leaves fluttering around the ring. */
export function LeafWhisperFrame({ size, rarity }: { size: number; rarity: ShopItemRarity }) {
  const { glow } = rarityScale(rarity);
  const fall = size * 0.5;
  return (
    <FrameShell size={size} ring="linear-gradient(145deg, #bbf7d0, #4ade80)" glow={`${glow}px`}>
      <StaticMapleLeaf angleDeg={-45} size={size * 0.28} />
      <StaticMapleLeaf angleDeg={130} size={size * 0.22} hue="#4ade80" />
      <MapleLeaf left="14%" size={size * 0.2} delay="0.4s" duration="4.8s" fallDistance={fall} />
      <MapleLeaf left="76%" size={size * 0.18} delay="2s" duration="5.2s" fallDistance={fall} />
    </FrameShell>
  );
}

/** Verdant Blade (Epic) — a moss-veined blade crossing the frame, leaves
 * drifting around it. */
export function VerdantBladeFrame({ size, rarity }: { size: number; rarity: ShopItemRarity }) {
  const { extra, glow } = rarityScale(rarity);
  const fall = size * 0.5;
  return (
    <FrameShell size={size} ring="linear-gradient(145deg, #86efac, #14532d)" glow={`${glow}px`}>
      <Blade size={size} />
      <StaticMapleLeaf angleDeg={70} size={size * 0.24} hue="#166534" />
      <MapleLeaf left="10%" size={size * 0.16} delay="1s" duration="5s" fallDistance={fall} />
      {extra && <MapleLeaf left="80%" size={size * 0.14} delay="2.6s" duration="4.6s" fallDistance={fall} />}
    </FrameShell>
  );
}

// --- aqua ------------------------------------------------------------------

/** Ocean Ring (Rare) — rolling wave crests along the frame's lower edge,
 * bubbles rising and fading past the top. */
export function OceanRingFrame({ size, rarity }: { size: number; rarity: ShopItemRarity }) {
  const { extra, glow } = rarityScale(rarity);
  return (
    <FrameShell size={size} ring="linear-gradient(145deg, #7dd3fc, #0369a1)" glow={`${glow}px`}>
      <Wave left="2%" bottom="-8%" hue="#0ea5e9" delay="0s" duration="2.2s" />
      <Wave left="34%" bottom="-14%" hue="#38bdf8" delay="0.5s" duration="2.6s" />
      <Wave left="64%" bottom="-7%" hue="#0284c7" delay="1s" duration="2.4s" />
      <Bubble left="12%" top="14%" size={5} hue="#bae6fd" delay="0s" />
      <Bubble left="82%" top="22%" size={4} hue="#7dd3fc" delay="0.9s" />
      {extra && <Bubble left="48%" top="4%" size={4.5} hue="#e0f2fe" delay="1.6s" />}
    </FrameShell>
  );
}

/** Riptide Ring (Epic) — a whirlpool churning around the whole frame,
 * waves cresting at its base. */
export function RiptideRingFrame({ size, rarity }: { size: number; rarity: ShopItemRarity }) {
  const { glow } = rarityScale(rarity);
  return (
    <FrameShell size={size} ring="linear-gradient(145deg, #22d3ee, #0e7490)" glow={`${glow}px`}>
      <Whirlpool size={size} />
      <Wave left="10%" bottom="-10%" hue="#06b6d4" delay="0.2s" duration="2s" />
      <Wave left="58%" bottom="-12%" hue="#0891b2" delay="0.8s" duration="2.3s" />
      <Bubble left="78%" top="18%" size={4} hue="#a5f3fc" delay="0.5s" />
    </FrameShell>
  );
}

// --- storm -------------------------------------------------------------------

/** Storm Sail (Rare) — a sailboat cresting rough seas, storm clouds
 * drifting past overhead, lightning striking near the ring's edge. */
export function StormSailFrame({ size, rarity }: { size: number; rarity: ShopItemRarity }) {
  const { extra, glow } = rarityScale(rarity);
  return (
    <FrameShell size={size} ring="linear-gradient(145deg, #cbd5e1, #334155)" glow={`${glow}px`}>
      <Cloud left="4%" top="-14%" scale={size / 92} delay="0s" />
      <Cloud left="54%" top="-10%" scale={(size / 92) * 0.75} delay="1.4s" />
      <Bolt left="66%" top="4%" size={size * 0.22} delay="0.8s" />
      <SailBoat left="30%" bottom="-14%" size={size * 0.4} />
      {extra && <Bolt left="16%" top="8%" size={size * 0.18} delay="1.6s" />}
    </FrameShell>
  );
}

// --- ember -------------------------------------------------------------------

/** Spark Trail (Rare) — small comet sparks streaking outward, embers
 * trailing behind every correct answer. */
export function SparkTrailFrame({ size, rarity }: { size: number; rarity: ShopItemRarity }) {
  const { extra, glow } = rarityScale(rarity);
  return (
    <FrameShell size={size} ring="linear-gradient(145deg, #fde047, #ea580c)" glow={`${glow}px`}>
      <CometTrail angleDeg={-30} size={size * 0.46} hue="#fb923c" delay="0s" duration="1.8s" />
      <CometTrail angleDeg={60} size={size * 0.4} hue="#fde047" delay="0.6s" duration="2s" />
      <CometTrail angleDeg={150} size={size * 0.36} hue="#f97316" delay="1.1s" duration="1.9s" />
      <CometTrail angleDeg={-120} size={size * 0.32} hue="#fdba74" delay="1.6s" duration="2.1s" />
      <Sparkle left="14%" top="70%" size={6} delay="0.3s" hue="#fdba74" />
      <Sparkle left="80%" top="66%" size={5} delay="1.3s" hue="#fde047" />
      {extra && <Sparkle left="50%" top="4%" size={5} delay="2s" hue="#fb923c" />}
    </FrameShell>
  );
}

/** Ember Crown (Epic) — flames flickering at the base, a small crest of
 * fire crowning the top. */
export function EmberCrownFrame({ size, rarity }: { size: number; rarity: ShopItemRarity }) {
  const { extra, glow } = rarityScale(rarity);
  return (
    <FrameShell size={size} ring="linear-gradient(145deg, #fbbf24, #7c2d12)" glow={`${glow}px`}>
      <Flame left="26%" bottom="-9%" height={size * 0.24} delay="0s" />
      <Flame left="46%" bottom="-13%" height={size * 0.3} delay="0.2s" />
      <Flame left="64%" bottom="-8%" height={size * 0.2} delay="0.4s" />
      <Flame left="44%" bottom="72%" height={size * 0.16} delay="0.3s" />
      {extra && <Bubble left="66%" top="-2%" size={3.5} hue="#fed7aa" delay="1s" />}
    </FrameShell>
  );
}

/** Phoenix Ember (Legendary) — a phoenix rising above the flames, ash
 * reborn as sacred fire. */
export function PhoenixEmberFrame({ size, rarity }: { size: number; rarity: ShopItemRarity }) {
  const { extra, glow } = rarityScale(rarity);
  return (
    <FrameShell size={size} ring="linear-gradient(145deg, #fef08a, #b91c1c)" glow={`${glow}px`}>
      <PhoenixBird size={size} />
      <Flame left="20%" bottom="-9%" height={size * 0.22} delay="0s" />
      <Flame left="62%" bottom="-11%" height={size * 0.26} delay="0.3s" />
      <Bubble left="40%" top="4%" size={4} hue="#fdba74" delay="0.5s" />
      {extra && <Bubble left="74%" top="14%" size={3.5} hue="#fde68a" delay="1.2s" />}
    </FrameShell>
  );
}

// --- frost -------------------------------------------------------------------

/** Frost Halo (Epic) — falling snowflakes drift past the ring, ice spikes
 * jut fixed at its edge. */
export function FrostHaloFrame({ size, rarity }: { size: number; rarity: ShopItemRarity }) {
  const { extra, glow } = rarityScale(rarity);
  const fall = size * 0.58;
  return (
    <FrameShell size={size} ring="linear-gradient(145deg, #e0f2fe, #0284c7)" glow={`${glow}px`}>
      <IceSpike angleDeg={-30} size={size * 0.3} />
      <IceSpike angleDeg={35} size={size * 0.26} />
      <Snowflake left="10%" size={size * 0.16} delay="0.2s" duration="4.6s" fallDistance={fall} />
      <Snowflake left="78%" size={size * 0.14} delay="1.6s" duration="5s" fallDistance={fall} />
      {extra && <Snowflake left="48%" size={size * 0.12} delay="2.8s" duration="4.8s" fallDistance={fall} />}
    </FrameShell>
  );
}

/** Glacier Crown (Legendary) — an ice crown atop the ring, heavier
 * snowfall and taller spikes than Frost Halo. */
export function GlacierCrownFrame({ size, rarity }: { size: number; rarity: ShopItemRarity }) {
  const { extra, glow } = rarityScale(rarity);
  const fall = size * 0.6;
  return (
    <FrameShell size={size} ring="linear-gradient(145deg, #f0f9ff, #075985)" glow={`${glow}px`}>
      <IceCrown size={size} />
      <IceSpike angleDeg={140} size={size * 0.26} />
      <IceSpike angleDeg={-140} size={size * 0.24} />
      <Snowflake left="8%" size={size * 0.15} delay="0.2s" duration="4.4s" fallDistance={fall} />
      <Snowflake left="82%" size={size * 0.13} delay="1.2s" duration="4.8s" fallDistance={fall} />
      {extra && <Snowflake left="46%" size={size * 0.11} delay="2.4s" duration="5s" fallDistance={fall} />}
    </FrameShell>
  );
}

// --- bloom -------------------------------------------------------------------

/** Sakura Shrine (Epic) — a torii gate framing the ring, cherry-blossom
 * petals drifting past. */
export function SakuraShrineFrame({ size, rarity }: { size: number; rarity: ShopItemRarity }) {
  const { extra, glow } = rarityScale(rarity);
  const fall = size * 0.55;
  return (
    <FrameShell size={size} ring="linear-gradient(145deg, #fbcfe8, #db2777)" glow={`${glow}px`}>
      <ToriiGate size={size} />
      <Petal left="6%" size={9} hue="#f9a8d4" delay="0.4s" duration="4.4s" fallDistance={fall} />
      <Petal left="78%" size={8} hue="#fbcfe8" delay="1.3s" duration="4.8s" fallDistance={fall} />
      {extra && <Petal left="44%" size={7} hue="#f472b6" delay="2.4s" duration="4.6s" fallDistance={fall} />}
    </FrameShell>
  );
}

/** Eternal Bloom (Mythic) — a flower that never wilts, glowing brighter
 * with each breath, petals endlessly drifting. */
export function EternalBloomFrame({ size, rarity }: { size: number; rarity: ShopItemRarity }) {
  const { extra, glow } = rarityScale(rarity);
  const fall = size * 0.6;
  return (
    <FrameShell size={size} ring="linear-gradient(145deg, #fecdd3, #be185d)" glow={`${glow}px`}>
      <BloomFlower size={size} />
      <Petal left="4%" size={11} hue="#fda4af" delay="0s" duration="4.6s" fallDistance={fall} />
      <Petal left="30%" size={9} hue="#fecdd3" delay="1s" duration="5s" fallDistance={fall} />
      <Petal left="60%" size={10} hue="#fb7185" delay="1.8s" duration="4.8s" fallDistance={fall} />
      <Petal left="84%" size={8} hue="#fecdd3" delay="0.6s" duration="5.2s" fallDistance={fall} />
      {extra && <Sparkle left="50%" top="4%" size={6} delay="1.4s" hue="#fde68a" />}
    </FrameShell>
  );
}

// --- shadow ------------------------------------------------------------------

/** Shadow Horns (Epic) — twin horns crowning the ring, crystal shards
 * floating around it, dark haze curling below. */
export function ShadowHornsFrame({ size, rarity }: { size: number; rarity: ShopItemRarity }) {
  const { extra, glow } = rarityScale(rarity);
  return (
    <FrameShell size={size} ring="linear-gradient(145deg, #a78bfa, #1e1b3a)" glow={`${glow}px`}>
      <Horn angleDeg={-24} size={size * 0.3} hue="#c4b5fd" />
      <Horn angleDeg={24} size={size * 0.3} hue="#a78bfa" />
      <FloatingCrystal left="8%" top="30%" size={size * 0.16} hue="#c4b5fd" delay="0s" />
      <FloatingCrystal left="80%" top="46%" size={size * 0.14} hue="#8b5cf6" delay="0.9s" />
      {extra && <Wisp left="34%" top="70%" size={size * 0.24} hue="#5b21b6" delay="0.4s" duration="4s" />}
    </FrameShell>
  );
}

/** Devil Headset (Legendary) — a gaming headset with devil horns and a
 * curling tail, rebellious red-on-black. */
export function DevilHeadsetFrame({ size, rarity }: { size: number; rarity: ShopItemRarity }) {
  const { extra, glow } = rarityScale(rarity);
  return (
    <FrameShell size={size} ring="linear-gradient(145deg, #ef4444, #1e1b3a)" glow={`${glow}px`}>
      <HeadsetBand size={size} />
      <Horn angleDeg={-20} size={size * 0.22} hue="#ef4444" />
      <Horn angleDeg={20} size={size * 0.22} hue="#dc2626" />
      <DevilTail left="70%" bottom="-6%" size={size * 0.34} />
      {extra && <Bubble left="14%" top="66%" size={3.5} hue="#fca5a5" delay="0.6s" />}
    </FrameShell>
  );
}

/** Voidwalker (Legendary) — a dark portal collapsing at the ring's
 * center, haze curling off into nothing. */
export function VoidwalkerFrame({ size, rarity }: { size: number; rarity: ShopItemRarity }) {
  const { extra, glow } = rarityScale(rarity);
  return (
    <FrameShell size={size} ring="linear-gradient(145deg, #7c3aed, #0a0a0f)" glow={`${glow}px`}>
      <VoidPortal size={size} />
      <Wisp left="6%" top="8%" size={size * 0.3} hue="#5b21b6" delay="0s" duration="4s" />
      <Wisp left="66%" top="60%" size={size * 0.26} hue="#7c3aed" delay="1.4s" duration="3.6s" />
      {extra && <Sparkle left="80%" top="16%" size={5} delay="0.8s" hue="#c4b5fd" />}
    </FrameShell>
  );
}

// --- thunder -----------------------------------------------------------------

/** Thunder Crest (Legendary) — a black-and-gold armor crest crowning the
 * ring, purple lightning striking around it. */
export function ThunderCrestFrame({ size, rarity }: { size: number; rarity: ShopItemRarity }) {
  const { extra, glow } = rarityScale(rarity);
  return (
    <FrameShell size={size} ring="linear-gradient(145deg, #eab308, #1e1b3a)" glow={`${glow}px`}>
      <Crest size={size} />
      <Bolt left="10%" top="20%" size={size * 0.26} delay="0s" hue="#c4b5fd" />
      <Bolt left="70%" top="56%" size={size * 0.22} delay="1.1s" hue="#a78bfa" />
      {extra && <Bolt left="72%" top="8%" size={size * 0.18} delay="1.8s" hue="#facc15" />}
    </FrameShell>
  );
}

// --- arcane ------------------------------------------------------------------

/** Emerald Wand Aura (Legendary) — an ancient wand fixed at the ring's
 * edge, gem tip glinting, emerald smoke curling off it. */
export function EmeraldWandAuraFrame({ size, rarity }: { size: number; rarity: ShopItemRarity }) {
  const { extra, glow } = rarityScale(rarity);
  return (
    <FrameShell size={size} ring="linear-gradient(145deg, #5eead4, #065f46)" glow={`${glow}px`}>
      <MagicWand left="72%" top="4%" size={size * 0.6} rotate={22} />
      <Wisp left="8%" top="8%" size={size * 0.3} hue="#2dd4bf" delay="0s" duration="4s" />
      <Sparkle left="18%" top="70%" size={7} delay="0.6s" hue="#99f6e4" />
      {extra && <Sparkle left="62%" top="80%" size={6} delay="1.5s" hue="#2dd4bf" />}
    </FrameShell>
  );
}

// --- elemental ---------------------------------------------------------------

/** Elemental Clash (Legendary) — a ring split between fire and ice,
 * clashing at the seam. */
export function ElementalClashFrame({ size, rarity }: { size: number; rarity: ShopItemRarity }) {
  const { extra, glow } = rarityScale(rarity);
  return (
    <FrameShell size={size} ring="linear-gradient(90deg, #38bdf8 48%, #f97316 52%)" glow={`${glow}px`}>
      <Flame left="58%" bottom="-8%" height={size * 0.24} delay="0s" />
      <Flame left="74%" bottom="-12%" height={size * 0.19} delay="0.3s" />
      <IceSpike angleDeg={-160} size={size * 0.28} />
      <IceSpike angleDeg={160} size={size * 0.24} />
      <Sparkle left="46%" top="-6%" size={8} delay="0.2s" hue="#e2e8f0" />
      <Sparkle left="46%" top="96%" size={6} delay="1.1s" hue="#fed7aa" />
      {extra && <Bubble left="20%" top="10%" size={4} hue="#7dd3fc" delay="0.5s" />}
    </FrameShell>
  );
}

// --- cosmic ------------------------------------------------------------------

/** Moonlit Path (Rare) — a crescent moon overhead, a path of glowing
 * stepping stones arcing along the ring. */
export function MoonlitPathFrame({ size, rarity }: { size: number; rarity: ShopItemRarity }) {
  const { extra, glow } = rarityScale(rarity);
  const r = size / 2 + 4;
  return (
    <FrameShell size={size} ring="linear-gradient(145deg, #c7d2fe, #4338ca)" glow={`${glow}px`}>
      <div className="float-y absolute top-0 left-1/2 -translate-x-1/2" style={{ marginTop: -size * 0.28 }} aria-hidden>
        <svg viewBox="0 0 20 20" width={size * 0.28} height={size * 0.28}>
          <path d="M13 2a8 8 0 1 0 5 14 6.5 6.5 0 0 1-5-14Z" fill="#c7d2fe" />
        </svg>
      </div>
      <PathDot angleDeg={140} radius={r} size={4} delay="0s" />
      <PathDot angleDeg={160} radius={r} size={5} delay="0.3s" />
      <PathDot angleDeg={180} radius={r} size={4.5} delay="0.6s" />
      <PathDot angleDeg={200} radius={r} size={5} delay="0.9s" />
      <PathDot angleDeg={220} radius={r} size={4} delay="1.2s" />
      {extra && <Sparkle left="76%" top="18%" size={6} delay="0.5s" hue="#e0e7ff" />}
    </FrameShell>
  );
}

/** Aurora Genesis (Mythic) — ribbons of aurora sweeping across the frame,
 * stardust twinkling beneath. */
export function AuroraGenesisFrame({ size, rarity }: { size: number; rarity: ShopItemRarity }) {
  const { extra, glow } = rarityScale(rarity);
  return (
    <FrameShell size={size} ring="linear-gradient(145deg, #a7f3d0, #a78bfa)" glow={`${glow}px`}>
      <AuroraRibbon top="6%" hue="#5eead4" delay="0s" duration="4.2s" />
      <AuroraRibbon top="16%" hue="#c084fc" delay="0.8s" duration="5s" />
      <Sparkle left="10%" top="72%" size={6} delay="0.4s" hue="#a7f3d0" />
      <Sparkle left="80%" top="76%" size={5} delay="1.2s" hue="#e9d5ff" />
      {extra && <Sparkle left="46%" top="86%" size={5} delay="2s" hue="#5eead4" />}
    </FrameShell>
  );
}

/** Starforged Halo (Mythic) — a ring of stars orbiting the frame, a
 * meteor streaking through every few seconds. */
export function StarforgedHaloFrame({ size, rarity }: { size: number; rarity: ShopItemRarity }) {
  const { extra, glow } = rarityScale(rarity);
  const r = size / 2 + 6;
  const count = extra ? 8 : 6;
  const stars = Array.from({ length: count }, (_, i) => (360 / count) * i);
  return (
    <FrameShell size={size} ring="linear-gradient(145deg, #f0abfc, #4c1d95)" glow={`${glow}px`}>
      {stars.map((angle, i) => (
        <OrbitStar key={angle} angleDeg={angle} radius={r} size={size * 0.12} delay={`${i * 0.15}s`} />
      ))}
      <MeteorStreak delay="0s" />
      <MeteorStreak delay="1.7s" />
    </FrameShell>
  );
}

// --- royal, tropical, bamboo (one item each) ----------------------------------

/** Royal Ascension (Legendary) — a gold ring shimmering, a crown hovering
 * above, jewels glinting around it. */
export function RoyalAscensionFrame({ size, rarity }: { size: number; rarity: ShopItemRarity }) {
  const { extra, glow } = rarityScale(rarity);
  return (
    <FrameShell size={size} ring="linear-gradient(145deg, #fde68a, #b45309)" glow={`${glow}px`}>
      <div
        className="shimmer-sweep pointer-events-none absolute inset-0 rounded-full p-[3px] mix-blend-screen"
        style={{ background: "linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.9) 50%, transparent 65%)" }}
        aria-hidden
      >
        <div className="size-full rounded-full" />
      </div>
      <Crown size={size} />
      <Sparkle left="8%" top="30%" size={7} delay="0.3s" />
      <Sparkle left="84%" top="42%" size={6} delay="1s" />
      {extra && <Sparkle left="46%" top="86%" size={5} delay="1.7s" />}
    </FrameShell>
  );
}

/** Coconut Breeze (Epic) — palm fronds swaying in a tropical breeze,
 * coconuts tucked at their base. */
export function CoconutBreezeFrame({ size, rarity }: { size: number; rarity: ShopItemRarity }) {
  const { extra, glow } = rarityScale(rarity);
  const count = extra ? 7 : 5;
  const fronds = Array.from({ length: count }, (_, i) => (360 / count) * i);
  return (
    <FrameShell size={size} ring="linear-gradient(145deg, #86efac, #78350f)" glow={`${glow}px`}>
      {fronds.map((angle, i) => (
        <Frond key={angle} angleDeg={angle} size={size * 0.5} delay={`${i * 0.18}s`} hasNut={i % 3 === 0} />
      ))}
    </FrameShell>
  );
}

/** Bamboo Serenity (Rare) — bamboo leaves fixed near the ring swaying
 * gently, more drifting past, the whole frame breathing with a subtle
 * pulse. */
export function BambooSerenityFrame({ size, rarity }: { size: number; rarity: ShopItemRarity }) {
  const { extra, glow } = rarityScale(rarity);
  const fall = size * 0.55;
  return (
    <FrameShell size={size} ring="linear-gradient(145deg, #d9f99d, #4d7c0f)" glow={`${glow}px`} className="ring-bounce">
      <StaticLeaf angleDeg={-35} size={size * 0.38} />
      <StaticLeaf angleDeg={40} size={size * 0.33} />
      <BambooLeaf left="10%" size={size * 0.26} delay="0.3s" duration="4.6s" fallDistance={fall} />
      <BambooLeaf left="74%" size={size * 0.23} delay="1.8s" duration="5.2s" fallDistance={fall} />
      {extra && <BambooLeaf left="44%" size={size * 0.2} delay="3s" duration="4.8s" fallDistance={fall} />}
    </FrameShell>
  );
}
