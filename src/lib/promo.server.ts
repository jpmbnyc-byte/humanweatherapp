import '@tanstack/react-start/server-only';
import { isPromoRedeemedOnServer, recordPromoRedemption } from './entitlement-store.server';
import { isValidPromoFormat, normalizePromoCode } from './promoCodes';

const ANNUAL_ACCESS_DAYS = 365;

export type ServerPromoGrant = 'annual' | 'lifetime';

export type ServerPromoDefinition = {
  grant: ServerPromoGrant;
  days?: number;
  label: string;
  shareable?: boolean;
};

const DEFAULT_SERVER_PROMO_CODES: Record<string, ServerPromoDefinition> = {
  HUMAN11: {
    grant: 'annual',
    days: 365,
    label: 'Complimentary 1 year of access',
    shareable: true,
  },
  JPB2211: {
    grant: 'lifetime',
    label: 'Owner lifetime access',
  },
};

function loadServerPromoCodes(): Record<string, ServerPromoDefinition> {
  const raw = process.env.PROMO_CODES_JSON?.trim();
  if (!raw) return DEFAULT_SERVER_PROMO_CODES;
  try {
    const parsed = JSON.parse(raw) as Record<string, ServerPromoDefinition>;
    return { ...DEFAULT_SERVER_PROMO_CODES, ...parsed };
  } catch {
    return DEFAULT_SERVER_PROMO_CODES;
  }
}

function lookupServerPromo(code: string): ServerPromoDefinition | null {
  return loadServerPromoCodes()[code] ?? null;
}

export type ServerPromoRedeemResult =
  | { ok: true; code: string; grant: ServerPromoGrant; expiresAt?: string; label: string; shareable?: boolean }
  | { ok: false; reason: 'invalid' | 'unknown' | 'already_redeemed' };

export async function redeemPromoOnServer(raw: string, deviceKey: string): Promise<ServerPromoRedeemResult> {
  const code = normalizePromoCode(raw);
  if (!isValidPromoFormat(code)) {
    return { ok: false, reason: 'invalid' };
  }

  const definition = lookupServerPromo(code);
  if (!definition) {
    return { ok: false, reason: 'unknown' };
  }

  if (!deviceKey?.trim()) {
    return { ok: false, reason: 'invalid' };
  }

  if (await isPromoRedeemedOnServer(code, deviceKey)) {
    return { ok: false, reason: 'already_redeemed' };
  }

  await recordPromoRedemption(code, deviceKey);

  if (definition.grant === 'lifetime') {
    return { ok: true, code, grant: 'lifetime', label: definition.label, shareable: definition.shareable };
  }

  const expires = new Date();
  expires.setDate(expires.getDate() + (definition.days ?? ANNUAL_ACCESS_DAYS));

  return {
    ok: true,
    code,
    grant: 'annual',
    expiresAt: expires.toISOString(),
    label: definition.label,
    shareable: definition.shareable,
  };
}

export function isShareablePromoOnServer(code: string): boolean {
  const definition = lookupServerPromo(normalizePromoCode(code));
  return !!definition?.shareable;
}
