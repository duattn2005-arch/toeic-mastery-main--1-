"use client";

import * as React from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { CheckCircle2, Clock, MinusCircle, XCircle } from "lucide-react";

function AnimatedNumber({ value }: { value: number }) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => Math.round(v));
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    const controls = animate(motionValue, value, { duration: 1.1, ease: "easeOut" });
    const unsubscribe = rounded.on("change", setDisplay);
    return () => {
      controls.stop();
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <>{display}</>;
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m} phút ${s} giây`;
}

export function ScoreResultHeader({
  isEstimated,
  totalScore,
  listeningScore,
  readingScore,
  correctCount,
  wrongCount,
  skippedCount,
  accuracy,
  timeUsedSec,
}: {
  isEstimated: boolean;
  totalScore: number | null;
  listeningScore: number | null;
  readingScore: number | null;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  accuracy: number;
  timeUsedSec: number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        {totalScore !== null ? (
          <>
            <p className="text-xs font-medium text-muted-foreground">{isEstimated ? "Điểm ước tính" : "Điểm số"}</p>
            <motion.p
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="text-5xl font-bold tracking-tight text-primary"
            >
              <AnimatedNumber value={totalScore} />
              <span className="text-xl font-medium text-muted-foreground"> / 990</span>
            </motion.p>
            <div className="mt-2 flex gap-6 text-sm">
              <span>
                Listening: <span className="font-semibold">{listeningScore}</span>
              </span>
              <span>
                Reading: <span className="font-semibold">{readingScore}</span>
              </span>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs font-medium text-muted-foreground">Kết quả luyện tập</p>
            <p className="text-3xl font-bold tracking-tight">
              {correctCount}/{correctCount + wrongCount + skippedCount} câu đúng
            </p>
            <p className="text-xs text-muted-foreground">Bài luyện tập một phần không quy đổi ra thang điểm 990.</p>
          </>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatPill icon={CheckCircle2} label="Câu đúng" value={correctCount} tone="success" />
        <StatPill icon={XCircle} label="Câu sai" value={wrongCount} tone="destructive" />
        <StatPill icon={MinusCircle} label="Bỏ qua" value={skippedCount} tone="muted" />
        <StatPill icon={Clock} label="Thời gian" value={formatTime(timeUsedSec)} tone="info" />
      </div>

      <div className="mt-4 text-center text-sm text-muted-foreground">
        Độ chính xác: <span className="font-semibold text-foreground">{Math.round(accuracy * 100)}%</span>
      </div>
    </div>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  tone: "success" | "destructive" | "muted" | "info";
}) {
  const toneClass = {
    success: "text-success bg-success/10",
    destructive: "text-destructive bg-destructive/10",
    muted: "text-muted-foreground bg-muted",
    info: "text-info bg-info/10",
  }[tone];

  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-border py-3">
      <span className={`flex size-8 items-center justify-center rounded-lg ${toneClass}`}>
        <Icon className="size-4" />
      </span>
      <span className="text-sm font-semibold">{value}</span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}
