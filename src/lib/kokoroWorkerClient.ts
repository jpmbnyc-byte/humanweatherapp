import type { KokoroVoiceId } from './voices';

export type KokoroLoadProgress = {
  loaded: number;
  total: number;
  percent: number;
  status: string;
};

type WorkerOut =
  | { type: 'progress'; loaded: number; total: number; percent: number; status: string }
  | { type: 'device'; device: 'webgpu' | 'wasm' }
  | { type: 'ready'; device: 'webgpu' | 'wasm' }
  | { type: 'audio'; id: number; buffer: ArrayBuffer }
  | { type: 'error'; id?: number; message: string };

let worker: Worker | null = null;
let loadState: 'idle' | 'loading' | 'ready' = 'idle';
let initPromise: Promise<void> | null = null;
let lastProgress: KokoroLoadProgress | null = null;
let initReject: ((err: Error) => void) | null = null;

const progressListeners = new Set<(progress: KokoroLoadProgress) => void>();
const pending = new Map<number, { resolve: (blob: Blob) => void; reject: (err: Error) => void }>();
let nextId = 1;

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

function handleWorkerMessage(event: MessageEvent<WorkerOut>) {
  const msg = event.data;
  switch (msg.type) {
    case 'progress':
      notifyProgress({
        loaded: msg.loaded,
        total: msg.total,
        percent: msg.percent,
        status: msg.status,
      });
      break;
    case 'ready':
      loadState = 'ready';
      initReject = null;
      break;
    case 'audio': {
      const entry = pending.get(msg.id);
      pending.delete(msg.id);
      entry?.resolve(new Blob([msg.buffer], { type: 'audio/wav' }));
      break;
    }
    case 'error':
      if (msg.id !== undefined) {
        const entry = pending.get(msg.id);
        pending.delete(msg.id);
        entry?.reject(new Error(msg.message));
      } else {
        loadState = 'idle';
        initPromise = null;
        lastProgress = null;
        initReject?.(new Error(msg.message));
        initReject = null;
      }
      break;
    default:
      break;
  }
}

function spawnWorker(): Worker {
  const w = new Worker(new URL('../workers/kokoro.worker.ts', import.meta.url), { type: 'module' });
  w.addEventListener('message', handleWorkerMessage);
  w.addEventListener('error', ev => {
    loadState = 'idle';
    initPromise = null;
    lastProgress = null;
    initReject?.(new Error(ev.message || 'Voice worker failed.'));
    initReject = null;
    for (const [id, entry] of pending) {
      entry.reject(new Error('Voice worker failed.'));
      pending.delete(id);
    }
  });
  return w;
}

function getWorker(): Worker {
  if (!worker) worker = spawnWorker();
  return worker;
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

export async function ensureKokoroWorker(
  onProgress?: (progress: KokoroLoadProgress) => void,
): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('Kokoro runs in the browser only.');
  }

  let unsubscribe: (() => void) | undefined;
  if (onProgress) unsubscribe = subscribeKokoroLoadProgress(onProgress);

  if (loadState === 'ready') {
    unsubscribe?.();
    return;
  }

  if (!initPromise) {
    loadState = 'loading';
    initPromise = new Promise<void>((resolve, reject) => {
      initReject = reject;
      const onReady = (event: MessageEvent<WorkerOut>) => {
        if (event.data.type === 'ready') {
          getWorker().removeEventListener('message', onReady);
          initReject = null;
          resolve();
        }
      };
      getWorker().addEventListener('message', onReady);
      getWorker().postMessage({ type: 'init' });
    }).catch(err => {
      initPromise = null;
      loadState = 'idle';
      lastProgress = null;
      throw err;
    });
  }

  try {
    await initPromise;
  } finally {
    unsubscribe?.();
  }
}

export function generateKokoroSpeechInWorker(
  text: string,
  voice: KokoroVoiceId,
  speed: number,
  signal?: AbortSignal,
): Promise<Blob> {
  if (signal?.aborted) return Promise.reject(new DOMException('Cancelled.', 'AbortError'));

  const id = nextId++;
  return new Promise<Blob>((resolve, reject) => {
    const onAbort = () => {
      pending.delete(id);
      reject(new DOMException('Cancelled.', 'AbortError'));
    };

    if (signal) signal.addEventListener('abort', onAbort, { once: true });

    pending.set(id, {
      resolve: blob => {
        signal?.removeEventListener('abort', onAbort);
        resolve(blob);
      },
      reject: err => {
        signal?.removeEventListener('abort', onAbort);
        reject(err);
      },
    });

    getWorker().postMessage({ type: 'generate', id, text, voice, speed });
  });
}

export function resetKokoroWorker() {
  if (worker) {
    worker.postMessage({ type: 'reset' });
    worker.terminate();
    worker = null;
  }
  initPromise = null;
  loadState = 'idle';
  lastProgress = null;
  initReject = null;
  for (const [id, entry] of pending) {
    entry.reject(new Error('Voice engine reset.'));
    pending.delete(id);
  }
}
