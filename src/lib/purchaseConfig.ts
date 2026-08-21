/** What annual access unlocks — shown on purchase surfaces. */
export const MEMBERSHIP_FEATURES = [
  'Diurnal Spine — Vault, Meridian, and Marrow offices',
  'Il Nascimento — daily forming ritual and mementos',
  'Full Fascia — your observation log',
  'Tender Studio — guided voice, visual framing, and branded exports',
] as const;

export const PURCHASE_SUCCESS_QUERY = 'purchase';
export const PURCHASE_SUCCESS_VALUE = 'success';

/** Production Stripe Payment Link — public checkout URL (also in render.yaml). */
export const STRIPE_PAYMENT_LINK_URL = 'https://buy.stripe.com/5kQ28r28T8OY9s56G34ow00';

const DEFAULT_PRICE = '60';

function readEnv(key: string): string | undefined {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return (import.meta.env as Record<string, string | undefined>)[key];
  }
  return undefined;
}

/** Detect Lovable/Render placeholder or non-checkout URLs baked in at build time. */
export function isPlaceholderPurchaseUrl(url: string): boolean {
  const u = url.trim().toLowerCase();
  if (!u) return true;
  if (u.includes('placeholder') || u.includes('your_link') || u.includes('your-live-domain')) {
    return true;
  }
  if (u.includes('example.com') || u.endsWith('/membership')) return true;
  try {
    const { hostname, pathname } = new URL(url);
    if (hostname === 'buy.stripe.com' && (!pathname || pathname === '/' || /\/(your|placeholder|xxx)/i.test(pathname))) {
      return true;
    }
  } catch {
    return true;
  }
  return false;
}

function resolvePurchaseUrl(): string {
  const explicit = readEnv('VITE_PURCHASE_URL')?.trim();
  if (explicit && !isPlaceholderPurchaseUrl(explicit)) return explicit;
  return STRIPE_PAYMENT_LINK_URL;
}

export function getPurchaseUrl(): string {
  return resolvePurchaseUrl();
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
  const url = resolvePurchaseUrl();
  return !isPlaceholderPurchaseUrl(url);
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
