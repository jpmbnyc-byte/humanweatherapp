/** Maps Tender personas to Kokoro voice IDs (OpenAI-compatible API). */
export type KokoroVoiceId = 'af_heart' | 'af_bella' | 'am_michael' | 'bm_daniel';

export type TenderVoiceId = 'joan' | 'grace' | 'peter' | 'daniel';

export interface TenderVoiceProfile {
  id: TenderVoiceId;
  name: string;
  descriptor: string;
  kokoroVoice: KokoroVoiceId;
  /** OpenAI TTS fallback when Kokoro API is unavailable */
  openAiVoice: 'shimmer' | 'nova' | 'onyx' | 'echo';
  speed: number;
}

export const TENDER_VOICES: TenderVoiceProfile[] = [
  {
    id: 'joan',
    name: 'Joan',
    descriptor: 'Warm · grounded',
    kokoroVoice: 'af_heart',
    openAiVoice: 'shimmer',
    speed: 0.92,
  },
  {
    id: 'grace',
    name: 'Grace',
    descriptor: 'Gentle · airy',
    kokoroVoice: 'af_bella',
    openAiVoice: 'nova',
    speed: 0.88,
  },
  {
    id: 'peter',
    name: 'Peter',
    descriptor: 'Deep · anchored',
    kokoroVoice: 'am_michael',
    openAiVoice: 'onyx',
    speed: 0.85,
  },
  {
    id: 'daniel',
    name: 'Daniel',
    descriptor: 'Resonant · measured',
    kokoroVoice: 'bm_daniel',
    openAiVoice: 'echo',
    speed: 0.9,
  },
];

export function getVoiceProfile(id: TenderVoiceId): TenderVoiceProfile {
  return TENDER_VOICES.find(v => v.id === id) ?? TENDER_VOICES[0];
}

/** Split long prose at sentence boundaries for API limits. */
export function chunkText(text: string, maxChars = 900): string[] {
  const sentences = text.match(/[^.!?\n]+[.!?]?[\n]?|\n+/g) ?? [text];
  const chunks: string[] = [];
  let current = '';
  const flush = () => {
    if (current.trim()) chunks.push(current.trim());
    current = '';
  };
  for (const s of sentences) {
    if (s.length > maxChars) {
      flush();
      for (let i = 0; i < s.length; i += maxChars) chunks.push(s.slice(i, i + maxChars));
      continue;
    }
    if (current.length + s.length > maxChars) flush();
    current += s;
  }
  flush();
  return chunks.length ? chunks : [text.trim()];
}

export type TtsEngine = 'kokoro' | 'studio' | 'unavailable';

export interface TtsApiResult {
  ok: boolean;
  engine?: TtsEngine;
  blob?: Blob;
  error?: string;
}

export async function fetchNarrationAudio(
  text: string,
  profile: TenderVoiceProfile,
  onProgress?: (message: string) => void,
): Promise<TtsApiResult> {
  const chunks = chunkText(text);
  const blobs: Blob[] = [];

  for (let i = 0; i < chunks.length; i++) {
    if (chunks.length > 1) {
      onProgress?.(`Generating part ${i + 1} of ${chunks.length}…`);
    } else {
      onProgress?.('Generating human voice on the server…');
    }

    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: chunks[i],
        voice: profile.kokoroVoice,
        openAiVoice: profile.openAiVoice,
        speed: profile.speed,
      }),
    });

    if (!res.ok) {
      let message = 'Voice service unavailable.';
      try {
        const json = await res.json();
        message = json.error ?? json.message ?? message;
      } catch {
        message = (await res.text().catch(() => '')) || message;
      }
      return { ok: false, error: message };
    }

    const engine = (res.headers.get('X-TTS-Engine') as TtsEngine | null) ?? 'kokoro';
    blobs.push(await res.blob());
    if (i === 0) {
      onProgress?.(
        engine === 'kokoro'
          ? 'Human Kokoro voice ready — starting playback…'
          : 'Studio voice ready — starting playback…',
      );
    }
  }

  const blob = blobs.length === 1
    ? blobs[0]
    : new Blob(blobs, { type: blobs[0]?.type || 'audio/mpeg' });

  const engine = (blobs.length ? 'kokoro' : 'unavailable') as TtsEngine;
  return { ok: true, engine, blob };
}
