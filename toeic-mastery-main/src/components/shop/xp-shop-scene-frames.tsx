import { cn } from "@/lib/utils";
import type { ShopItemRarity } from "@/lib/constants/xp-shop";
import { RabbitIllustration } from "@/components/mascot/mascot-illustration";

/** Themes with a fully illustrated scene (see xp-shop-item-visual.tsx's
 * dispatcher) — everything else still uses the generic orbiting-glyph
 * wreath. Kept to a curated set rather than one per theme: each of these
 * composes several hand-placed, individually-animated shapes (waves,
 * fronds, falling petals...), which doesn't scale the same way the
 * glyph-wreath's angle math does. */
export type SceneTheme = "aqua" | "ember" | "bloom" | "royal" | "tropical" | "bamboo";

/** Rarity still modulates intensity here, just expressed per-scene (more
 * waves/bubbles, brighter flame glow, etc.) rather than through one shared
 * "particle count" knob like the glyph wreath uses. */
function rarityScale(rarity: ShopItemRarity): { extra: boolean; glow: number } {
  switch (rarity) {
    case "COMMON":
      return { extra: false, glow: 4 };
    case "RARE":
      return { extra: false, glow: 6 };
    case "EPIC":
      return { extra: true, glow: 9 };
    case "LEGENDARY":
      return { extra: true, glow: 13 };
    case "MYTHIC":
      return { extra: true, glow: 18 };
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

function Wave({ left, bottom, hue, delay, duration }: { left: string; bottom: string; hue: string; delay: string; duration: string }) {
  return (
    <svg
      viewBox="0 0 24 10"
      className="wave-bob absolute h-2.5 w-6"
      style={{ left, bottom, color: hue, animationDelay: delay, animationDuration: duration }}
      aria-hidden
    >
      <path d="M0,7 Q3,2 6,7 T12,7 T18,7 T24,7 L24,10 L0,10 Z" fill="currentColor" />
    </svg>
  );
}

function Bubble({ left, top, size, hue, delay }: { left: string; top: string; size: number; hue: string; delay: string }) {
  return (
    <span
      className="rise-fade absolute rounded-full"
      style={{ left, top, width: size, height: size, background: hue, animationDelay: delay }}
      aria-hidden
    />
  );
}

/** Chủ đề 1: Sóng Biển — rolling wave crests along the frame's lower edge,
 * bobbing up and down, with a few bubbles rising and fading past the top. */
export function OceanWavesFrame({ size, rarity }: { size: number; rarity: ShopItemRarity }) {
  const { extra, glow } = rarityScale(rarity);
  return (
    <FrameShell size={size} ring="linear-gradient(145deg, #7dd3fc, #0369a1)" glow={`${glow}px`}>
      <Wave left="6%" bottom="-4%" hue="#0ea5e9" delay="0s" duration="2.2s" />
      <Wave left="38%" bottom="-9%" hue="#38bdf8" delay="0.5s" duration="2.6s" />
      <Wave left="68%" bottom="-3%" hue="#0284c7" delay="1s" duration="2.4s" />
      <Bubble left="14%" top="16%" size={4} hue="#bae6fd" delay="0s" />
      <Bubble left="80%" top="24%" size={3} hue="#7dd3fc" delay="0.9s" />
      {extra && <Bubble left="50%" top="6%" size={3.5} hue="#e0f2fe" delay="1.6s" />}
    </FrameShell>
  );
}

function Flame({ left, bottom, height, delay }: { left: string; bottom: string; height: number; delay: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="flame-flicker absolute origin-bottom"
      style={{ left, bottom, height, width: height * 0.75, animationDelay: delay }}
      aria-hidden
    >
      <path
        d="M12 2c2 4-2 5-2 8a3 3 0 0 0 6 0c0-1-1-2-1-2 2 1 3 3 3 5a6 6 0 1 1-12 0c0-5 4-7 6-11z"
        fill="url(#flame-grad)"
      />
      <defs>
        <linearGradient id="flame-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Chủ đề "Lửa Trại" — a few small flames flickering at the frame's base,
 * embers rising and fading above them. */
export function CampfireFrame({ size, rarity }: { size: number; rarity: ShopItemRarity }) {
  const { extra, glow } = rarityScale(rarity);
  return (
    <FrameShell size={size} ring="linear-gradient(145deg, #fbbf24, #b91c1c)" glow={`${glow}px`}>
      <Flame left="30%" bottom="-6%" height={16} delay="0s" />
      <Flame left="48%" bottom="-9%" height={20} delay="0.2s" />
      <Flame left="64%" bottom="-5%" height={14} delay="0.4s" />
      <Bubble left="45%" top="8%" size={3} hue="#fdba74" delay="0.3s" />
      {extra && <Bubble left="62%" top="0%" size={2.5} hue="#fed7aa" delay="1s" />}
    </FrameShell>
  );
}

function Petal({ left, size, hue, delay, duration, fallDistance }: { left: string; size: number; hue: string; delay: string; duration: string; fallDistance: number }) {
  return (
    <svg
      viewBox="0 0 12 14"
      className="fall-drift absolute top-1/2"
      style={
        {
          left,
          width: size,
          height: size * 1.15,
          marginTop: -size * 0.6,
          animationDelay: delay,
          animationDuration: duration,
          "--fall-distance": `${fallDistance}px`,
        } as React.CSSProperties
      }
      aria-hidden
    >
      <path d="M6 0C9 2 12 5 6 14C0 5 3 2 6 0Z" fill={hue} />
    </svg>
  );
}

/** Chủ đề "Vườn Hoa Anh Đào" — cherry-blossom petals drifting down past the
 * frame, swaying side to side and fading in/out as they loop. */
export function SakuraGardenFrame({ size, rarity }: { size: number; rarity: ShopItemRarity }) {
  const { extra, glow } = rarityScale(rarity);
  const fall = size * 0.55;
  return (
    <FrameShell size={size} ring="linear-gradient(145deg, #fbcfe8, #db2777)" glow={`${glow}px`}>
      <Petal left="8%" size={9} hue="#f9a8d4" delay="0s" duration="4.2s" fallDistance={fall} />
      <Petal left="30%" size={7} hue="#fbcfe8" delay="1.1s" duration="4.8s" fallDistance={fall} />
      <Petal left="58%" size={8} hue="#f472b6" delay="2s" duration="4.4s" fallDistance={fall} />
      <Petal left="82%" size={7} hue="#fbcfe8" delay="0.6s" duration="5s" fallDistance={fall} />
      {extra && <Petal left="46%" size={6} hue="#f9a8d4" delay="2.7s" duration="4.6s" fallDistance={fall} />}
    </FrameShell>
  );
}

function BambooLeaf({ left, size, delay, duration, fallDistance }: { left: string; size: number; delay: string; duration: string; fallDistance: number }) {
  return (
    <svg
      viewBox="0 0 16 8"
      className="fall-drift absolute top-1/2"
      style={
        {
          left,
          width: size,
          height: size * 0.5,
          marginTop: -size * 0.25,
          animationDelay: delay,
          animationDuration: duration,
          "--fall-distance": `${fallDistance}px`,
        } as React.CSSProperties
      }
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

/** Chủ đề "Kiếm khách/Thiền" — a couple of bamboo leaves fixed near the ring
 * swaying gently, a few more drifting/falling past it, and the whole frame
 * breathing with a very subtle scale pulse. */
export function ZenBambooFrame({ size, rarity }: { size: number; rarity: ShopItemRarity }) {
  const { extra, glow } = rarityScale(rarity);
  const fall = size * 0.5;
  return (
    <FrameShell size={size} ring="linear-gradient(145deg, #d9f99d, #4d7c0f)" glow={`${glow}px`} className="ring-bounce">
      <StaticLeaf angleDeg={-35} size={size * 0.32} />
      <StaticLeaf angleDeg={40} size={size * 0.28} />
      <BambooLeaf left="14%" size={size * 0.22} delay="0.3s" duration="4.6s" fallDistance={fall} />
      <BambooLeaf left="70%" size={size * 0.2} delay="1.8s" duration="5.2s" fallDistance={fall} />
      {extra && <BambooLeaf left="46%" size={size * 0.18} delay="3s" duration="4.8s" fallDistance={fall} />}
    </FrameShell>
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

/** Chủ đề 2: Nhiệt đới — palm fronds radiating out around the frame, each
 * swaying from its base like a breeze passing through, with a couple of
 * coconuts tucked at the base of a few fronds. */
export function TropicalCoconutFrame({ size, rarity }: { size: number; rarity: ShopItemRarity }) {
  const { extra } = rarityScale(rarity);
  const count = extra ? 7 : 5;
  const fronds = Array.from({ length: count }, (_, i) => (360 / count) * i);
  return (
    <FrameShell size={size} ring="linear-gradient(145deg, #86efac, #78350f)" glow={`${rarityScale(rarity).glow}px`}>
      {fronds.map((angle, i) => (
        <Frond key={angle} angleDeg={angle} size={size * 0.42} delay={`${i * 0.18}s`} hasNut={i % 3 === 0} />
      ))}
    </FrameShell>
  );
}

function Crown({ size }: { size: number }) {
  return (
    <div className="float-y absolute top-0 left-1/2 -translate-x-1/2" style={{ marginTop: -size * 0.42 }} aria-hidden>
      <svg viewBox="0 0 24 18" width={size * 0.62} height={size * 0.46}>
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

/** Chủ đề 3: Hoàng Gia — a gold ring with a shimmer sweeping across it, a
 * crown hovering above the frame. */
export function RoyalCrownFrame({ size, rarity }: { size: number; rarity: ShopItemRarity }) {
  const { glow } = rarityScale(rarity);
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
    </FrameShell>
  );
}
