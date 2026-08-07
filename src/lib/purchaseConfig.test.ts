import { describe, expect, it } from 'vitest';
import {
  STRIPE_PAYMENT_LINK_URL,
  getPurchaseUrl,
  isPlaceholderPurchaseUrl,
  isPurchaseConfigured,
} from './purchaseConfig';

describe('isPlaceholderPurchaseUrl', () => {
  it('flags Lovable placeholder checkout URLs', () => {
    expect(isPlaceholderPurchaseUrl('https://buy.stripe.com/YOUR_LINK')).toBe(true);
    expect(isPlaceholderPurchaseUrl('https://buy.stripe.com/PLACEHOLDER')).toBe(true);
  });

  it('flags legacy membership page fallback', () => {
    expect(isPlaceholderPurchaseUrl('https://humanweather.app/membership')).toBe(true);
  });

  it('accepts a real Stripe payment link', () => {
    expect(isPlaceholderPurchaseUrl(STRIPE_PAYMENT_LINK_URL)).toBe(false);
  });
});

describe('getPurchaseUrl', () => {
  it('falls back to production payment link when env is a placeholder', () => {
    expect(getPurchaseUrl()).toBe(STRIPE_PAYMENT_LINK_URL);
  });
});

describe('isPurchaseConfigured', () => {
  it('is true when a valid checkout URL resolves', () => {
    expect(isPurchaseConfigured()).toBe(true);
  });
});
