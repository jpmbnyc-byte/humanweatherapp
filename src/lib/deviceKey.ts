import { idbGetJson, idbSetJson } from './idb';

const DEVICE_KEY = 'hw-device-key';

function createDeviceKey(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `hw-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** Stable per-device id for server-side promo redemption tracking. */
export async function getOrCreateDeviceKey(): Promise<string> {
  const existing = await idbGetJson<string>(DEVICE_KEY);
  if (existing?.trim()) return existing.trim();
  const next = createDeviceKey();
  await idbSetJson(DEVICE_KEY, next);
  return next;
}
