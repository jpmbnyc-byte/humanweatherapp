import { normalizePromoCode } from './promoCodes';

export const PROMO_QUERY = 'promo';

export function parsePromoFromSearch(search: string): string | null {
  const raw = new URLSearchParams(search).get(PROMO_QUERY)?.trim();
  if (!raw) return null;
  const code = normalizePromoCode(raw);
  return code || null;
}

export function stripPromoFromSearch(search: string): string {
  const params = new URLSearchParams(search);
  params.delete(PROMO_QUERY);
  const next = params.toString();
  return next ? `?${next}` : '';
}
