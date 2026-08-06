import { createFileRoute } from '@tanstack/react-router';
import { constructStripeWebhookEvent } from '@/lib/stripe.server';
import { recordStripeGrant } from '@/lib/entitlement-store.server';

const ANNUAL_ACCESS_DAYS = 365;

export const Route = createFileRoute('/api/stripe/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const signature = request.headers.get('stripe-signature');
        if (!signature) {
          return new Response('Missing stripe-signature header', { status: 400 });
        }

        const payload = await request.text();

        try {
          const event = await constructStripeWebhookEvent(payload, signature);

          if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            if (session.payment_status === 'paid' && session.id) {
              const since = new Date();
              const expires = new Date(since);
              expires.setDate(expires.getDate() + ANNUAL_ACCESS_DAYS);
              await recordStripeGrant(session.id, expires.toISOString());
              console.info('[stripe] recorded grant backup', session.id);
            }
          }

          return Response.json({ received: true });
        } catch (err) {
          console.error('[stripe] webhook error:', err);
          return new Response('Webhook signature verification failed', { status: 400 });
        }
      },
    },
  },
});
