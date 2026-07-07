/** Maps Tender personas to Kokoro voice IDs — KIKI_VOICES per HW_HARNESS §6. */
export type KokoroVoiceId = 'af_heart' | 'af_nicole' | 'am_michael' | 'bm_george';

export type TenderVoiceId = 'joan' | 'grace' | 'peter' | 'daniel';

export interface TenderVoiceProfile {
  id: TenderVoiceId;
  name: string;
  descriptor: string;
  kokoroVoice: KokoroVoiceId;
  speed: number;
}

/** KIKI_VOICES — swap IDs after in-app audition; config-only change. */
export const TENDER_VOICES: TenderVoiceProfile[] = [
  {
    id: 'joan',
    name: 'Joan',
    descriptor: 'Warm · grounded',
    kokoroVoice: 'af_heart',
    speed: 0.88,
  },
  {
    id: 'grace',
    name: 'Grace',
    descriptor: 'Gentle · airy',
    kokoroVoice: 'af_nicole',
    speed: 0.85,
  },
  {
    id: 'peter',
    name: 'Peter',
    descriptor: 'Deep · anchored',
    kokoroVoice: 'bm_george',
    speed: 0.92,
  },
  {
    id: 'daniel',
    name: 'Daniel',
    descriptor: 'Resonant · measured',
    kokoroVoice: 'am_michael',
    speed: 0.9,
  },
];

export function getVoiceProfile(id: TenderVoiceId): TenderVoiceProfile {
  return TENDER_VOICES.find(v => v.id === id) ?? TENDER_VOICES[0];
}

/** Split prose into sentences for pipelined Kokoro playback (§6). */
export function splitSentences(text: string): string[] {
  const parts = text.match(/[^.!?\n]+[.!?]+|\n+/g) ?? [text];
  const sentences = parts.map(s => s.trim()).filter(Boolean);
  return sentences.length ? sentences : [text.trim()];
}
