/** What membership unlocks — shown on purchase surfaces. */
export const MEMBERSHIP_FEATURES = [
  'Diurnal Spine — Vault, Meridian, and Marrow offices',
  'Il Nascimento — daily forming ritual and mementos',
  'Full Fascia — your observation log',
  'Prescriptions — routed Shinrin, breath, Aura, and Tender',
] as const;

export const PURCHASE_SUCCESS_QUERY = 'purchase';
export const PURCHASE_SUCCESS_VALUE = 'success';

const DEFAULT_PURCHASE_URL = 'https://humanweather.app/membership';

function readEnv(key: string): string | undefined {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return (import.meta.env as Record<string, string | undefined>)[key];
  }
  return undefined;
}

export function getPurchaseUrl(): string {
  return readEnv('VITE_PURCHASE_URL')?.trim() || DEFAULT_PURCHASE_URL;
}

export function getPurchasePriceLabel(): string {
  return readEnv('VITE_PURCHASE_PRICE_LABEL')?.trim() || 'One-time · lifetime access';
}

export function getPurchasePriceDisplay(): string | null {
  const raw = readEnv('VITE_PURCHASE_PRICE')?.trim();
  if (!raw) return null;
  const n = Number(raw);
  if (Number.isFinite(n)) return `$${n}`;
  return raw;
}

export function isPurchaseConfigured(): boolean {
  const explicit = readEnv('VITE_PURCHASE_URL')?.trim();
  return Boolean(explicit && !explicit.includes('PLACEHOLDER'));
}

/** Return URL appended for checkout providers that accept client_reference_id / success_url params. */
export function buildPurchaseCheckoutUrl(origin: string, pathname: string): string {
  const base = getPurchaseUrl();
  const returnTo = `${origin}${pathname}?${PURCHASE_SUCCESS_QUERY}=${PURCHASE_SUCCESS_VALUE}`;

  try {
    const url = new URL(base);
    // Stripe Payment Links ignore these if not configured — harmless extras for flexible hosts.
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
