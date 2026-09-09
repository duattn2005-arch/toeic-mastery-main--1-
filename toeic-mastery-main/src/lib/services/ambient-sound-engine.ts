export type AmbientSoundId = "chillRain" | "heavyRain" | "thunder" | "wind" | "ocean" | "bonfire" | "frog" | "chirp";

export interface PlayingAmbientSound {
  stop: () => void;
}

/** How long a sound fades in when toggled on / fades out when toggled off —
 * without this, connecting a fresh noise source straight to an already-open
 * gain produces an audible click/pop at the exact instant of the toggle,
 * which is what made the mixer feel jarring rather than calming. */
const FADE_SEC = 0.8;

/** Procedurally generated — no audio files to host, license, or have go
 * missing in production. A few seconds of noise looped is indistinguishable
 * from a longer clip once filtered/modulated. */
function createNoiseBuffer(ctx: AudioContext, kind: "white" | "brown", seconds = 4): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  if (kind === "white") {
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  } else {
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
  }
  return buffer;
}

function loopingSource(ctx: AudioContext, buffer: AudioBuffer): AudioBufferSourceNode {
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  return src;
}

/** Connects a slow oscillator into an AudioParam so it drifts around `base`
 * by +/- `depth` — used for wind's frequency sweep and ocean's amplitude
 * swell, so the loop doesn't sound perfectly static/mechanical. */
function modulate(ctx: AudioContext, target: AudioParam, freqHz: number, depth: number, base: number): OscillatorNode {
  const lfo = ctx.createOscillator();
  lfo.frequency.value = freqHz;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = depth;
  lfo.connect(lfoGain);
  lfoGain.connect(target);
  target.value = base;
  lfo.start();
  return lfo;
}

/** A short, softly-enveloped tone burst — the building block for the two
 * "creature" sounds (frog croaks, bird chirps), which are discrete events
 * rather than a continuous drone. Exponential ramps (not linear, and never
 * an instant on/off) keep every single burst click-free. */
function playTone(ctx: AudioContext, out: AudioNode, opts: { freq: number; freqEnd?: number; duration: number; peakGain: number; type?: OscillatorType }) {
  const osc = ctx.createOscillator();
  osc.type = opts.type ?? "sine";
  const now = ctx.currentTime;
  osc.frequency.setValueAtTime(opts.freq, now);
  if (opts.freqEnd) osc.frequency.exponentialRampToValueAtTime(opts.freqEnd, now + opts.duration);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(opts.peakGain, now + opts.duration * 0.25);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + opts.duration);

  osc.connect(gain).connect(out);
  osc.start(now);
  osc.stop(now + opts.duration + 0.05);
}

type Builder = (ctx: AudioContext, out: AudioNode) => PlayingAmbientSound;

