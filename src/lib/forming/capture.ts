import { prefersReducedMotion } from './motion';

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
