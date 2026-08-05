export type PromoGrantType = 'annual' | 'lifetime';

export type PromoDefinition = {
  grant: PromoGrantType;
  /** For annual grants */
  days?: number;
  label: string;
  /** May be distributed via share link (never set on owner/lifetime codes). */
  shareable?: boolean;
};

/** Complimentary annual code — safe to share via gift link. */
export const SHAREABLE_ANNUAL_PROMO = 'HUMAN11';

/** Built-in promo codes (7–17 alphanumeric characters). */
export const PROMO_CODES: Record<string, PromoDefinition> = {
  [SHAREABLE_ANNUAL_PROMO]: {
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

export function isShareablePromoCode(raw: string): boolean {
  const code = normalizePromoCode(raw);
  const definition = PROMO_CODES[code];
  return !!definition?.shareable;
}

export function getShareableAnnualPromo(): { code: string; definition: PromoDefinition } {
  return { code: SHAREABLE_ANNUAL_PROMO, definition: PROMO_CODES[SHAREABLE_ANNUAL_PROMO] };
}

export type PromoRedeemResult =
  | { ok: true; code: string; definition: PromoDefinition }
  | { ok: false; reason: 'invalid' | 'unknown' | 'already_redeemed' };
