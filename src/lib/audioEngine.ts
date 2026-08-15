/** Shared Web Audio context — unlock/resume must run inside a user gesture on iOS. */

let sharedCtx: AudioContext | null = null;
let unlockPromise: Promise<AudioContext> | null = null;

function createContext(): AudioContext {
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  return new Ctx();
}

export async function getAudioContext(): Promise<AudioContext> {
  if (!sharedCtx || sharedCtx.state === 'closed') {
    sharedCtx = createContext();
  }
  if (sharedCtx.state === 'suspended') {
    await sharedCtx.resume();
  }
  return sharedCtx;
}

/** Play a silent buffer so iOS/Safari keeps the audio graph alive after first tap. */
export async function unlockAudioContext(): Promise<void> {
  if (unlockPromise) {
    await unlockPromise;
    return;
  }
  unlockPromise = (async () => {
    const ctx = await getAudioContext();
    const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    source.stop(ctx.currentTime + 0.05);
    return ctx;
  })();
  try {
    await unlockPromise;
  } finally {
    unlockPromise = null;
  }
}

export function fadeInGain(
  gain: GainNode,
  ctx: AudioContext,
  target: number,
  durationSec = 1.8,
): void {
  const now = ctx.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(Math.max(target, 0.0001), now + durationSec);
}

export function fadeOutGain(
  gain: GainNode,
  ctx: AudioContext,
  durationSec = 0.6,
): Promise<void> {
  return new Promise(resolve => {
    const now = ctx.currentTime;
    const current = gain.gain.value;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(Math.max(current, 0.0001), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);
    window.setTimeout(resolve, durationSec * 1000 + 40);
  });
}

export async function closeSharedAudioContext(): Promise<void> {
  if (!sharedCtx) return;
  try {
    if (sharedCtx.state !== 'closed') await sharedCtx.close();
  } catch {
    /* best-effort */
  }
  sharedCtx = null;
}
