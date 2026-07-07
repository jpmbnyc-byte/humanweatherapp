import type { KokoroTTS } from 'kokoro-js';

export type KeeperId = 'joan' | 'daniel' | 'grace' | 'peter';

export const KIKI_VOICES: Record<
  KeeperId,
  { id: string; speed: number; name: string }
> = {
  joan: { id: 'af_heart', speed: 0.88, name: 'Joan' },
  daniel: { id: 'am_michael', speed: 0.9, name: 'Daniel' },
  grace: { id: 'af_nicole', speed: 0.85, name: 'Grace' },
  peter: { id: 'bm_george', speed: 0.92, name: 'Peter' },
};

const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';

let ttsInstance: KokoroTTS | null = null;
let loadPromise: Promise<KokoroTTS> | null = null;

export async function loadKokoro(): Promise<KokoroTTS> {
  if (ttsInstance) return ttsInstance;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const { KokoroTTS } = await import('kokoro-js');
    const device =
      typeof navigator !== 'undefined' && 'gpu' in navigator ? 'wasm' : 'wasm';
    ttsInstance = await KokoroTTS.from_pretrained(MODEL_ID, {
      dtype: 'q8',
      device,
    });
    return ttsInstance;
  })();

  return loadPromise;
}

export function getKokoroInstance(): KokoroTTS | null {
  return ttsInstance;
}
