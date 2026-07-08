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
  if (loadState !== 'ready') loadState = 'loading';
  for (const listener of progressListeners) {
    try {
      listener(progress);
    } catch {
      /* listener cleanup */
    }
  }
}

/** Transformers.js v3 — progress uses status: initiate | download | progress | done */
function handleLoadProgress(data: Record<string, unknown>) {
  const status = data.status as string | undefined;

  if (status === 'initiate') {
    const file = (data.file as string) || 'model';
    notifyProgress({ loaded: 0, total: 0, percent: 0, status: `Loading ${file}…` });
    return;
  }

  if (status === 'download') {
    const file = (data.file as string) || 'voice model';
    notifyProgress({ loaded: 0, total: 0, percent: 1, status: `Downloading ${file}…` });
    return;
  }

  if (status === 'progress') {
    const loaded = (data.loaded as number) || 0;
    const total = (data.total as number) || 0;
    const percent =
      typeof data.progress === 'number'
        ? Math.round(data.progress)
        : total > 0
          ? Math.min(100, Math.round((loaded / total) * 100))
          : 0;
    notifyProgress({
      loaded,
      total,
      percent,
      status:
        percent < 100
          ? `Preparing the voice — ${percent}%`
          : 'Voice ready — preparing speech…',
    });
    return;
  }

  if (status === 'done') {
    notifyProgress({ loaded: 0, total: 0, percent: 100, status: 'Voice ready — preparing speech…' });
  }
}

export function subscribeKokoroLoadProgress(
  listener: (progress: KokoroLoadProgress) => void,
): () => void {
  progressListeners.add(listener);
  if (lastProgress && loadState === 'loading') listener(lastProgress);
  return () => progressListeners.delete(listener);
}

export function getKokoroLoadState(): 'idle' | 'loading' | 'ready' {
  return loadState;
}

export async function getKokoroTts(
  onProgress?: (progress: KokoroLoadProgress) => void,
): Promise<KokoroInstance> {
  if (typeof window === 'undefined') {
    throw new Error('Kokoro runs in the browser only.');
  }

  let unsubscribe: (() => void) | undefined;
  if (onProgress) unsubscribe = subscribeKokoroLoadProgress(onProgress);

  if (!loadPromise) {
    loadState = 'loading';
    notifyProgress({
      loaded: 0,
      total: 0,
      percent: 0,
      status: 'Preparing the voice — one-time download.',
    });

    loadPromise = (async () => {
      notifyProgress({
        loaded: 0,
        total: 0,
        percent: 2,
        status: 'Loading voice engine…',
      });

      const { KokoroTTS, env } = await import('kokoro-js');

      notifyProgress({
        loaded: 0,
        total: 0,
        percent: 5,
        status: 'Preparing the voice — one-time download.',
      });

      const wasm = env.backends?.onnx?.wasm;
      if (wasm) {
        wasm.proxy = true;
        wasm.numThreads = Math.min(Math.max(navigator.hardwareConcurrency || 1, 1), 4);
      }

      const instance = await KokoroTTS.from_pretrained(MODEL_ID, {
        dtype: 'q8',
        device: 'wasm',
        progress_callback: data => handleLoadProgress(data as Record<string, unknown>),
      });

      try {
        await instance.generate('Ready.', { voice: 'af_heart', speed: 1 });
      } catch {
        /* warmup best-effort */
      }

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
  if (signal?.aborted) throw new DOMException('Cancelled.', 'AbortError');

  const tts = await getKokoroTts();
  if (signal?.aborted) throw new DOMException('Cancelled.', 'AbortError');

  const raw = await tts.generate(text, { voice, speed });
  const blob = raw.toBlob();
  if (!blob.size) throw new Error('Voice generation returned empty audio.');
  return blob;
}

export function resetKokoroEngine() {
  loadPromise = null;
  loadState = 'idle';
  lastProgress = null;
}
