"use client";

import * as React from "react";
import { motion } from "framer-motion";

const COLORS = ["var(--primary)", "var(--success)", "var(--warning)", "var(--info)"];
const PIECES = Array.from({ length: 24 }, (_, i) => i);

interface PieceTransform {
  x: number;
  y: number;
  rotate: number;
  duration: number;
}

function computePieces(): PieceTransform[] {
  return PIECES.map((i) => {
    const angle = (i / PIECES.length) * Math.PI * 2;
    const distance = 120 + Math.random() * 160;
    return {
      x: Math.cos(angle) * distance,
      y: Math.abs(Math.sin(angle)) * distance * -1 - 40 + 260,
      rotate: Math.random() * 360,
      duration: 1.4 + Math.random() * 0.5,
    };
  });
}

/** A small, one-shot confetti burst — used sparingly (e.g. hitting a target score). */
export function ConfettiBurst() {
  // Randomized once per mount (not on every render) — an accepted lazy-init
  // pattern for otherwise-impure values used only in render output.
  const [pieces] = React.useState(computePieces);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[200] flex justify-center overflow-hidden">
      {pieces.map((piece, i) => (
        <motion.span
          key={i}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: piece.x, y: piece.y, opacity: 0, rotate: piece.rotate }}
          transition={{ duration: piece.duration, ease: "easeOut" }}
          className="absolute top-10 size-2 rounded-sm"
          style={{ background: COLORS[i % COLORS.length] }}
        />
      ))}
    </div>
  );
}
