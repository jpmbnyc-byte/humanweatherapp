import { prefersReducedMotion } from './motion';

const SHUTTER_URL = '/voice/shutter.mp3';

let shutterBuffer: AudioBuffer | null | undefined;

async function loadShutter(ctx: AudioContext): Promise<AudioBuffer | null> {
  if (shutterBuffer !== undefined) return shutterBuffer;
  try {
    const res = await fetch(SHUTTER_URL);
    if (!res.ok) {
      shutterBuffer = null;
      return null;
    }
    const buf = await res.arrayBuffer();
    shutterBuffer = await ctx.decodeAudioData(buf);
    return shutterBuffer;
  } catch {
    shutterBuffer = null;
    return null;
  }
}

/** L1 — manual leaf shutter, pitched ~6% down, softened. Skips silently if missing. */
export async function playShutterSound(): Promise<void> {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const buffer = await loadShutter(ctx);
    if (!buffer) return;

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = 0.94;

    const gain = ctx.createGain();
    gain.gain.value = 0.55;

    const low = ctx.createBiquadFilter();
    low.type = 'lowpass';
    low.frequency.value = 320;

    const body = ctx.createOscillator();
    body.type = 'sine';
    body.frequency.value = 90;
    const bodyGain = ctx.createGain();
    bodyGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    bodyGain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);

    src.connect(gain);
    gain.connect(low);
    low.connect(ctx.destination);
    body.connect(bodyGain);
    bodyGain.connect(ctx.destination);

    body.start(ctx.currentTime);
    src.start(ctx.currentTime);
    body.stop(ctx.currentTime + 0.2);
    src.stop(ctx.currentTime + Math.min(buffer.duration * 0.94, 0.35));

    await new Promise<void>(res => {
      src.onended = () => {
        void ctx.close();
        res();
      };
    });
  } catch {
    /* skip sound, never error */
  }
}

/** L2 — mechanical recoil haptic. */
export function fireCaptureHaptic(): void {
  try {
    if ('vibrate' in navigator) navigator.vibrate([12, 40, 22]);
  } catch {
    /* absent on iOS Safari */
  }
}

export type CaptureVisualCallbacks = {
  onBloom: () => void;
  onScalePunch: () => void;
  onFrameDraw: () => void;
  onMountStart: () => void;
  onStillness: () => void;
  onRelease: () => void;
};

/** Schedule L1–L5 as one ~180ms-window capture event + mounting + stillness. */
export async function runCaptureSequence(
  callbacks: CaptureVisualCallbacks,
  reduceMotion = prefersReducedMotion(),
): Promise<void> {
  void playShutterSound();
  fireCaptureHaptic();

  callbacks.onBloom();
  if (!reduceMotion) callbacks.onScalePunch();

  await delay(reduceMotion ? 40 : 90);
  callbacks.onFrameDraw();
  callbacks.onMountStart();

  await delay(reduceMotion ? 800 : 2000);
  callbacks.onStillness();
  await delay(reduceMotion ? 600 : 1500);
  callbacks.onRelease();
}

function delay(ms: number): Promise<void> {
  return new Promise(res => setTimeout(res, ms));
}
