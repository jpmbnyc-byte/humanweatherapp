import type { KokoroVoiceId } from './voices';

const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';

type KokoroModule = typeof import('kokoro-js');
type KokoroInstance = Awaited<ReturnType<KokoroModule['KokoroTTS']['from_pretrained']>>;

let loadPromise: Promise<KokoroInstance> | null = null;
let loadState: 'idle' | 'loading' | 'ready' = 'idle';
let lastProgress: KokoroLoadProgress | null = null;

const progressListeners = new Set<(progress: KokoroLoadProgress) => void>();

export type KokoroLoadProgress = {
  loaded: number;
  total: number;
  percent: number;
  status: string;
};

function notifyProgress(progress: KokoroLoadProgress) {
  lastProgress = progress;
  for (const listener of progressListeners) {
    try {
      listener(progress);
    } catch {
      /* listener cleanup */
    }
  }
}

/** Subscribe to model download progress — includes in-flight warm loads. */
export function subscribeKokoroLoadProgress(
  listener: (progress: KokoroLoadProgress) => void,
): () => void {
  progressListeners.add(listener);
  if (lastProgress && loadState === 'loading') {
    listener(lastProgress);
  }
  return () => progressListeners.delete(listener);
}

export function getKokoroLoadState(): 'idle' | 'loading' | 'ready' {
  return loadState;
}

/** Lazy singleton — Kokoro loads on first Listen tap or background warm. */
export async function getKokoroTts(
  onProgress?: (progress: KokoroLoadProgress) => void,
): Promise<KokoroInstance> {
  if (typeof window === 'undefined') {
    throw new Error('Kokoro runs in the browser only.');
  }

  let unsubscribe: (() => void) | undefined;
  if (onProgress) {
    unsubscribe = subscribeKokoroLoadProgress(onProgress);
  }

  if (!loadPromise) {
    loadState = 'loading';
    loadPromise = (async () => {
      const { KokoroTTS } = await import('kokoro-js');

      notifyProgress({
        loaded: 0,
        total: 1,
        percent: 0,
        status: 'Preparing the voice — one-time download.',
      });

      const instance = await KokoroTTS.from_pretrained(MODEL_ID, {
        dtype: 'q8',
        device: 'wasm',
        progress_callback: data => {
          if (!data.total) return;
          const percent = Math.min(100, Math.round((data.loaded / data.total) * 100));
          notifyProgress({
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

      loadState = 'ready';
      return instance;
    })().catch(err => {
      loadPromise = null;
      loadState = 'idle';
      lastProgress = null;
      throw err;
    });
  }

  try {
    return await loadPromise;
  } finally {
    unsubscribe?.();
  }
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
  loadState = 'idle';
  lastProgress = null;
}
