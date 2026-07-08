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
  error?: boolean;
};

function notifyProgress(progress: KokoroLoadProgress) {
  lastProgress = progress;
  if (!progress.error && loadState !== 'ready') loadState = 'loading';
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
    notifyProgress({ loaded: 0, total: 0, percent: 3, status: `Loading ${file}…` });
    return;
  }

  if (status === 'download') {
    const file = (data.file as string) || 'voice model';
    notifyProgress({ loaded: 0, total: 0, percent: 8, status: `Downloading ${file}…` });
    return;
  }

  if (status === 'progress') {
    const loaded = (data.loaded as number) || 0;
    const total = (data.total as number) || 0;
    const percent =
      typeof data.progress === 'number'
        ? Math.min(99, Math.round(data.progress))
        : total > 0
          ? Math.min(99, Math.round((loaded / total) * 100))
          : 10;
    notifyProgress({
      loaded,
      total,
      percent,
      status: `Preparing the voice — ${percent}%`,
    });
    return;
  }

  if (status === 'done') {
    notifyProgress({ loaded: 0, total: 0, percent: 99, status: 'Voice ready — preparing speech…' });
  }
}

function configureOnnxEnv(env: KokoroModule['env']) {
  const wasm = env.backends?.onnx?.wasm;
  if (!wasm) return;
  // Never override numThreads — ORT auto-sets 1 without crossOriginIsolated.
  // Forcing >1 without COEP breaks SharedArrayBuffer and silently kills load.
  wasm.proxy = false;
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
      percent: 1,
      status: 'Starting voice engine…',
    });

    loadPromise = (async () => {
      notifyProgress({ loaded: 0, total: 0, percent: 2, status: 'Loading voice library…' });
      const { KokoroTTS, env } = await import('kokoro-js');
      configureOnnxEnv(env);

      notifyProgress({ loaded: 0, total: 0, percent: 5, status: 'Connecting to voice model…' });

      const instance = await KokoroTTS.from_pretrained(MODEL_ID, {
        dtype: 'q8',
        device: 'wasm',
        progress_callback: data => handleLoadProgress(data as Record<string, unknown>),
      });

      loadState = 'ready';
      notifyProgress({ loaded: 0, total: 0, percent: 100, status: 'Voice ready' });
      return instance;
    })().catch(err => {
      loadPromise = null;
      loadState = 'idle';
      const message = err instanceof Error ? err.message : String(err);
      notifyProgress({
        loaded: 0,
        total: 0,
        percent: 0,
        status: `Voice load failed — ${message}`,
        error: true,
      });
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
