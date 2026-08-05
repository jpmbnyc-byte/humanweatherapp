/** What annual access unlocks — shown on purchase surfaces. */
export const MEMBERSHIP_FEATURES = [
  'Diurnal Spine — Vault, Meridian, and Marrow offices',
  'Il Nascimento — daily forming ritual and mementos',
  'Full Fascia — your observation log',
  'Prescriptions — routed Shinrin, breath, Aura, and Tender',
] as const;

export const PURCHASE_SUCCESS_QUERY = 'purchase';
export const PURCHASE_SUCCESS_VALUE = 'success';

const DEFAULT_PURCHASE_URL = 'https://humanweather.app/membership';
const DEFAULT_SITE_URL = 'https://humanweather.social';
const DEFAULT_PRICE = '60';

function readEnv(key: string): string | undefined {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return (import.meta.env as Record<string, string | undefined>)[key];
  }
  return undefined;
}

export function getPurchaseUrl(): string {
  return readEnv('VITE_PURCHASE_URL')?.trim() || DEFAULT_PURCHASE_URL;
}

/** Public site origin for share links and redirects when window is unavailable. */
export function getSiteUrl(origin?: string): string {
  const fromEnv = readEnv('VITE_SITE_URL')?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (origin?.trim()) return origin.replace(/\/$/, '');
  if (typeof window !== 'undefined') return window.location.origin.replace(/\/$/, '');
  return DEFAULT_SITE_URL;
}

export function isStripeCheckoutUrl(url = getPurchaseUrl()): boolean {
  try {
    const host = new URL(url).hostname;
    return host === 'buy.stripe.com' || host.endsWith('.stripe.com');
  } catch {
    return url.includes('buy.stripe.com');
  }
}

export function getPurchasePriceLabel(): string {
  return readEnv('VITE_PURCHASE_PRICE_LABEL')?.trim() || 'Annual access · no monthly plan';
}

export function getPurchasePriceDisplay(): string | null {
  const raw = readEnv('VITE_PURCHASE_PRICE')?.trim() || DEFAULT_PRICE;
  const n = Number(raw);
  if (Number.isFinite(n)) return `$${n}/year`;
  return raw;
}

export function isPurchaseConfigured(): boolean {
  const explicit = readEnv('VITE_PURCHASE_URL')?.trim();
  return Boolean(explicit && !explicit.includes('PLACEHOLDER'));
}

/** Configure this exact URL in Stripe Payment Link → After payment → Redirect */
export function getStripeSuccessRedirectUrl(origin: string): string {
  return `${origin.replace(/\/$/, '')}/?${PURCHASE_SUCCESS_QUERY}=${PURCHASE_SUCCESS_VALUE}&session_id={CHECKOUT_SESSION_ID}`;
}

/** Stripe Payment Links use dashboard redirect; other hosts may accept query params. */
export function buildPurchaseCheckoutUrl(origin: string, pathname: string): string {
  const base = getPurchaseUrl();
  if (isStripeCheckoutUrl(base)) return base;

  const returnTo = `${origin}${pathname}?${PURCHASE_SUCCESS_QUERY}=${PURCHASE_SUCCESS_VALUE}`;

  try {
    const url = new URL(base);
    if (!url.searchParams.has('client_reference_id')) {
      url.searchParams.set('client_reference_id', 'human-weather-web');
    }
    if (!url.searchParams.has('success_url')) {
      url.searchParams.set('success_url', returnTo);
    }
    return url.toString();
  } catch {
    return base;
  }
}

export function openPurchaseCheckout(): void {
  if (typeof window === 'undefined') return;
  const target = buildPurchaseCheckoutUrl(window.location.origin, window.location.pathname);
  window.location.assign(target);
}
