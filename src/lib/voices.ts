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
