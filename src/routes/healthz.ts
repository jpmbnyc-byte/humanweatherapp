import { createFileRoute } from '@tanstack/react-router';

/** Lightweight liveness probe — no SSR, no app imports. */
export const Route = createFileRoute('/healthz')({
  server: {
    handlers: {
      GET: () =>
        new Response('ok', {
          status: 200,
          headers: { 'content-type': 'text/plain; charset=utf-8' },
        }),
    },
  },
});
