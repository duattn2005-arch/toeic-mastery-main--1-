import type { MascotState } from "@/components/mascot/types";

/**
 * Original geometric bust illustrations (circles + a handful of paths, soft
 * radial shading, sparkle-highlight eyes) — not photoreal character art, so
 * they stay crisp at small sizes and read as "brand mascot" rather than
 * clipart. Expression is carried by the eyes/mouth paths, swapped per state,
 * so each character only needs one base illustration.
 */

function Eyes({ state }: { state: MascotState }) {
  const happy = state === "success" || state === "encouraging";
  if (happy) {
    return (
      <g stroke="#2b2320" strokeWidth="2.8" strokeLinecap="round" fill="none">
        <path d="M39 50 Q44 43.5 49 50" />
        <path d="M63 50 Q68 43.5 73 50" />
      </g>
    );
  }
  const worried = state === "reminder";
  const dy = worried ? -1.5 : 0;
  return (
    <g>
      <circle cx="44" cy={49 + dy} r="4.2" fill="#2b2320" />
      <circle cx="68" cy={49 + dy} r="4.2" fill="#2b2320" />
      {/* sparkle highlights */}
      <circle cx="45.6" cy={47.2 + dy} r="1.3" fill="#fff" />
      <circle cx="69.6" cy={47.2 + dy} r="1.3" fill="#fff" />
    </g>
  );
}

function Mouth({ state }: { state: MascotState }) {
  if (state === "success") return <path d="M48 62 Q56 70 64 62" stroke="#2b2320" strokeWidth="2.6" strokeLinecap="round" fill="none" />;
  if (state === "encouraging") return <path d="M49 62 Q56 68 63 62" stroke="#2b2320" strokeWidth="2.4" strokeLinecap="round" fill="none" />;
  if (state === "reminder") return <path d="M50 64 Q56 61 62 64" stroke="#2b2320" strokeWidth="2.2" strokeLinecap="round" fill="none" />;
  return <path d="M50 63 Q56 66 62 63" stroke="#2b2320" strokeWidth="2.2" strokeLinecap="round" fill="none" />;
}

export function RabbitIllustration({ state, className }: { state: MascotState; className?: string }) {
  const tilt = state === "studying" ? -4 : 0;
  return (
    <svg viewBox="0 0 112 112" className={className} role="img" aria-label="Mascot thỏ">
      <defs>
        <radialGradient id="rabbit-head" cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#FFFDF8" />
          <stop offset="100%" stopColor="#F6E9D3" />
        </radialGradient>
        <radialGradient id="rabbit-ear" cx="35%" cy="15%" r="90%">
          <stop offset="0%" stopColor="#FFFDF8" />
          <stop offset="100%" stopColor="#EFDCB8" />
        </radialGradient>
        <linearGradient id="rabbit-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FCF2E1" />
          <stop offset="100%" stopColor="#F1DBB4" />
        </linearGradient>
      </defs>
      <g style={{ transform: `rotate(${tilt}deg)`, transformOrigin: "56px 70px" }}>
        {/* ears */}
        <path d="M38 8 C30 22 32 44 42 54 C46 48 46 34 44 20 C43 13 41 9 38 8Z" fill="url(#rabbit-ear)" stroke="#E4CBA6" strokeWidth="1.5" />
        <path d="M74 8 C82 22 80 44 70 54 C66 48 66 34 68 20 C69 13 71 9 74 8Z" fill="url(#rabbit-ear)" stroke="#E4CBA6" strokeWidth="1.5" />
        <path d="M40 16 C36 26 37 40 43 48 C45 42 45 30 43.5 21 C43 18.5 41.5 17 40 16Z" fill="#F3B8C6" />
        <path d="M72 16 C76 26 75 40 69 48 C67 42 67 30 68.5 21 C69 18.5 70.5 17 72 16Z" fill="#F3B8C6" />

        {/* body / shoulders */}
        <path d="M16 112 C16 88 33 74 56 74 C79 74 96 88 96 112Z" fill="url(#rabbit-body)" stroke="#E4CBA6" strokeWidth="1.5" />

        {/* head */}
        <circle cx="56" cy="54" r="30" fill="url(#rabbit-head)" stroke="#E4CBA6" strokeWidth="1.5" />

        {/* cheeks */}
        <circle cx="38" cy="58" r="6" fill="#F7D3DB" opacity="0.75" />
        <circle cx="74" cy="58" r="6" fill="#F7D3DB" opacity="0.75" />

        <Eyes state={state} />
        {/* nose */}
        <path d="M53.5 55.5 Q56 58 58.5 55.5 Q56 53 53.5 55.5Z" fill="#E48CA0" />
        <Mouth state={state} />
      </g>
    </svg>
  );
}

export function FoxIllustration({ state, className }: { state: MascotState; className?: string }) {
  const tilt = state === "studying" ? -4 : 0;
  return (
    <svg viewBox="0 0 112 112" className={className} role="img" aria-label="Mascot cáo">
      <defs>
        <radialGradient id="fox-head" cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#F6BE84" />
          <stop offset="100%" stopColor="#DE9750" />
        </radialGradient>
        <radialGradient id="fox-ear" cx="35%" cy="15%" r="90%">
          <stop offset="0%" stopColor="#F0AE68" />
          <stop offset="100%" stopColor="#D68B45" />
        </radialGradient>
        <linearGradient id="fox-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F0AE68" />
          <stop offset="100%" stopColor="#DE9750" />
        </linearGradient>
      </defs>
      <g style={{ transform: `rotate(${tilt}deg)`, transformOrigin: "56px 70px" }}>
        {/* ears */}
        <path d="M28 10 L46 40 L22 38Z" fill="url(#fox-ear)" stroke="#C97F3B" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M84 10 L66 40 L90 38Z" fill="url(#fox-ear)" stroke="#C97F3B" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M30 18 L42 38 L27 36Z" fill="#3A2A22" />
        <path d="M82 18 L70 38 L85 36Z" fill="#3A2A22" />

        {/* body / shoulders */}
        <path d="M16 112 C16 88 33 74 56 74 C79 74 96 88 96 112Z" fill="url(#fox-body)" stroke="#C97F3B" strokeWidth="1.5" />
        <path d="M40 112 C40 98 47 90 56 90 C65 90 72 98 72 112Z" fill="#FBF3E7" />

        {/* head */}
        <circle cx="56" cy="54" r="30" fill="url(#fox-head)" stroke="#C97F3B" strokeWidth="1.5" />
        {/* muzzle patch */}
        <path d="M40 56 C40 68 47 74 56 74 C65 74 72 68 72 56 C72 66 65 70 56 70 C47 70 40 66 40 56Z" fill="#FBF3E7" />

        <Eyes state={state} />
        {/* nose */}
        <path d="M52.5 60 Q56 64 59.5 60 Q56 57.5 52.5 60Z" fill="#2b2320" />
        <Mouth state={state} />
      </g>
    </svg>
  );
}
