import { cn } from "@/lib/utils";

export function ScoreRing({
  score,
  target,
  max = 990,
  size = 148,
  trackColor = "var(--muted)",
  progressColor = "var(--primary)",
  targetColor = "var(--border)",
  textClassName,
  hintClassName = "text-muted-foreground",
}: {
  score: number | null;
  target: number | null;
  max?: number;
  size?: number;
  /** Ring background track. Override for use on colored/gradient surfaces. */
  trackColor?: string;
  /** Filled progress arc. */
  progressColor?: string;
  /** Thin marker ring for the target score. */
  targetColor?: string;
  textClassName?: string;
  hintClassName?: string;
}) {
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = score ? Math.min(1, score / max) : 0;
  const offset = circumference * (1 - progress);
  const targetProgress = target ? Math.min(1, target / max) : null;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={stroke} />
        {targetProgress !== null && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={targetColor}
            strokeWidth={2}
            strokeDasharray={`${circumference * targetProgress} ${circumference}`}
            strokeLinecap="round"
            opacity={0.9}
            transform={`scale(${(radius + 8) / radius})`}
            style={{ transformOrigin: "center" }}
          />
        )}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={progressColor}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-2xl font-semibold tracking-tight", textClassName)}>{score ?? "—"}</span>
        <span className={cn("text-xs", hintClassName)}>/ {max}</span>
      </div>
    </div>
  );
}
