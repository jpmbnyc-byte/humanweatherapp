import { idbGetJson, idbSetJson } from '../idb';
import { HW_KEYS, LEGACY_FIELD_STATION_KEYS } from './keys';

export type LegacyFieldStationSnapshot = {
  migratedAt: string;
  sources: Record<string, unknown>;
};

function readLocal(key: string): unknown {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

/** One-time migration of V1 field-station keys into hw.legacy.fieldstation. */
export async function migrateLegacyFieldStation(
  force = false,
): Promise<LegacyFieldStationSnapshot | null> {
  const existing = await idbGetJson<LegacyFieldStationSnapshot>(HW_KEYS.legacyFieldStation);
  if (existing && !force) return existing;

  const sources: Record<string, unknown> = {};
  for (const key of LEGACY_FIELD_STATION_KEYS) {
    const value = readLocal(key);
    if (value != null) sources[key] = value;
  }

  if (Object.keys(sources).length === 0 && !force) return existing;

  const snapshot: LegacyFieldStationSnapshot = {
    migratedAt: new Date().toISOString(),
    sources,
  };
  await idbSetJson(HW_KEYS.legacyFieldStation, snapshot);
  return snapshot;
}
