import { idbGetJson, idbSetJson } from '../idb';
import { HW_KEYS } from './keys';

export type PvtResult = {
  id: string;
  at: string;
  reactionMs: number;
  valid: boolean;
};

export type PvtSession = {
  awaiting: boolean;
  shownAt: number | null;
  timeoutId?: ReturnType<typeof setTimeout>;
};

const MIN_VALID_MS = 120;
const MAX_VALID_MS = 800;
const DELAY_MIN_MS = 1500;
const DELAY_MAX_MS = 4000;

export function isValidReactionMs(ms: number): boolean {
  return ms >= MIN_VALID_MS && ms <= MAX_VALID_MS;
}

export async function listPvtResults(): Promise<PvtResult[]> {
  return (await idbGetJson<PvtResult[]>(HW_KEYS.pvtResults)) ?? [];
}

export async function recordPvtResult(reactionMs: number): Promise<PvtResult> {
  const result: PvtResult = {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    reactionMs,
    valid: isValidReactionMs(reactionMs),
  };
  const list = await listPvtResults();
  list.unshift(result);
  await idbSetJson(HW_KEYS.pvtResults, list.slice(0, 100));
  return result;
}

export function schedulePvtStimulus(
  onShow: () => void,
): { cancel: () => void; delayMs: number } {
  const delayMs =
    DELAY_MIN_MS + Math.floor(Math.random() * (DELAY_MAX_MS - DELAY_MIN_MS));
  const timeoutId = setTimeout(onShow, delayMs);
  return {
    delayMs,
    cancel: () => clearTimeout(timeoutId),
  };
}

export function medianReactionMs(results: PvtResult[]): number | null {
  const valid = results.filter(r => r.valid).map(r => r.reactionMs);
  if (valid.length === 0) return null;
  const sorted = [...valid].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
