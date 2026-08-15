import { idbGetJson, idbSetJson } from '../idb';
import { HW_KEYS } from './keys';

/** Maximum animation pulse frequency — photosensitive safety cap. */
export const SLOW_FIELD_MAX_HZ = 2;
export const SLOW_FIELD_MIN_INTERVAL_MS = 1000 / SLOW_FIELD_MAX_HZ;

export type SlowFieldPrefs = {
  enabled: boolean;
  photosensitiveGate: boolean;
  maxHz: number;
};

const DEFAULT: SlowFieldPrefs = {
  enabled: true,
  photosensitiveGate: true,
  maxHz: SLOW_FIELD_MAX_HZ,
};

export async function getSlowFieldPrefs(): Promise<SlowFieldPrefs> {
  const stored = await idbGetJson<SlowFieldPrefs>(HW_KEYS.slowFieldPrefs);
  return stored ? { ...DEFAULT, ...stored } : { ...DEFAULT };
}

export async function setSlowFieldPrefs(prefs: Partial<SlowFieldPrefs>): Promise<SlowFieldPrefs> {
  const next = { ...(await getSlowFieldPrefs()), ...prefs };
  await idbSetJson(HW_KEYS.slowFieldPrefs, next);
  return next;
}

export function clampPulseIntervalMs(requestedMs: number, prefs: SlowFieldPrefs): number {
  const cap = 1000 / Math.min(prefs.maxHz, SLOW_FIELD_MAX_HZ);
  return Math.max(requestedMs, cap);
}

export function shouldBlockPulse(prefs: SlowFieldPrefs): boolean {
  return prefs.photosensitiveGate && prefs.enabled;
}

/** Apply slow-field cap to CSS animation duration (ms). */
export function slowFieldDurationMs(requestedMs: number, prefs?: SlowFieldPrefs | null): number {
  const p = prefs ?? DEFAULT;
  if (!p.enabled) return requestedMs;
  const minPeriod = 1000 / Math.min(p.maxHz, SLOW_FIELD_MAX_HZ);
  return Math.max(requestedMs, minPeriod);
}

export function slowFieldStyle(
  requestedMs: number,
  prefs?: SlowFieldPrefs | null,
): { animationDuration: string; animationIterationCount: string } {
  const ms = slowFieldDurationMs(requestedMs, prefs);
  return {
    animationDuration: `${ms}ms`,
    animationIterationCount: 'infinite',
  };
}
