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
  if (!loadPromise) {
    loadPromise = (async () => {
      const { KokoroTTS } = await import('kokoro-js');

      onProgress?.({
        loaded: 0,
        total: 1,
        percent: 0,
        status: 'Preparing the voice — one-time download.',
      });

      // WASM/q8 is the most reliable path across browsers and VMs.
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
  onProgress?: (progress: KokoroLoadProgress) => void,
  signal?: AbortSignal,
): Promise<Blob> {
  if (signal?.aborted) {
    throw new DOMException('Cancelled.', 'AbortError');
  }

  const tts = await getKokoroTts(onProgress);
  if (signal?.aborted) {
    throw new DOMException('Cancelled.', 'AbortError');
  }

  onProgress?.({
    loaded: 1,
    total: 1,
    percent: 100,
    status: 'Generating human voice…',
  });

  const raw = await tts.generate(text, { voice, speed });
  const blob = raw.toBlob();
  if (!blob.size) {
    throw new Error('Voice generation returned empty audio.');
  }
  return blob;
}

/** Reset cached engine (e.g. after a failed load). */
export function resetKokoroEngine() {
  loadPromise = null;
}
