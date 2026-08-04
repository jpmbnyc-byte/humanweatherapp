export type PromoGrantType = 'annual' | 'lifetime';

export type PromoDefinition = {
  grant: PromoGrantType;
  /** For annual grants */
  days?: number;
  label: string;
};

/** Built-in promo codes (7–17 alphanumeric characters). */
export const PROMO_CODES: Record<string, PromoDefinition> = {
  HUMAN11: {
    grant: 'annual',
    days: 365,
    label: 'Complimentary 1 year of access',
  },
  JPB2211: {
    grant: 'lifetime',
    label: 'Owner lifetime access',
  },
};

export const PROMO_REDEEMED_KEY = 'hw-promo-redeemed';
export const PROMO_MIN_LEN = 7;
export const PROMO_MAX_LEN = 17;

export function normalizePromoCode(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function isValidPromoFormat(code: string): boolean {
  return code.length >= PROMO_MIN_LEN && code.length <= PROMO_MAX_LEN && /^[A-Z0-9]+$/.test(code);
}

export function lookupPromoCode(raw: string): PromoDefinition | null {
  const code = normalizePromoCode(raw);
  if (!isValidPromoFormat(code)) return null;
  return PROMO_CODES[code] ?? null;
}

export type PromoRedeemResult =
  | { ok: true; code: string; definition: PromoDefinition }
  | { ok: false; reason: 'invalid' | 'unknown' | 'already_redeemed' };
