import { KokoroTTS, env } from 'kokoro-js';

const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';

type InMsg =
  | { type: 'init' }
  | { type: 'generate'; id: number; text: string; voice: string; speed: number }
  | { type: 'reset' };

type OutProgress = {
  type: 'progress';
  loaded: number;
  total: number;
  percent: number;
  status: string;
};

type OutMsg =
  | OutProgress
  | { type: 'device'; device: 'webgpu' | 'wasm' }
  | { type: 'ready'; device: 'webgpu' | 'wasm' }
  | { type: 'audio'; id: number; buffer: ArrayBuffer }
  | { type: 'error'; id?: number; message: string };

let tts: KokoroTTS | null = null;
let activeDevice: 'webgpu' | 'wasm' = 'wasm';
let initPromise: Promise<'webgpu' | 'wasm'> | null = null;
let generateChain = Promise.resolve();

function post(msg: OutMsg, transfer?: Transferable[]) {
  if (transfer?.length) self.postMessage(msg, transfer);
  else self.postMessage(msg);
}

function configureWasmThreads() {
  const wasm = env.backends?.onnx?.wasm;
  if (!wasm) return;
  const cores = navigator.hardwareConcurrency || 4;
  wasm.numThreads = Math.min(Math.max(cores, 1), 8);
}

async function probeWebGpu(): Promise<boolean> {
  try {
    if (!('gpu' in navigator) || !navigator.gpu) return false;
    const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
    if (!adapter) return false;
    const device = await adapter.requestDevice();
    device.destroy();
    return true;
  } catch {
    return false;
  }
}

async function loadModel(device: 'webgpu' | 'wasm'): Promise<KokoroTTS> {
  return KokoroTTS.from_pretrained(MODEL_ID, {
    dtype: 'q8',
    device,
    progress_callback: data => {
      if (!data.total) return;
      const percent = Math.min(100, Math.round((data.loaded / data.total) * 100));
      post({
        type: 'progress',
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
}

async function ensureInit(): Promise<'webgpu' | 'wasm'> {
  if (tts) return activeDevice;
  if (!initPromise) {
    initPromise = (async () => {
      configureWasmThreads();

      post({
        type: 'progress',
        loaded: 0,
        total: 1,
        percent: 0,
        status: 'Preparing the voice — one-time download.',
      });

      let device: 'webgpu' | 'wasm' = (await probeWebGpu()) ? 'webgpu' : 'wasm';
      post({ type: 'device', device });

      try {
        tts = await loadModel(device);
      } catch (webgpuErr) {
        if (device !== 'webgpu') throw webgpuErr;
        device = 'wasm';
        post({ type: 'device', device });
        tts = await loadModel('wasm');
      }

      // Warm shaders / WASM JIT off the critical Listen path
      try {
        await tts.generate('Ready.', { voice: 'af_heart', speed: 1 });
      } catch {
        /* warmup is best-effort */
      }

      post({ type: 'ready', device });
      activeDevice = device;
      return device;
    })().catch(err => {
      initPromise = null;
      tts = null;
      throw err;
    });
  }
  return initPromise;
}

self.onmessage = (event: MessageEvent<InMsg>) => {
  const msg = event.data;

  if (msg.type === 'init') {
    void ensureInit().catch(err => post({ type: 'error', message: String(err) }));
    return;
  }

  if (msg.type === 'reset') {
    tts = null;
    activeDevice = 'wasm';
    initPromise = null;
    generateChain = Promise.resolve();
    return;
  }

  if (msg.type === 'generate') {
    const { id, text, voice, speed } = msg;
    generateChain = generateChain.then(async () => {
      try {
        await ensureInit();
        const raw = await tts!.generate(text, { voice, speed });
        const blob = raw.toBlob();
        if (!blob.size) throw new Error('Voice generation returned empty audio.');
        const buffer = await blob.arrayBuffer();
        post({ type: 'audio', id, buffer }, [buffer]);
      } catch (err) {
        post({ type: 'error', id, message: err instanceof Error ? err.message : String(err) });
      }
    });
  }
};

export {};
