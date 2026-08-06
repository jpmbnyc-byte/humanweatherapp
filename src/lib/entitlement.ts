import { idbGetJson, idbSetJson } from './idb';
import {
  isValidPromoFormat,
  normalizePromoCode,
  PROMO_REDEEMED_KEY,
  type PromoDefinition,
  type PromoRedeemResult,
} from './promoCodes';
import { getOrCreateDeviceKey } from './deviceKey';
import { redeemPromo as redeemPromoOnServer } from './promo.functions';
import {
  PURCHASE_SUCCESS_QUERY,
  PURCHASE_SUCCESS_VALUE,
} from './purchaseConfig';

export const ENTITLEMENT_KEY = 'hw-entitlement';
export const STRIPE_REDEEMED_KEY = 'hw-stripe-redeemed';
export const ANNUAL_ACCESS_DAYS = 365;

export type EntitlementRecord =
  | { state: 'trial'; startedAt: string; trialMonth: string }
  | {
      state: 'member';
      since: string;
      expiresAt?: string;
      lifetime?: boolean;
      stripeSessionId?: string;
      promoCode?: string;
    }
  | { state: 'lapsed'; trialStartedAt: string; lapsedAt: string; lapsedMonth: string };

export type EffectiveEntitlement = 'trial' | 'member' | 'lapsed';

export type EntitlementFeature = 'nascimento' | 'offices' | 'prescriptions' | 'fascia';

/** Calendar month key — trial renews automatically each month. */
export function monthKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function trialDayNumber(startedAt: string, now: Date = new Date()): number {
  const start = new Date(startedAt);
  start.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - start.getTime()) / 86_400_000) + 1;
}

export function membershipExpiresAt(
  record: Extract<EntitlementRecord, { state: 'member' }>,
): Date | null {
  if (record.lifetime) return null;
  if (record.expiresAt) return new Date(record.expiresAt);
  const since = new Date(record.since);
  since.setDate(since.getDate() + ANNUAL_ACCESS_DAYS);
  return since;
}

export function isMembershipExpired(record: EntitlementRecord, now: Date = new Date()): boolean {
  if (record.state !== 'member') return false;
  if (record.lifetime) return false;
  const expires = membershipExpiresAt(record);
  if (!expires) return false;
  return now.getTime() >= expires.getTime();
}

function isTrialActiveForMonth(
  record: Extract<EntitlementRecord, { state: 'trial' }>,
  now: Date,
): boolean {
  return record.trialMonth === monthKey(now);
}

export function resolveEffectiveState(
  record: EntitlementRecord,
  now: Date = new Date(),
): EffectiveEntitlement {
  if (record.state === 'member') {
    return isMembershipExpired(record, now) ? 'lapsed' : 'member';
  }
  if (record.state === 'lapsed') return 'lapsed';
  return isTrialActiveForMonth(record, now) ? 'trial' : 'lapsed';
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

/** Lapsed users can still browse saved marks (read-only). */
export function canReadFascia(effective: EffectiveEntitlement): boolean {
  return effective === 'member' || effective === 'trial' || effective === 'lapsed';
}

/** Days left in the current calendar-month trial window. */
export function daysLeftInTrialMonth(now: Date = new Date()): number {
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86_400_000));
}

/** Foot-line when trial month is ending soon. */
export function trialFootline(record: EntitlementRecord, now: Date = new Date()): string | null {
  if (record.state !== 'trial' || !isTrialActiveForMonth(record, now)) return null;
  const daysLeft = daysLeftInTrialMonth(now);
  if (daysLeft > 7) return null;
  if (daysLeft === 0) {
    return "This month's trial ends today. A fresh trial opens on the 1st.";
  }
  return `This month's trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. A fresh trial opens on the 1st.`;
}

export function isLifetimeMember(record: EntitlementRecord | null): boolean {
  return record?.state === 'member' && !!record.lifetime;
}

