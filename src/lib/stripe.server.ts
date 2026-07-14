import '@tanstack/react-start/server-only';
import Stripe from 'stripe';
import { ANNUAL_ACCESS_DAYS } from './entitlement';

export type StripeVerifyResult =
  | { verified: true; expiresAt: string; sessionId: string }
  | { verified: false; reason: string };

function readServerEnv(key: string): string | undefined {
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key]?.trim();
  }
  return undefined;
}

export function getStripeSecretKey(): string | undefined {
  return readServerEnv('STRIPE_SECRET_KEY');
}

export function getStripeWebhookSecret(): string | undefined {
  return readServerEnv('STRIPE_WEBHOOK_SECRET');
}

export function getStripeAnnualAmountCents(): number {
  const raw = readServerEnv('STRIPE_ANNUAL_AMOUNT_CENTS');
  const n = raw ? Number(raw) : 6000;
  return Number.isFinite(n) && n > 0 ? n : 6000;
}

function getStripeClient(): Stripe {
  const key = getStripeSecretKey();
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
  return new Stripe(key);
}

export async function verifyStripeCheckoutSession(sessionId: string): Promise<StripeVerifyResult> {
  if (!sessionId.startsWith('cs_')) {
    return { verified: false, reason: 'invalid_session_id' };
  }

  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== 'paid') {
    return { verified: false, reason: 'payment_not_completed' };
  }

  if (session.mode === 'subscription') {
    return { verified: false, reason: 'subscription_not_allowed' };
  }

  const expectedCents = getStripeAnnualAmountCents();
  const paidCents = session.amount_total ?? 0;
  if (paidCents < expectedCents) {
    return { verified: false, reason: 'amount_mismatch' };
  }

  const since = new Date();
  const expires = new Date(since);
  expires.setDate(expires.getDate() + ANNUAL_ACCESS_DAYS);

  return {
    verified: true,
    expiresAt: expires.toISOString(),
    sessionId: session.id,
  };
}

export async function constructStripeWebhookEvent(
  payload: string,
  signature: string,
): Promise<Stripe.Event> {
  const secret = getStripeWebhookSecret();
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  const stripe = getStripeClient();
  return stripe.webhooks.constructEvent(payload, signature, secret);
}
