const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';

export type KokoroVoiceId =
  | 'af_heart'
  | 'af_bella'
  | 'am_michael'
  | 'bm_daniel';

export type KokoroLoadState = {
  status: 'idle' | 'loading' | 'ready' | 'error';
  progress: number;
  message: string;
};

type KokoroInstance = Awaited<ReturnType<typeof createKokoro>>;

let ttsInstance: KokoroInstance | null = null;
let loadPromise: Promise<KokoroInstance> | null = null;
let loadState: KokoroLoadState = { status: 'idle', progress: 0, message: '' };
const listeners = new Set<(state: KokoroLoadState) => void>();

function setLoadState(next: KokoroLoadState) {
  loadState = next;
  listeners.forEach(fn => fn(next));
}

export function subscribeKokoroLoad(fn: (state: KokoroLoadState) => void) {
  listeners.add(fn);
  fn(loadState);
  return () => listeners.delete(fn);
}

export function getKokoroLoadState(): KokoroLoadState {
  return loadState;
}

async function detectDevice(): Promise<'webgpu' | 'wasm'> {
  if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
    try {
      const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu;
      const adapter = await gpu?.requestAdapter();
      if (adapter) return 'webgpu';
    } catch {
      /* fall through */
    }
  }
  return 'wasm';
}

async function createKokoro() {
  if (typeof window === 'undefined') {
    throw new Error('Kokoro voice engine runs in the browser only.');
  }

  const { KokoroTTS } = await import('kokoro-js');
  const device = await detectDevice();
  const dtype = device === 'webgpu' ? 'fp32' : 'q8';

  return KokoroTTS.from_pretrained(MODEL_ID, {
    dtype,
    device,
    progress_callback: data => {
      if (data.status === 'progress') {
        const pct = Math.round((data.progress ?? 0) * 100);
        setLoadState({
          status: 'loading',
          progress: pct,
          message: data.file ? `Loading ${data.file.split('/').pop()}` : 'Loading model…',
        });
      } else if (data.status === 'done') {
        setLoadState({ status: 'loading', progress: 100, message: 'Voice engine ready' });
      }
    },
  });
}

export async function loadKokoro(): Promise<KokoroInstance> {
  if (ttsInstance) return ttsInstance;
  if (loadPromise) return loadPromise;

  setLoadState({ status: 'loading', progress: 0, message: 'Preparing voice engine…' });

  loadPromise = createKokoro()
    .then(tts => {
      ttsInstance = tts;
      setLoadState({ status: 'ready', progress: 100, message: 'Voice engine ready' });
      return tts;
    })
    .catch(err => {
      loadPromise = null;
      const message = err instanceof Error ? err.message : 'Failed to load voice engine';
      setLoadState({ status: 'error', progress: 0, message });
      throw err;
    });

  return loadPromise;
}

/** Split long prose into sentence-bounded chunks for generation. */
export function chunkText(text: string, maxChars = 900): string[] {
  const sentences = text.match(/[^.!?\n]+[.!?]?[\n]?|\n+/g) ?? [text];
  const chunks: string[] = [];
  let current = '';
  const flush = () => {
    if (current.trim()) chunks.push(current.trim());
    current = '';
  };
  for (const s of sentences) {
    if (s.length > maxChars) {
      flush();
      for (let i = 0; i < s.length; i += maxChars) chunks.push(s.slice(i, i + maxChars));
      continue;
    }
    if (current.length + s.length > maxChars) flush();
    current += s;
  }
  flush();
  return chunks.length ? chunks : [text.trim()];
}

export async function generateSpeech(
  text: string,
  voice: KokoroVoiceId,
  speed = 1,
  onChunk?: (index: number, total: number) => void,
) {
  const tts = await loadKokoro();
  const { RawAudio } = await import('@huggingface/transformers');
  const chunks = chunkText(text);
  const parts: InstanceType<typeof RawAudio>[] = [];

  for (let i = 0; i < chunks.length; i++) {
    onChunk?.(i + 1, chunks.length);
    const audio = await tts.generate(chunks[i], { voice, speed });
    parts.push(audio);
  }

  if (parts.length === 1) return parts[0];

  const rate = parts[0].sampling_rate;
  const total = parts.reduce((n, p) => n + p.audio.length, 0);
  const merged = new Float32Array(total);
  let offset = 0;
  for (const part of parts) {
    merged.set(part.audio, offset);
    offset += part.audio.length;
  }
  return new RawAudio(merged, rate);
}
