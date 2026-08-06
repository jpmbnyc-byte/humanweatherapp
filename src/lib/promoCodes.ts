export type PromoGrantType = 'annual' | 'lifetime';

export type PromoDefinition = {
  grant: PromoGrantType;
  /** For annual grants */
  days?: number;
  label: string;
  /** May be distributed via share link (never set on owner/lifetime codes). */
  shareable?: boolean;
};

/** Public share slug — validation happens server-side. */
export const SHAREABLE_ANNUAL_PROMO = 'HUMAN11';

export const PROMO_REDEEMED_KEY = 'hw-promo-redeemed';
export const PROMO_MIN_LEN = 7;
export const PROMO_MAX_LEN = 17;

export function normalizePromoCode(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function isValidPromoFormat(code: string): boolean {
  return code.length >= PROMO_MIN_LEN && code.length <= PROMO_MAX_LEN && /^[A-Z0-9]+$/.test(code);
}

export function isShareablePromoCode(raw: string): boolean {
  return normalizePromoCode(raw) === SHAREABLE_ANNUAL_PROMO;
}

export function getShareableAnnualPromo(): { code: string } {
  return { code: SHAREABLE_ANNUAL_PROMO };
}

export type PromoRedeemResult =
  | { ok: true; code: string; definition: PromoDefinition }
  | { ok: false; reason: 'invalid' | 'unknown' | 'already_redeemed' | 'server_error' };
