import { createServerFn } from '@tanstack/react-start';
import { lookupStripeGrant } from './entitlement-store.server';
import { verifyStripeCheckoutSession } from './stripe.server';

export const recoverStripeGrant = createServerFn({ method: 'POST' })
  .inputValidator((data: { sessionId: string }) => {
    if (!data?.sessionId || typeof data.sessionId !== 'string') {
      throw new Error('sessionId required');
    }
    return { sessionId: data.sessionId.trim() };
  })
  .handler(async ({ data }) => {
    const backup = await lookupStripeGrant(data.sessionId);
    if (backup) {
      return {
        verified: true as const,
        expiresAt: backup.expiresAt,
        sessionId: backup.sessionId,
        source: 'webhook' as const,
      };
    }

    try {
      const live = await verifyStripeCheckoutSession(data.sessionId);
      if (live.verified) {
        return { ...live, source: 'stripe' as const };
      }
      return { verified: false as const, reason: live.reason };
    } catch (err) {
      console.error('Stripe grant recovery failed:', err);
      return { verified: false as const, reason: 'verification_error' };
    }
  });
