import { createServerFn } from '@tanstack/react-start';
import { verifyStripeCheckoutSession } from './stripe.server';

export const verifyStripeCheckout = createServerFn({ method: 'POST' })
  .inputValidator((data: { sessionId: string }) => {
    if (!data?.sessionId || typeof data.sessionId !== 'string') {
      throw new Error('sessionId required');
    }
    return { sessionId: data.sessionId.trim() };
  })
  .handler(async ({ data }) => {
    try {
      return await verifyStripeCheckoutSession(data.sessionId);
    } catch (err) {
      console.error('Stripe session verification failed:', err);
      return { verified: false as const, reason: 'verification_error' };
    }
  });
