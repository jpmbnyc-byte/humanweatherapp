import { idbGetJson, idbSetJson } from '../idb';
import { HW_KEYS } from './keys';

export type ChannelMode = 'haptic' | 'audiotactile' | 'visual';

export type ChannelPrefs = {
  mode: ChannelMode;
  hapticEnabled: boolean;
  audioEnabled: boolean;
  visualPulseEnabled: boolean;
};

const DEFAULT_PREFS: ChannelPrefs = {
  mode: 'visual',
  hapticEnabled: true,
  audioEnabled: true,
  visualPulseEnabled: true,
};

export async function getChannelPrefs(): Promise<ChannelPrefs> {
  const stored = await idbGetJson<ChannelPrefs>(HW_KEYS.prefsChannel);
  return stored ? { ...DEFAULT_PREFS, ...stored } : { ...DEFAULT_PREFS };
}

export async function setChannelPrefs(prefs: Partial<ChannelPrefs>): Promise<ChannelPrefs> {
  const current = await getChannelPrefs();
  const next = { ...current, ...prefs };
  await idbSetJson(HW_KEYS.prefsChannel, next);
  return next;
}

export type ChannelSignal = {
  kind: 'pulse' | 'settle' | 'alert';
  intensity?: number;
  label?: string;
};

export type ChannelRenderer = {
  mode: ChannelMode;
  render(signal: ChannelSignal): void;
  dispose(): void;
};

function createVisualRenderer(root?: HTMLElement | null): ChannelRenderer {
  let el: HTMLDivElement | null = null;
  const host = root ?? (typeof document !== 'undefined' ? document.body : null);

  return {
    mode: 'visual',
    render(signal) {
      if (!host) return;
      if (!el) {
        el = document.createElement('div');
        el.setAttribute('aria-hidden', 'true');
        el.style.cssText =
          'pointer-events:none;position:fixed;inset:0;z-index:9998;transition:opacity 480ms ease;mix-blend-mode:soft-light';
        host.appendChild(el);
      }
      const alpha = signal.kind === 'alert' ? 0.18 : signal.kind === 'pulse' ? 0.12 : 0.04;
      el.style.background = `radial-gradient(circle at 50% 40%, rgba(201,169,106,${alpha}), transparent 70%)`;
      el.style.opacity = signal.kind === 'settle' ? '0' : '1';
    },
    dispose() {
      el?.remove();
      el = null;
    },
  };
}

function createHapticRenderer(): ChannelRenderer {
  return {
    mode: 'haptic',
    render(signal) {
      if (typeof navigator === 'undefined' || !navigator.vibrate) return;
      const ms = signal.kind === 'alert' ? 40 : signal.kind === 'pulse' ? 18 : 8;
      navigator.vibrate(ms);
    },
    dispose() {},
  };
}

function createAudiotactileRenderer(): ChannelRenderer {
  let ctx: AudioContext | null = null;
  return {
    mode: 'audiotactile',
    render(signal) {
      if (typeof window === 'undefined') return;
      if (!ctx) ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = signal.kind === 'alert' ? 220 : 140;
      gain.gain.value = signal.intensity ?? 0.04;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (signal.kind === 'settle' ? 0.08 : 0.14));
    },
    dispose() {
      void ctx?.close();
      ctx = null;
    },
  };
}

export function createChannelRenderer(
  mode: ChannelMode,
  root?: HTMLElement | null,
): ChannelRenderer {
  switch (mode) {
    case 'haptic':
      return createHapticRenderer();
    case 'audiotactile':
      return createAudiotactileRenderer();
    case 'visual':
    default:
      return createVisualRenderer(root);
  }
}

/** Emit a signal through all enabled channel renderers for the current prefs. */
export async function emitChannelSignal(
  signal: ChannelSignal,
  root?: HTMLElement | null,
): Promise<void> {
  const prefs = await getChannelPrefs();
  const modes: ChannelMode[] = [];
  if (prefs.visualPulseEnabled) modes.push('visual');
  if (prefs.hapticEnabled) modes.push('haptic');
  if (prefs.audioEnabled) modes.push('audiotactile');
  if (modes.length === 0) modes.push(prefs.mode);

  for (const mode of modes) {
    const renderer = createChannelRenderer(mode, root);
    renderer.render(signal);
    renderer.dispose();
  }
}
