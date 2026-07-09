import { idbGetJson, idbSetJson } from './idb';
import { computeDailySolarMarks } from '../utils/solar';

export type CachedDailyMarks = {
  date: string;
  sunrise: number;
  noon: number;
  sunset: number;
  dark: number;
  lat?: number;
  lon?: number;
};

const MARKS_KEY = 'hw-marks';
const DEFAULT_COORDS = { lat: 40.7128, lon: -74.006 };

export function localDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function resolveCoords(): Promise<{ lat: number; lon: number }> {
  const cached = await idbGetJson<CachedDailyMarks>(MARKS_KEY);
  if (cached?.lat != null && cached?.lon != null) {
    return { lat: cached.lat, lon: cached.lon };
  }

  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => resolve(DEFAULT_COORDS),
        { timeout: 3000, maximumAge: 86_400_000 },
      );
    });
  }

  return DEFAULT_COORDS;
}

/** Compute once per calendar day, cache in IndexedDB (key: hw-marks). */
export async function getDailyMarks(
  lat: number,
  lon: number,
  now: Date = new Date(),
): Promise<CachedDailyMarks> {
  const today = localDateKey(now);
  const cached = await idbGetJson<CachedDailyMarks>(MARKS_KEY);

  if (cached?.date === today) return cached;

  const computed = computeDailySolarMarks(lat, lon, now);
  const entry: CachedDailyMarks = {
    date: today,
    ...computed,
    lat,
    lon,
  };
  await idbSetJson(MARKS_KEY, entry);
  return entry;
}
