import { createFileRoute } from '@tanstack/react-router';

const VOICE_ALLOW = new Set(['alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'onyx', 'nova', 'sage', 'shimmer', 'verse']);

export const Route = createFileRoute('/api/tts')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: { text?: string; voice?: string; instructions?: string };
        try {
          payload = await request.json();
        } catch {
          return new Response('Invalid JSON', { status: 400 });
        }
        const text = (payload.text ?? '').toString().trim();
        const voice = (payload.voice ?? 'alloy').toString();
        const instructions = payload.instructions ? String(payload.instructions) : undefined;

        if (!text) return new Response('Missing text', { status: 400 });
        if (!VOICE_ALLOW.has(voice)) return new Response('Invalid voice', { status: 400 });
        if (text.length > 4000) return new Response('Text too long', { status: 400 });

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response('LOVABLE_API_KEY not configured', { status: 500 });

        const upstream = await fetch('https://ai.gateway.lovable.dev/v1/audio/speech', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'openai/gpt-4o-mini-tts',
            input: text,
            voice,
            ...(instructions ? { instructions } : {}),
            stream_format: 'sse',
            response_format: 'pcm',
          }),
        });

        if (!upstream.ok || !upstream.body) {
          const body = await upstream.text().catch(() => '');
          return new Response(body || `TTS upstream error (${upstream.status})`, { status: upstream.status });
        }

        return new Response(upstream.body, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-store',
          },
        });
      },
    },
  },
});