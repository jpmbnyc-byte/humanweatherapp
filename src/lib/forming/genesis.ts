import { idbGet, idbSet } from '../idb';
import type { FormSeed, GesturePoint, Memento } from './types';
import { localDateKey } from '../dailyMarks';

const KEY_PREFIX = 'nascimento:';
const INDEX_KEY = 'nascimento:index';
const MANIFEST_KEY = 'nascimento:manifest';

export function mementoKey(date: string): string {
  return `${KEY_PREFIX}${date}`;
}

export async function getMementoForDate(date: string): Promise<Memento | null> {
  const raw = await idbGet(mementoKey(date));
  if (!raw) return null;
  try {
    return normalizeMemento(JSON.parse(raw), date);
  } catch {
    return null;
  }
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizePoint(value: unknown): GesturePoint | null {
  if (!value || typeof value !== 'object') return null;
  const point = value as Partial<GesturePoint>;
  if (typeof point.x !== 'number' || !Number.isFinite(point.x)) return null;
  if (typeof point.y !== 'number' || !Number.isFinite(point.y)) return null;
  return {
    x: finiteNumber(point.x, 0.5),
    y: finiteNumber(point.y, 0.5),
    t: finiteNumber(point.t, 0),
    pressure: finiteNumber(point.pressure, 0.5),
    dwell: finiteNumber(point.dwell, 80),
  };
}

/** Keep device-stored Daymarks renderable across seed schema changes. */
export function normalizeMemento(value: unknown, fallbackDate = localDateKey()): Memento | null {
  if (!value || typeof value !== 'object') return null;
  const saved = value as Partial<Memento> & { formSeed?: Partial<FormSeed> };
  if (!saved.formSeed || typeof saved.formSeed !== 'object') return null;

  const seed = saved.formSeed;
  const date = typeof saved.date === 'string' ? saved.date : fallbackDate;
  const weatherName =
    typeof saved.weatherName === 'string'
      ? saved.weatherName
      : typeof seed.weatherName === 'string'
        ? seed.weatherName
        : 'Recorded conditions';
  const rawCentroid = Array.isArray(seed.gridCentroid) ? seed.gridCentroid : [];
  const gridCentroid: [number, number] = [
    finiteNumber(rawCentroid[0], 0.5),
    finiteNumber(rawCentroid[1], 0.5),
  ];
  const gesturePoints = Array.isArray(seed.gesturePoints)
    ? seed.gesturePoints.map(normalizePoint).filter((point): point is GesturePoint => point !== null)
    : [];

  const formSeed: FormSeed = {
    gestureHash: finiteNumber(seed.gestureHash, 0),
    weatherId: typeof seed.weatherId === 'string' ? seed.weatherId : 'vaporous_resonance_drift',
    weatherName,
    date: typeof seed.date === 'string' ? seed.date : date,
    gridCentroid,
    pathSpread: finiteNumber(seed.pathSpread, 0.1),
    particleCount: finiteNumber(seed.particleCount, gesturePoints.length),
    conditionsSummary: typeof seed.conditionsSummary === 'string' ? seed.conditionsSummary : '',
    gesturePoints,
  };

  return {
    id: typeof saved.id === 'string' ? saved.id : `${date}-restored`,
    date,
    index: finiteNumber(saved.index, 0),
    weatherName,
    formSeed,
    conditionsSummary:
      typeof saved.conditionsSummary === 'string'
        ? saved.conditionsSummary
        : formSeed.conditionsSummary,
  };
}

async function readManifest(): Promise<string[]> {
  const raw = await idbGet(MANIFEST_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export async function getAllMementos(): Promise<Memento[]> {
  const dates = await readManifest();
  const mementos = await Promise.all(dates.map(d => getMementoForDate(d)));
  return mementos.filter((m): m is Memento => m !== null);
}

/** Newest first, capped for display. Storage keeps all marks. */
export async function getRecentMementos(limit = 30): Promise<Memento[]> {
  const all = await getAllMementos();
  if (all.length <= limit) return [...all].reverse();
  return all.slice(-limit).reverse();
}

async function nextMementoIndex(): Promise<number> {
  const raw = await idbGet(INDEX_KEY);
  const n = raw ? parseInt(raw, 10) : 0;
  const next = Number.isFinite(n) ? n + 1 : 1;
  await idbSet(INDEX_KEY, String(next));
  return next;
}

/** Atomic save — only call after successful final-exhale capture. */
export async function saveMemento(memento: Memento): Promise<void> {
  await idbSet(mementoKey(memento.date), JSON.stringify(memento));
  const dates = await readManifest();
  if (!dates.includes(memento.date)) {
    dates.push(memento.date);
    dates.sort();
    await idbSet(MANIFEST_KEY, JSON.stringify(dates));
  }
}

export async function createMementoFromSeed(
  formSeed: Memento['formSeed'],
  now: Date = new Date(),
): Promise<Memento> {
  const date = localDateKey(now);
  const index = await nextMementoIndex();
  return {
    id: `${date}-${index}`,
    date,
    index,
    weatherName: formSeed.weatherName,
    formSeed,
    conditionsSummary: formSeed.conditionsSummary,
  };
}
