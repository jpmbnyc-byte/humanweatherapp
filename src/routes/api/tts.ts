import { createFileRoute } from '@tanstack/react-router';

const KOKORO_VOICES = new Set(['af_heart', 'af_bella', 'am_michael', 'bm_daniel']);
const OPENAI_VOICES = new Set(['shimmer', 'nova', 'onyx', 'echo', 'alloy', 'coral', 'fable', 'sage']);

const VOICE_INSTRUCTIONS: Record<string, string> = {
  shimmer:
    'Speak as a warm, grounded woman. Unhurried, gentle, with soft breath and a reassuring cadence.',
  nova:
    'Speak as a gentle, airy woman with a light, luminous tone. Slow, tender, contemplative pacing.',
  onyx:
    'Speak as a deep, anchored man with a resonant baritone. Slow, deliberate, monk-like stillness.',
  echo:
    'Speak as a resonant, measured man — thoughtful narrator with clear diction and gentle warmth.',
};

function getEnv(key: string): string | undefined {
  return process.env[key];
}

async function fetchKokoroSpeech(
  baseUrl: string,
  text: string,
  voice: string,
  speed: number,
  apiKey?: string,
): Promise<Response> {
  return fetch(`${baseUrl.replace(/\/$/, '')}/v1/audio/speech`, {
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
  const instructions = VOICE_INSTRUCTIONS[voice];
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
      ...(instructions ? { instructions } : {}),
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

        const lovableKey = getEnv('LOVABLE_API_KEY');
        const kokoroUrl = getEnv('KOKORO_API_URL');
        const kokoroKey = getEnv('KOKORO_API_KEY');

        // 1. Lovable studio TTS — works on deployed Lovable apps without extra setup
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
            const errBody = await upstream.text().catch(() => '');
            console.warn('Studio TTS error:', upstream.status, errBody);
          } catch (err) {
            console.warn('Studio TTS unreachable:', err);
          }
        }

        // 2. Optional Kokoro server when KOKORO_API_URL is configured
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

        return Response.json(
          {
            error: lovableKey || kokoroUrl
              ? 'Voice service is temporarily unavailable. Please try again in a moment.'
              : 'Human voice narration requires deployment with Lovable AI enabled, or a Kokoro server URL configured.',
            code: 'TTS_UNAVAILABLE',
            fallback: 'browser',
          },
          { status: 503 },
        );
      },
    },
  },
});