export function formatMembershipExpiry(
  record: EntitlementRecord,
  now: Date = new Date(),
): string | null {
  if (record.state !== 'member' || isMembershipExpired(record, now)) return null;
  if (record.lifetime) return 'Lifetime access';
  const expires = membershipExpiresAt(record);
  if (!expires) return null;
  return expires.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function shouldRenewMonthlyTrial(record: EntitlementRecord, now: Date): boolean {
  const current = monthKey(now);
  if (record.state === 'trial') {
    return record.trialMonth !== current;
  }
  if (record.state === 'lapsed') {
    return record.lapsedMonth !== current;
  }
  if (record.state === 'member' && isMembershipExpired(record, now)) {
    return true;
  }
  return false;
}

async function renewMonthlyTrial(now: Date): Promise<EntitlementRecord> {
  const record: EntitlementRecord = {
    state: 'trial',
    startedAt: now.toISOString(),
    trialMonth: monthKey(now),
  };
  await idbSetJson(ENTITLEMENT_KEY, record);
  return record;
}

async function persistLapsed(startedAt: string, now: Date): Promise<EntitlementRecord> {
  const lapsed: EntitlementRecord = {
    state: 'lapsed',
    trialStartedAt: startedAt,
    lapsedAt: now.toISOString(),
    lapsedMonth: monthKey(now),
  };
  await idbSetJson(ENTITLEMENT_KEY, lapsed);
  return lapsed;
}

export async function loadEntitlement(now: Date = new Date()): Promise<{
  record: EntitlementRecord;
  effective: EffectiveEntitlement;
}> {
  let record = await idbGetJson<EntitlementRecord>(ENTITLEMENT_KEY);

  if (!record) {
    record = await renewMonthlyTrial(now);
    return { record, effective: 'trial' };
  }

  if (record.state === 'trial' && !('trialMonth' in record && record.trialMonth)) {
    record = {
      state: 'trial',
      startedAt: record.startedAt,
      trialMonth: monthKey(new Date(record.startedAt)),
    };
    await idbSetJson(ENTITLEMENT_KEY, record);
  }

  if (record.state === 'lapsed' && !('lapsedMonth' in record && record.lapsedMonth)) {
    record = {
      ...record,
      lapsedMonth: monthKey(new Date(record.lapsedAt)),
    };
    await idbSetJson(ENTITLEMENT_KEY, record);
  }

  if (record.state === 'member' && isMembershipExpired(record, now)) {
    record = await persistLapsed(record.since, now);
  }

  if (shouldRenewMonthlyTrial(record, now)) {
    record = await renewMonthlyTrial(now);
    return { record, effective: 'trial' };
  }

  const effective = resolveEffectiveState(record, now);

  if (effective === 'lapsed' && record.state === 'trial') {
    record = await persistLapsed(record.startedAt, now);
  }

  return { record, effective: resolveEffectiveState(record, now) };
}

/** Grant annual or lifetime access (checkout or promo). Preserves existing lifetime grants. */
export async function grantMembership(
  now: Date = new Date(),
  opts?: { expiresAt?: string; stripeSessionId?: string; promoCode?: string; lifetime?: boolean },
): Promise<EntitlementRecord> {
  const existing = await idbGetJson<EntitlementRecord>(ENTITLEMENT_KEY);
  if (existing?.state === 'member' && existing.lifetime && !opts?.lifetime) {
    return existing;
  }

  const since = now.toISOString();
  const record: EntitlementRecord = opts?.lifetime
    ? {
        state: 'member',
        since,
        lifetime: true,
        ...(opts.promoCode ? { promoCode: opts.promoCode } : {}),
      }
    : {
        state: 'member',
        since,
        expiresAt: (opts?.expiresAt
          ? new Date(opts.expiresAt)
          : (() => {
              const d = new Date(now);
              d.setDate(d.getDate() + ANNUAL_ACCESS_DAYS);
              return d;
            })()
        ).toISOString(),
        ...(opts?.stripeSessionId ? { stripeSessionId: opts.stripeSessionId } : {}),
        ...(opts?.promoCode ? { promoCode: opts.promoCode } : {}),
      };
  await idbSetJson(ENTITLEMENT_KEY, record);
  return record;
}

async function getRedeemedStripeSessions(): Promise<string[]> {
  return (await idbGetJson<string[]>(STRIPE_REDEEMED_KEY)) ?? [];
}

export async function isStripeSessionRedeemed(sessionId: string): Promise<boolean> {
  const redeemed = await getRedeemedStripeSessions();
  return redeemed.includes(sessionId);
}

async function markStripeSessionRedeemed(sessionId: string): Promise<void> {
  const redeemed = await getRedeemedStripeSessions();
  if (!redeemed.includes(sessionId)) {
    await idbSetJson(STRIPE_REDEEMED_KEY, [...redeemed, sessionId]);
  }
}

/** Apply verified Stripe checkout on this device (once per session id). */
export async function applyStripeCheckout(
  sessionId: string,
  expiresAt: string,
  now: Date = new Date(),
): Promise<EntitlementRecord> {
  if (await isStripeSessionRedeemed(sessionId)) {
    const { record } = await loadEntitlement(now);
    return record;
  }
  const record = await grantMembership(now, { expiresAt, stripeSessionId: sessionId });
  await markStripeSessionRedeemed(sessionId);
  return record;
}

async function getRedeemedPromos(): Promise<string[]> {
  return (await idbGetJson<string[]>(PROMO_REDEEMED_KEY)) ?? [];
}

async function markPromoRedeemed(code: string): Promise<void> {
  const redeemed = await getRedeemedPromos();
  if (!redeemed.includes(code)) {
    await idbSetJson(PROMO_REDEEMED_KEY, [...redeemed, code]);
  }
}

export async function redeemPromoCode(raw: string, now: Date = new Date()): Promise<PromoRedeemResult> {
  const code = normalizePromoCode(raw);
  if (!isValidPromoFormat(code)) {
    return { ok: false, reason: 'invalid' };
  }

  const redeemed = await getRedeemedPromos();
  if (redeemed.includes(code)) {
    return { ok: false, reason: 'already_redeemed' };
  }

  const deviceKey = await getOrCreateDeviceKey();
  let serverResult;
  try {
    serverResult = await redeemPromoOnServer({ data: { code, deviceKey } });
  } catch {
    return { ok: false, reason: 'server_error' };
  }

  if (!serverResult.ok) {
    if (serverResult.reason === 'already_redeemed') {
      await markPromoRedeemed(code);
    }
    return { ok: false, reason: serverResult.reason === 'already_redeemed' ? 'already_redeemed' : serverResult.reason };
  }

  const definition: PromoDefinition = {
    grant: serverResult.grant,
    days: serverResult.grant === 'annual' ? ANNUAL_ACCESS_DAYS : undefined,
    label: serverResult.label,
    shareable: serverResult.shareable,
  };

  if (serverResult.grant === 'lifetime') {
    await grantMembership(now, { lifetime: true, promoCode: code });
  } else {
    await grantMembership(now, {
      expiresAt: serverResult.expiresAt,
      promoCode: code,
    });
  }

  await markPromoRedeemed(code);
  return { ok: true, code, definition };
}

export function parsePurchaseSessionId(search: string): string | null {
  const params = new URLSearchParams(search);
  const sessionId = params.get('session_id')?.trim();
  return sessionId && sessionId.startsWith('cs_') ? sessionId : null;
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
