import { createFileRoute } from '@tanstack/react-router';

const KOKORO_VOICES = new Set(['af_heart', 'af_bella', 'am_michael', 'bm_daniel']);
const OPENAI_VOICES = new Set(['shimmer', 'nova', 'onyx', 'echo', 'alloy', 'coral', 'fable', 'sage']);

async function fetchKokoroSpeech(
  baseUrl: string,
  text: string,
  voice: string,
  speed: number,
  apiKey?: string,
): Promise<Response> {
  const url = `${baseUrl.replace(/\/$/, '')}/v1/audio/speech`;
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: 'kokoro',
      input: text,
      voice,
      response_format: 'mp3',
      speed,
    }),
  });
}

async function fetchStudioSpeech(
  text: string,
  voice: string,
  apiKey: string,
): Promise<Response> {
  return fetch('https://ai.gateway.lovable.dev/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini-tts',
      input: text,
      voice,
      response_format: 'mp3',
    }),
  });
}

export const Route = createFileRoute('/api/tts')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: { text?: string; voice?: string; openAiVoice?: string; speed?: number };
        try {
          payload = await request.json();
        } catch {
          return Response.json({ error: 'Invalid request.' }, { status: 400 });
        }

        const text = (payload.text ?? '').toString().trim();
        const voice = (payload.voice ?? 'af_heart').toString();
        const openAiVoice = (payload.openAiVoice ?? 'shimmer').toString();
        const speed = typeof payload.speed === 'number' ? payload.speed : 1;

        if (!text) return Response.json({ error: 'No text provided.' }, { status: 400 });
        if (text.length > 4000) return Response.json({ error: 'Text too long.' }, { status: 400 });
        if (!KOKORO_VOICES.has(voice)) {
          return Response.json({ error: 'Unknown voice.' }, { status: 400 });
        }

        const kokoroUrl = process.env.KOKORO_API_URL;
        const kokoroKey = process.env.KOKORO_API_KEY;
        const lovableKey = process.env.LOVABLE_API_KEY;

        // 1. Kokoro server API — model lives on server, client receives audio only
        if (kokoroUrl) {
          try {
            const upstream = await fetchKokoroSpeech(kokoroUrl, text, voice, speed, kokoroKey);
            if (upstream.ok && upstream.body) {
              return new Response(upstream.body, {
                headers: {
                  'Content-Type': upstream.headers.get('Content-Type') || 'audio/mpeg',
                  'X-TTS-Engine': 'kokoro',
                  'Cache-Control': 'no-store',
                },
              });
            }
            const errBody = await upstream.text().catch(() => '');
            console.warn('Kokoro API error:', upstream.status, errBody);
          } catch (err) {
            console.warn('Kokoro API unreachable:', err);
          }
        }

        // 2. Studio fallback — still server-side, no client download
        if (lovableKey && OPENAI_VOICES.has(openAiVoice)) {
          try {
            const upstream = await fetchStudioSpeech(text, openAiVoice, lovableKey);
            if (upstream.ok && upstream.body) {
              return new Response(upstream.body, {
                headers: {
                  'Content-Type': upstream.headers.get('Content-Type') || 'audio/mpeg',
                  'X-TTS-Engine': 'studio',
                  'Cache-Control': 'no-store',
                },
              });
            }
          } catch (err) {
            console.warn('Studio TTS unreachable:', err);
          }
        }

        return Response.json(
          {
            error: kokoroUrl
              ? 'Voice server is temporarily unavailable. Please try again.'
              : 'Human voices are not configured yet. Set KOKORO_API_URL to a Kokoro FastAPI server (see README).',
            code: 'TTS_UNAVAILABLE',
          },
          { status: 503 },
        );
      },
    },
  },
});