const BUILDERS: Record<AmbientSoundId, Builder> = {
  chillRain: (ctx, out) => {
    const src = loopingSource(ctx, createNoiseBuffer(ctx, "white"));
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 900;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 5000;
    const gain = ctx.createGain();
    gain.gain.value = 0.4;
    src.connect(hp).connect(lp).connect(gain).connect(out);
    src.start();
    return {
      stop: () => {
        src.stop();
        [src, hp, lp, gain].forEach((n) => n.disconnect());
      },
    };
  },

  heavyRain: (ctx, out) => {
    const src = loopingSource(ctx, createNoiseBuffer(ctx, "white"));
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 450;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 8000;
    const gain = ctx.createGain();
    gain.gain.value = 0.55;
    src.connect(hp).connect(lp).connect(gain).connect(out);
    src.start();

    // A second, lower "body" layer is what separates a downpour from
    // drizzle — chillRain doesn't have this component at all.
    const bodySrc = loopingSource(ctx, createNoiseBuffer(ctx, "white"));
    const bodyBp = ctx.createBiquadFilter();
    bodyBp.type = "bandpass";
    bodyBp.frequency.value = 280;
    bodyBp.Q.value = 0.6;
    const bodyGain = ctx.createGain();
    bodyGain.gain.value = 0.35;
    bodySrc.connect(bodyBp).connect(bodyGain).connect(out);
    bodySrc.start();

    return {
      stop: () => {
        src.stop();
        bodySrc.stop();
        [src, hp, lp, gain, bodySrc, bodyBp, bodyGain].forEach((n) => n.disconnect());
      },
    };
  },

  thunder: (ctx, out) => {
    const rumbleSrc = loopingSource(ctx, createNoiseBuffer(ctx, "brown"));
    const rumbleLp = ctx.createBiquadFilter();
    rumbleLp.type = "lowpass";
    rumbleLp.frequency.value = 120;
    const rumbleGain = ctx.createGain();
    rumbleGain.gain.value = 0.3;
    rumbleSrc.connect(rumbleLp).connect(rumbleGain).connect(out);
    rumbleSrc.start();

    let stopped = false;
    let timeoutId = 0;
    function boom() {
      if (stopped) return;
      const now = ctx.currentTime;
      const dur = 2 + Math.random() * 2;
      const src = loopingSource(ctx, createNoiseBuffer(ctx, "brown", dur + 1));
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 90;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.5, now + 0.3);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      src.connect(lp).connect(g).connect(out);
      src.start(now);
      src.stop(now + dur + 0.1);
      timeoutId = window.setTimeout(boom, (20 + Math.random() * 25) * 1000);
    }
    timeoutId = window.setTimeout(boom, 3000 + Math.random() * 4000);

    return {
      stop: () => {
        stopped = true;
        window.clearTimeout(timeoutId);
        rumbleSrc.stop();
        [rumbleSrc, rumbleLp, rumbleGain].forEach((n) => n.disconnect());
      },
    };
  },

  wind: (ctx, out) => {
    const src = loopingSource(ctx, createNoiseBuffer(ctx, "white"));
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 0.7;
    const gain = ctx.createGain();
    gain.gain.value = 0.4;
    src.connect(bp).connect(gain).connect(out);
    const lfo = modulate(ctx, bp.frequency, 0.04, 280, 500);
    src.start();
    return {
      stop: () => {
        src.stop();
        lfo.stop();
        [src, bp, gain, lfo].forEach((n) => n.disconnect());
      },
    };
  },

  ocean: (ctx, out) => {
    const src = loopingSource(ctx, createNoiseBuffer(ctx, "white"));
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 600;
    const gain = ctx.createGain();
    src.connect(lp).connect(gain).connect(out);
    const lfo1 = modulate(ctx, gain.gain, 0.09, 0.16, 0.3);
    // A second, slightly-off-rate LFO summed on top avoids the swell
    // sounding like a perfectly mechanical, repeating loop.
    const lfo2 = ctx.createOscillator();
    lfo2.frequency.value = 0.14;
    const lfo2Gain = ctx.createGain();
    lfo2Gain.gain.value = 0.08;
    lfo2.connect(lfo2Gain);
    lfo2Gain.connect(gain.gain);
    lfo2.start();
    src.start();
    return {
      stop: () => {
        src.stop();
        lfo1.stop();
        lfo2.stop();
        [src, lp, gain, lfo1, lfo2, lfo2Gain].forEach((n) => n.disconnect());
      },
    };
  },

  bonfire: (ctx, out) => {
    const bedSrc = loopingSource(ctx, createNoiseBuffer(ctx, "white"));
    const bedLp = ctx.createBiquadFilter();
    bedLp.type = "lowpass";
    bedLp.frequency.value = 1500;
    const bedGain = ctx.createGain();
    bedGain.gain.value = 0.18;
    bedSrc.connect(bedLp).connect(bedGain).connect(out);
    bedSrc.start();

    let stopped = false;
    let timeoutId = 0;
    function crackle() {
      if (stopped) return;
      const now = ctx.currentTime;
      const dur = 0.05 + Math.random() * 0.06;
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      const pop = ctx.createBufferSource();
      pop.buffer = buf;
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 1800;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.08 + Math.random() * 0.1, now + dur * 0.2);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      pop.connect(hp).connect(g).connect(out);
      pop.start(now);
      timeoutId = window.setTimeout(crackle, 250 + Math.random() * 700);
    }
    timeoutId = window.setTimeout(crackle, 400);

    return {
      stop: () => {
        stopped = true;
        window.clearTimeout(timeoutId);
        bedSrc.stop();
        [bedSrc, bedLp, bedGain].forEach((n) => n.disconnect());
      },
    };
  },

  frog: (ctx, out) => {
    // Very quiet "pond at night" bed so the croaks have somewhere to sit,
    // then short low-pitched croak bursts scheduled in loose clusters.
    const bedSrc = loopingSource(ctx, createNoiseBuffer(ctx, "brown"));
    const bedLp = ctx.createBiquadFilter();
    bedLp.type = "lowpass";
    bedLp.frequency.value = 400;
    const bedGain = ctx.createGain();
    bedGain.gain.value = 0.06;
    bedSrc.connect(bedLp).connect(bedGain).connect(out);
    bedSrc.start();

    let stopped = false;
    let timeoutId = 0;
    function croakCluster() {
      if (stopped) return;
      const croaks = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < croaks; i++) {
        window.setTimeout(() => {
          if (stopped) return;
          playTone(ctx, out, { freq: 260 + Math.random() * 80, duration: 0.18 + Math.random() * 0.1, peakGain: 0.12, type: "sawtooth" });
        }, i * (140 + Math.random() * 80));
      }
      timeoutId = window.setTimeout(croakCluster, 2500 + Math.random() * 4500);
    }
    timeoutId = window.setTimeout(croakCluster, 1200);

    return {
      stop: () => {
        stopped = true;
        window.clearTimeout(timeoutId);
        bedSrc.stop();
        [bedSrc, bedLp, bedGain].forEach((n) => n.disconnect());
      },
    };
  },

  chirp: (ctx, out) => {
    const bedSrc = loopingSource(ctx, createNoiseBuffer(ctx, "white"));
    const bedBp = ctx.createBiquadFilter();
    bedBp.type = "bandpass";
    bedBp.frequency.value = 3500;
    bedBp.Q.value = 0.8;
    const bedGain = ctx.createGain();
    bedGain.gain.value = 0.04;
    bedSrc.connect(bedBp).connect(bedGain).connect(out);
    bedSrc.start();

    let stopped = false;
    let timeoutId = 0;
    function chirpCluster() {
      if (stopped) return;
      const chirps = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < chirps; i++) {
        window.setTimeout(() => {
          if (stopped) return;
          const base = 2600 + Math.random() * 900;
          playTone(ctx, out, { freq: base, freqEnd: base * (1.3 + Math.random() * 0.4), duration: 0.09 + Math.random() * 0.05, peakGain: 0.1 });
        }, i * (90 + Math.random() * 60));
      }
      timeoutId = window.setTimeout(chirpCluster, 1500 + Math.random() * 3500);
    }
    timeoutId = window.setTimeout(chirpCluster, 800);

    return {
      stop: () => {
        stopped = true;
        window.clearTimeout(timeoutId);
        bedSrc.stop();
        [bedSrc, bedBp, bedGain].forEach((n) => n.disconnect());
      },
    };
  },
};

/** Wraps a builder's output in its own gain envelope so every sound fades in
 * on start and fades out on stop, instead of popping in/out at full volume —
 * the fix for the mixer feeling jarring rather than calming. */
export function buildAmbientSound(id: AmbientSoundId, ctx: AudioContext, out: AudioNode): PlayingAmbientSound {
  const envelope = ctx.createGain();
  envelope.gain.value = 0;
  envelope.connect(out);
  const now = ctx.currentTime;
  envelope.gain.setValueAtTime(0, now);
  envelope.gain.linearRampToValueAtTime(1, now + FADE_SEC);

  const inner = BUILDERS[id](ctx, envelope);

  return {
    stop: () => {
      const stopAt = ctx.currentTime;
      envelope.gain.cancelScheduledValues(stopAt);
      envelope.gain.setValueAtTime(envelope.gain.value, stopAt);
      envelope.gain.linearRampToValueAtTime(0, stopAt + FADE_SEC);
      window.setTimeout(() => {
        inner.stop();
        envelope.disconnect();
      }, FADE_SEC * 1000 + 100);
    },
  };
}
