import type { WeatherState } from '../types';
import type { ConditionsData } from './conditions';

export type OfficeId = 'vault' | 'meridian' | 'marrow' | 'field';

export interface Observation {
  id: string;
  timestamp: number;
  office: OfficeId;
  weatherStateId: string;
  conditionsHeader: string;
  felt: string;
  fact: string;
  faith: string;
  coordinates: [number, number][];
  stone?: string;
  summary: string;
}

export interface InheritanceMetrics {
  coherenceAvg: number;
  recoveryVelocity: number;
  clearSkyFrequency: number;
  observationCount: number;
  forecastUnlocked: boolean;
}

const DB_NAME = 'human-weather-fascia';
const STORE = 'observations';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('office', 'office', { unique: false });
      }
    };
  });
}

export async function fileObservation(
  office: OfficeId,
  weather: WeatherState,
  conditions: ConditionsData,
  coordinates: [number, number][],
  stone?: string,
): Promise<Observation> {
  const obs: Observation = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    office,
    weatherStateId: weather.id,
    conditionsHeader: conditions.header,
    felt: conditions.felt,
    fact: conditions.fact,
    faith: conditions.faith,
    coordinates,
    stone,
    summary: conditions.felt,
  };

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(obs);
    tx.oncomplete = () => resolve(obs);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getObservations(limit = 100): Promise<Observation[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const index = store.index('timestamp');
    const request = index.openCursor(null, 'prev');
    const results: Observation[] = [];

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor && results.length < limit) {
        results.push(cursor.value as Observation);
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getTodaysVaultObservation(): Promise<Observation | null> {
  const obs = await getObservations(50);
  const today = new Date().toDateString();
  return (
    obs.find(
      (o) =>
        o.office === 'vault' &&
        new Date(o.timestamp).toDateString() === today,
    ) ?? null
  );
}

export async function toggleStone(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const obs = getReq.result as Observation | undefined;
      if (!obs) {
        resolve();
        return;
      }
      obs.stone = obs.stone ? undefined : obs.summary;
      store.put(obs);
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function computeInheritance(): Promise<InheritanceMetrics> {
  const obs = await getObservations(500);
  const count = obs.length;

  if (count === 0) {
    return {
      coherenceAvg: 0,
      recoveryVelocity: 0,
      clearSkyFrequency: 0,
      observationCount: 0,
      forecastUnlocked: false,
    };
  }

  const coherenceValues = obs.map((o) => {
    const match = o.conditionsHeader.match(/COHERENCE\s+(\d+)%/i);
    return match ? parseInt(match[1], 10) : 50;
  });
  const coherenceAvg =
    coherenceValues.reduce((a, b) => a + b, 0) / coherenceValues.length;

  const clearSky = obs.filter(
    (o) => o.weatherStateId === 'autonomic_stillness' || o.weatherStateId === 'high_resonant_thermal_coherence',
  ).length;
  const clearSkyFrequency = (clearSky / count) * 100;

  const byDay = new Map<string, { vault?: Observation; marrow?: Observation }>();
  for (const o of obs) {
    const day = new Date(o.timestamp).toDateString();
    const entry = byDay.get(day) ?? {};
    if (o.office === 'vault') entry.vault = o;
    if (o.office === 'marrow') entry.marrow = o;
    byDay.set(day, entry);
  }

  let recoverySum = 0;
  let recoveryCount = 0;
  for (const { vault, marrow } of byDay.values()) {
    if (vault && marrow) {
      const vCoherence = parseCoherence(vault.conditionsHeader);
      const mCoherence = parseCoherence(marrow.conditionsHeader);
      recoverySum += Math.max(0, mCoherence - vCoherence);
      recoveryCount++;
    }
  }
  const recoveryVelocity =
    recoveryCount > 0 ? recoverySum / recoveryCount : 0;

  return {
    coherenceAvg: Math.round(coherenceAvg),
    recoveryVelocity: Math.round(recoveryVelocity),
    clearSkyFrequency: Math.round(clearSkyFrequency),
    observationCount: count,
    forecastUnlocked: count >= 30,
  };
}

function parseCoherence(header: string): number {
  const match = header.match(/COHERENCE\s+(\d+)%/i);
  return match ? parseInt(match[1], 10) : 50;
}
