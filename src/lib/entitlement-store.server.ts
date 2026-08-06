import '@tanstack/react-start/server-only';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const DATA_DIR = process.env.ENTITLEMENT_DATA_DIR?.trim() || join(process.cwd(), '.data');

type PromoRedemption = { code: string; deviceKey: string; redeemedAt: string };
type StripeGrantRecord = { sessionId: string; expiresAt: string; recordedAt: string };

async function ensureDataDir(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(join(DATA_DIR, file), 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, data: unknown): Promise<void> {
  await ensureDataDir();
  await writeFile(join(DATA_DIR, file), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export async function isPromoRedeemedOnServer(code: string, deviceKey: string): Promise<boolean> {
  const redemptions = await readJson<PromoRedemption[]>('promo-redemptions.json', []);
  return redemptions.some(r => r.code === code && r.deviceKey === deviceKey);
}

export async function recordPromoRedemption(code: string, deviceKey: string): Promise<void> {
  const redemptions = await readJson<PromoRedemption[]>('promo-redemptions.json', []);
  if (redemptions.some(r => r.code === code && r.deviceKey === deviceKey)) return;
  redemptions.push({ code, deviceKey, redeemedAt: new Date().toISOString() });
  await writeJson('promo-redemptions.json', redemptions);
}

export async function recordStripeGrant(sessionId: string, expiresAt: string): Promise<void> {
  const grants = await readJson<StripeGrantRecord[]>('stripe-grants.json', []);
  if (grants.some(g => g.sessionId === sessionId)) return;
  grants.push({ sessionId, expiresAt, recordedAt: new Date().toISOString() });
  await writeJson('stripe-grants.json', grants);
}

export async function lookupStripeGrant(sessionId: string): Promise<StripeGrantRecord | null> {
  const grants = await readJson<StripeGrantRecord[]>('stripe-grants.json', []);
  return grants.find(g => g.sessionId === sessionId) ?? null;
}
