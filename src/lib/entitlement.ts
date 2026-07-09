import { idbGetJson, idbSetJson } from './idb';
import {
  PURCHASE_SUCCESS_QUERY,
  PURCHASE_SUCCESS_VALUE,
} from './purchaseConfig';

export const ENTITLEMENT_KEY = 'hw-entitlement';

export type EntitlementRecord =
  | { state: 'trial'; startedAt: string }
  | { state: 'member'; since?: string }
  | { state: 'lapsed'; trialStartedAt: string; lapsedAt: string };

export type EffectiveEntitlement = 'trial' | 'member' | 'lapsed';

export type EntitlementFeature = 'nascimento' | 'offices' | 'prescriptions' | 'fascia';

const TRIAL_LENGTH_DAYS = 7;

export function trialDayNumber(startedAt: string, now: Date = new Date()): number {
  const start = new Date(startedAt);
  start.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - start.getTime()) / 86_400_000) + 1;
}

export function resolveEffectiveState(
  record: EntitlementRecord,
  now: Date = new Date(),
): EffectiveEntitlement {
  if (record.state === 'member') return 'member';
  if (record.state === 'lapsed') return 'lapsed';
  const day = trialDayNumber(record.startedAt, now);
  return day > TRIAL_LENGTH_DAYS ? 'lapsed' : 'trial';
}

export function hasFeature(
  effective: EffectiveEntitlement,
  feature: EntitlementFeature,
): boolean {
  if (effective === 'member' || effective === 'trial') {
    switch (feature) {
      case 'nascimento':
      case 'offices':
      case 'prescriptions':
      case 'fascia':
        return true;
    }
  }
  return false;
}

/** Days 6–7 of trial — foot-line copy at Threshold. */
export function trialFootline(record: EntitlementRecord, now: Date = new Date()): string | null {
  if (record.state !== 'trial') return null;
  const day = trialDayNumber(record.startedAt, now);
  if (day < 6 || day > TRIAL_LENGTH_DAYS) return null;
  const daysLeft = TRIAL_LENGTH_DAYS + 1 - day;
  return `Trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Il Nascimento and the Diurnal Spine close with it.`;
}

export async function loadEntitlement(now: Date = new Date()): Promise<{
  record: EntitlementRecord;
  effective: EffectiveEntitlement;
}> {
  let record = await idbGetJson<EntitlementRecord>(ENTITLEMENT_KEY);

  if (!record) {
    record = { state: 'trial', startedAt: now.toISOString() };
    await idbSetJson(ENTITLEMENT_KEY, record);
  }

  const effective = resolveEffectiveState(record, now);

  if (effective === 'lapsed' && record.state === 'trial') {
    record = {
      state: 'lapsed',
      trialStartedAt: record.startedAt,
      lapsedAt: now.toISOString(),
    };
    await idbSetJson(ENTITLEMENT_KEY, record);
  }

  return { record, effective };
}

/** Grant lifetime membership after successful checkout return. */
export async function grantMembership(now: Date = new Date()): Promise<EntitlementRecord> {
  const record: EntitlementRecord = { state: 'member', since: now.toISOString() };
  await idbSetJson(ENTITLEMENT_KEY, record);
  return record;
}

export function parsePurchaseReturn(search: string): 'success' | null {
  const params = new URLSearchParams(search);
  return params.get(PURCHASE_SUCCESS_QUERY) === PURCHASE_SUCCESS_VALUE ? 'success' : null;
}

export function stripPurchaseReturnParams(search: string): string {
  const params = new URLSearchParams(search);
  params.delete(PURCHASE_SUCCESS_QUERY);
  params.delete('session_id');
  const next = params.toString();
  return next ? `?${next}` : '';
}
