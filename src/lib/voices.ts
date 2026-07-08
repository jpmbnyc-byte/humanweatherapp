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

export const TENDER_VOICES: TenderVoiceProfile[] = [
  { id: 'joan', name: 'Joan', descriptor: 'Warm · grounded', kokoroVoice: 'af_heart', speed: 0.88 },
  { id: 'grace', name: 'Grace', descriptor: 'Gentle · airy', kokoroVoice: 'af_nicole', speed: 0.85 },
  { id: 'peter', name: 'Peter', descriptor: 'Deep · anchored', kokoroVoice: 'bm_george', speed: 0.92 },
  { id: 'daniel', name: 'Daniel', descriptor: 'Resonant · measured', kokoroVoice: 'am_michael', speed: 0.9 },
];

export function getVoiceProfile(id: TenderVoiceId): TenderVoiceProfile {
  return TENDER_VOICES.find(v => v.id === id) ?? TENDER_VOICES[0];
}

function splitSentences(text: string): string[] {
  const parts = text.match(/[^.!?\n]+[.!?]+|\n+/g) ?? [text];
  const sentences = parts.map(s => s.trim()).filter(Boolean);
  return sentences.length ? sentences : [text.trim()];
}

/** Merge sentences into speak chunks — fewer round-trips, smoother flow. */
export function splitIntoSpeakChunks(text: string, maxChars = 320): string[] {
  const sentences = splitSentences(text);
  const chunks: string[] = [];
  let current = '';
  for (const s of sentences) {
    if (s.length > maxChars) {
      if (current.trim()) chunks.push(current.trim());
      current = '';
      for (let i = 0; i < s.length; i += maxChars) chunks.push(s.slice(i, i + maxChars));
      continue;
    }
    if (current.length + s.length + 1 > maxChars && current.trim()) {
      chunks.push(current.trim());
      current = s;
    } else {
      current = current ? `${current} ${s}` : s;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length ? chunks : [text.trim()];
}

/** Warm the Kokoro engine when The Tender opens — never on initial app paint. */
export function warmVoiceEngine(): void {
  if (typeof window === 'undefined') return;
  const run = () => void import('./kokoro').then(m => m.getKokoroTts()).catch(() => {});
  if (typeof requestIdleCallback !== 'undefined') requestIdleCallback(run, { timeout: 500 });
  else setTimeout(run, 100);
}

export { subscribeKokoroLoadProgress, getKokoroLoadState } from './kokoro';
export type { KokoroLoadProgress } from './kokoro';
