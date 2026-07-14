import { createFileRoute } from '@tanstack/react-router';
import { constructStripeWebhookEvent } from '@/lib/stripe.server';

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
            console.info('[stripe] checkout.session.completed', session.id, session.payment_status);
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
