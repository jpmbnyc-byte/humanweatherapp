import type { KokoroVoiceId } from './voices';

const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';

type KokoroModule = typeof import('kokoro-js');
type KokoroInstance = Awaited<ReturnType<KokoroModule['KokoroTTS']['from_pretrained']>>;

let loadPromise: Promise<KokoroInstance> | null = null;

export type KokoroLoadProgress = {
  loaded: number;
  total: number;
  percent: number;
  status: string;
};

/** Lazy singleton — Kokoro loads only on first Listen tap, never on page open. */
export async function getKokoroTts(
  onProgress?: (progress: KokoroLoadProgress) => void,
): Promise<KokoroInstance> {
  if (typeof window === 'undefined') {
    throw new Error('Kokoro runs in the browser only.');
  }

  if (!loadPromise) {
    loadPromise = (async () => {
      const { KokoroTTS } = await import('kokoro-js');

      onProgress?.({
        loaded: 0,
        total: 1,
        percent: 0,
        status: 'Preparing the voice — one-time download.',
      });

      return KokoroTTS.from_pretrained(MODEL_ID, {
        dtype: 'q8',
        device: 'wasm',
        progress_callback: data => {
          if (!data.total) return;
          const percent = Math.min(100, Math.round((data.loaded / data.total) * 100));
          onProgress?.({
            loaded: data.loaded,
            total: data.total,
            percent,
            status:
              percent < 100
                ? `Preparing the voice — ${percent}%`
                : 'Voice ready — preparing speech…',
          });
        },
      });
    })().catch(err => {
      loadPromise = null;
      throw err;
    });
  }

  return loadPromise;
}

export async function generateKokoroSpeech(
  text: string,
  voice: KokoroVoiceId,
  speed: number,
  signal?: AbortSignal,
): Promise<Blob> {
  if (signal?.aborted) {
    throw new DOMException('Cancelled.', 'AbortError');
  }

  const tts = await getKokoroTts();
  if (signal?.aborted) {
    throw new DOMException('Cancelled.', 'AbortError');
  }

  const raw = await tts.generate(text, { voice, speed });
  const blob = raw.toBlob();
  if (!blob.size) {
    throw new Error('Voice generation returned empty audio.');
  }
  return blob;
}

export function resetKokoroEngine() {
  loadPromise = null;
}
