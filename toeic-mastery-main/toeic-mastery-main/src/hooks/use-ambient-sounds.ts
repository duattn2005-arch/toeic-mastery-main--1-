"use client";

import * as React from "react";
import { buildAmbientSound, type AmbientSoundId, type PlayingAmbientSound } from "@/lib/services/ambient-sound-engine";

/** Manages the shared AudioContext + master gain for the ambient sound mixer
 * — multiple sounds can be toggled on simultaneously (rain + fire, etc.),
 * each an independent node graph feeding the same master gain. The context
 * is created lazily on the first toggle, since browsers block starting audio
 * before a user gesture; a click handler counts as one. */
export function useAmbientSounds(initialVolume: number) {
  const ctxRef = React.useRef<AudioContext | null>(null);
  const masterRef = React.useRef<GainNode | null>(null);
  const activeRef = React.useRef<Map<AmbientSoundId, PlayingAmbientSound>>(new Map());
  const [activeIds, setActiveIds] = React.useState<AmbientSoundId[]>([]);
  const volumeRef = React.useRef(initialVolume);

  function ensureContext() {
    if (!ctxRef.current) {
      const ctx = new AudioContext();
      const master = ctx.createGain();
      master.gain.value = volumeRef.current;
      master.connect(ctx.destination);
      ctxRef.current = ctx;
      masterRef.current = master;
    }
    if (ctxRef.current.state === "suspended") void ctxRef.current.resume();
    return { ctx: ctxRef.current, master: masterRef.current! };
  }

  const toggle = React.useCallback((id: AmbientSoundId) => {
    const { ctx, master } = ensureContext();
    const existing = activeRef.current.get(id);
    if (existing) {
      existing.stop();
      activeRef.current.delete(id);
    } else {
      activeRef.current.set(id, buildAmbientSound(id, ctx, master));
    }
    setActiveIds(Array.from(activeRef.current.keys()));
  }, []);

  const setVolume = React.useCallback((v: number) => {
    volumeRef.current = v;
    if (masterRef.current) masterRef.current.gain.value = v;
  }, []);

  React.useEffect(() => {
    const active = activeRef.current;
    return () => {
      active.forEach((s) => s.stop());
      active.clear();
      void ctxRef.current?.close();
    };
  }, []);

  return { activeIds, toggle, setVolume };
}
