/** Shared Web Audio context — unlock/resume must run inside a user gesture on iOS. */

let sharedCtx: AudioContext | null = null;
let unlockPromise: Promise<AudioContext> | null = null;
let iosHtmlAudio: HTMLAudioElement | null = null;

function isIosWebKit(): boolean {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;
  const hasWebKitContext = 'webkitAudioContext' in window;
  return navigator.maxTouchPoints > 0 && hasWebKitContext;
}

/** Seven-sample silent WAV used to open iOS's media playback audio session. */
function createSilentWav(sampleRate: number): string {
  const buffer = new ArrayBuffer(10);
  const view = new DataView(buffer);
  view.setUint32(0, sampleRate, true);
  view.setUint32(4, sampleRate, true);
  view.setUint16(8, 1, true);
  const bytes = String.fromCharCode(...new Uint8Array(buffer));
  const missing = window.btoa(bytes).slice(0, 13);
  return `data:audio/wav;base64,UklGRisAAABXQVZFZm10IBAAAAABAAEA${missing}AgAZGF0YQcAAACAgICAgICAAAA=`;
}

/**
 * HTML media opens iOS's playback audio session, which Web Audio alone cannot
 * do while the Ring/Silent switch is enabled. Must run during a user gesture.
 */
async function primeIosMediaSession(): Promise<void> {
  if (!isIosWebKit()) return;

  if (!iosHtmlAudio) {
    const audio = document.createElement('audio');
    audio.setAttribute('playsinline', '');
    audio.setAttribute('x-webkit-airplay', 'deny');
    audio.preload = 'auto';
    audio.loop = true;
    audio.src = createSilentWav(sharedCtx?.sampleRate ?? 44100);
    audio.load();
    iosHtmlAudio = audio;
  }

  if (!iosHtmlAudio.paused) return;

  try {
    await iosHtmlAudio.play();
  } catch {
    iosHtmlAudio.pause();
    iosHtmlAudio.removeAttribute('src');
    iosHtmlAudio.load();
    iosHtmlAudio = null;
  }
}

function createContext(): AudioContext {
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  return new Ctx();
}

export async function getAudioContext(): Promise<AudioContext> {
  if (!sharedCtx || sharedCtx.state === 'closed') {
    sharedCtx = createContext();
  }
  // Safari can expose a non-standard "interrupted" state after calls,
  // route changes, or backgrounding. Resume every non-running context.
  if ((sharedCtx.state as string) !== 'running') {
    await sharedCtx.resume();
  }
  if ((sharedCtx.state as string) !== 'running') {
    throw new Error(`Web Audio did not start (state: ${sharedCtx.state})`);
  }
  return sharedCtx;
}

/** Play a silent buffer so iOS/Safari keeps the audio graph alive after first tap. */
export async function unlockAudioContext(): Promise<void> {
  // Start the HTML media bridge synchronously before the first await so the
  // browser still associates play() with the user's tap.
  const mediaSessionPromise = primeIosMediaSession();

  if (!unlockPromise) {
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
  }

  const activeUnlock = unlockPromise;
  try {
    await Promise.all([activeUnlock, mediaSessionPromise]);
  } finally {
    if (unlockPromise === activeUnlock) unlockPromise = null;
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
  if (iosHtmlAudio) {
    iosHtmlAudio.pause();
    iosHtmlAudio.removeAttribute('src');
    iosHtmlAudio.load();
    iosHtmlAudio = null;
  }
}
