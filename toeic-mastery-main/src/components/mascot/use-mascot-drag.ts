"use client";

import * as React from "react";

const STORAGE_KEY = "toeic-mastery:mascot-position";
const DRAG_THRESHOLD_PX = 6;

type Position = { x: number; y: number };

function readStoredPosition(): Position | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.x === "number" && typeof parsed?.y === "number") return parsed;
  } catch {
    // localStorage unavailable or corrupt value — fall back to the default corner.
  }
  return null;
}

function clampToViewport(pos: Position, size: { width: number; height: number }): Position {
  const maxX = Math.max(0, window.innerWidth - size.width);
  const maxY = Math.max(0, window.innerHeight - size.height);
  return { x: Math.min(Math.max(pos.x, 0), maxX), y: Math.min(Math.max(pos.y, 0), maxY) };
}

/**
 * Makes the element behind `ref` draggable anywhere on screen instead of
 * staying pinned to its default corner. Renders at the caller's default
 * (CSS `bottom-*`/`right-*` classes) until dragged at least once; from then
 * on position is pixel-controlled and persisted to localStorage, so it
 * stays where the user left it across page navigations and reloads.
 *
 * Distinguishes a drag from a plain tap via a small movement threshold —
 * callers should check `wasDragged()` inside their own onClick and skip
 * the click action when it returns true (pointerup fires right before
 * click, so the flag is still fresh).
 */
export function useMascotDrag(ref: React.RefObject<HTMLElement | null>) {
  const [position, setPosition] = React.useState<Position | null>(null);
  const dragState = React.useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const draggedRef = React.useRef(false);

  React.useEffect(() => {
    setPosition(readStoredPosition());
  }, []);

  const onPointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      dragState.current = { startX: e.clientX, startY: e.clientY, originX: rect.left, originY: rect.top };
      el.setPointerCapture(e.pointerId);
    },
    [ref]
  );

  const onPointerMove = React.useCallback(
    (e: React.PointerEvent) => {
      const drag = dragState.current;
      const el = ref.current;
      if (!drag || !el) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if (!draggedRef.current && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
      draggedRef.current = true;
      const rect = el.getBoundingClientRect();
      setPosition(clampToViewport({ x: drag.originX + dx, y: drag.originY + dy }, { width: rect.width, height: rect.height }));
    },
    [ref]
  );

  const onPointerUp = React.useCallback((e: React.PointerEvent) => {
    const el = ref.current;
    if (el?.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    dragState.current = null;
    if (draggedRef.current) {
      setPosition((current) => {
        if (current) {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
          } catch {
            // Best-effort persistence only.
          }
        }
        return current;
      });
    }
  }, [ref]);

  const wasDragged = React.useCallback(() => {
    const dragged = draggedRef.current;
    draggedRef.current = false;
    return dragged;
  }, []);

  const style: React.CSSProperties | undefined = position
    ? { position: "fixed", left: position.x, top: position.y, right: "auto", bottom: "auto" }
    : undefined;

  return { style, onPointerDown, onPointerMove, onPointerUp, wasDragged };
}
