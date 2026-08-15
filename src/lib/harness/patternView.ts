import type { Office } from '../officeObserved';
import { listReadings, type ReadingRecord } from './readings';
import { adaptOfficeOffsetsFromPattern } from './officesScheduler';

export type PatternBucket = {
  weatherId: string;
  count: number;
  lastAt: string;
};

export type PatternSummary = {
  total: number;
  buckets: PatternBucket[];
  dominantWeatherId: string | null;
  officeLateMinutes: Partial<Record<Office, number>>;
};

const CANONICAL_WEATHER_IDS = [
  'sympathetic_heat_dome',
  'scattered_atmospheric_drift',
  'high_resonant_thermal_coherence',
  'dewpoint_restorative_slumber',
  'vaporous_resonance_drift',
  'autonomic_stillness',
] as const;

export function bucketReadings(readings: ReadingRecord[]): PatternBucket[] {
  const map = new Map<string, PatternBucket>();
  for (const r of readings) {
    const prev = map.get(r.weatherId);
    if (!prev) {
      map.set(r.weatherId, { weatherId: r.weatherId, count: 1, lastAt: r.at });
    } else {
      prev.count += 1;
      if (r.at > prev.lastAt) prev.lastAt = r.at;
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

/** Estimate habitual lateness per office from reading timestamps vs nominal windows. */
export function estimateOfficeLateness(readings: ReadingRecord[]): Partial<Record<Office, number>> {
  const late: Partial<Record<Office, number>> = {};
  for (const r of readings) {
    if (!r.office) continue;
    const hour = new Date(r.at).getHours() + new Date(r.at).getMinutes() / 60;
    const nominal =
      r.office === 'vault' ? 7.5 : r.office === 'meridian' ? 12.5 : 18.5;
    const deltaMin = Math.max(0, (hour - nominal) * 60);
    late[r.office] = Math.max(late[r.office] ?? 0, deltaMin);
  }
  return late;
}

export async function buildPatternSummary(): Promise<PatternSummary> {
  const readings = await listReadings();
  const buckets = bucketReadings(readings);
  const officeLateMinutes = estimateOfficeLateness(readings);
  return {
    total: readings.length,
    buckets,
    dominantWeatherId: buckets[0]?.weatherId ?? null,
    officeLateMinutes,
  };
}

export async function applyAdaptiveOfficeOffsets(): Promise<void> {
  const summary = await buildPatternSummary();
  await adaptOfficeOffsetsFromPattern(summary.officeLateMinutes);
}

export function isCanonicalWeather(weatherId: string): boolean {
  return (CANONICAL_WEATHER_IDS as readonly string[]).includes(weatherId);
}

export { CANONICAL_WEATHER_IDS };
