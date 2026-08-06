import { getShareableAnnualPromo, normalizePromoCode } from './promoCodes';

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

export function buildPromoShareUrl(origin = typeof window !== 'undefined' ? window.location.origin : ''): string {
  const { code } = getShareableAnnualPromo();
  const base = origin.replace(/\/$/, '') || 'https://humanweather.app';
  return `${base}/?${PROMO_QUERY}=${code}`;
}

export function buildPromoShareMessage(url = buildPromoShareUrl()): string {
  const { code } = getShareableAnnualPromo();
  return `Human Weather — complimentary 1 year of access. Open this link or enter code ${code}:\n${url}`;
}

export type PromoShareResult = 'shared' | 'copied' | 'failed';

/** Native share sheet on mobile; clipboard fallback on desktop. */
export async function shareAnnualPromoLink(): Promise<PromoShareResult> {
  const url = buildPromoShareUrl();
  const text = buildPromoShareMessage(url);

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: 'Human Weather — gift a year',
        text: `Human Weather — complimentary 1 year of access. Code HUMAN11.`,
        url,
      });
      return 'shared';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return 'failed';
      }
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}
