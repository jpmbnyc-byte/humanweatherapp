import { idbGet, idbSet } from '../idb';
import type { Memento } from './types';
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
    return JSON.parse(raw) as Memento;
  } catch {
    return null;
  }
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
