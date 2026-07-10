import { idbGet, idbSet } from './idb';
import { playBlob, stopAudioPlayback, unlockAudioPlayback } from './audioPlayback';

const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';
const VOICE_KEY = 'hw-station-voice';
const PACE_KEY = 'hw-pace';

export const KOKORO_VOICES = {
  joan: { id: 'af_heart' as const, label: 'Joan', speed: 0.88, tier: 'PREMIUM' as const },
  daniel: { id: 'am_michael' as const, label: 'Daniel', speed: 0.9, tier: 'ENHANCED' as const },
  grace: { id: 'af_nicole' as const, label: 'Grace', speed: 0.85, tier: 'ENHANCED' as const },
  peter: { id: 'bm_george' as const, label: 'Peter', speed: 0.92, tier: 'STANDARD' as const },
  samantha: { id: 'af_bella' as const, label: 'Samantha', speed: 0.88, tier: 'STANDARD' as const },
  river: { id: 'af_river' as const, label: 'River', speed: 0.88, tier: 'STANDARD' as const },
  sky: { id: 'af_sky' as const, label: 'Sky', speed: 0.88, tier: 'STANDARD' as const },
};

export type KokoroVoiceKey = keyof typeof KOKORO_VOICES;

export type KokoroLoadState = 'idle' | 'loading' | 'ready' | 'error';

type KokoroTTSInstance = {
  generate: (
    text: string,
    opts: { voice: string; speed?: number },
  ) => Promise<{ toBlob: () => Blob }>;
};

let _tts: KokoroTTSInstance | null = null;
let _loadPromise: Promise<KokoroTTSInstance> | null = null;
let _loadState: KokoroLoadState = 'idle';
let _loadError: string | null = null;
let _activeVoiceKey: KokoroVoiceKey = 'joan';
let _speakToken = 0;
let _onLoadState: ((state: KokoroLoadState, detail?: string) => void) | null = null;

export function onKokoroLoadState(cb: (state: KokoroLoadState, detail?: string) => void): () => void {
  _onLoadState = cb;
  cb(_loadState, _loadError ?? undefined);
  return () => {
    if (_onLoadState === cb) _onLoadState = null;
  };
}

function setLoadState(state: KokoroLoadState, detail?: string) {
  _loadState = state;
  _loadError = detail ?? null;
  _onLoadState?.(state, detail);
}

function splitSentences(text: string): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];
  const parts = normalized.match(/[^.!?]+[.!?]+["']?|[^.!?]+$/g);
  return parts?.map(s => s.trim()).filter(Boolean) ?? [normalized];
}

export function getKokoroLoadState(): KokoroLoadState {
  return _loadState;
}

export async function loadKokoroEngine(
  onProgress?: (progress: number) => void,
): Promise<KokoroTTSInstance> {
  if (_tts) return _tts;
  if (_loadPromise) return _loadPromise;

  setLoadState('loading');
  unlockAudioPlayback();

  _loadPromise = (async () => {
    try {
      const { KokoroTTS } = await import('kokoro-js');
      const tts = await KokoroTTS.from_pretrained(MODEL_ID, {
        dtype: 'q8',
        device: 'wasm',
        progress_callback: info => {
          if (info.status === 'progress' && typeof info.progress === 'number') {
            onProgress?.(info.progress);
          }
        },
      });
      _tts = tts as KokoroTTSInstance;
      setLoadState('ready');

      const saved = await idbGet(VOICE_KEY);
      if (saved && saved in KOKORO_VOICES) {
        _activeVoiceKey = saved as KokoroVoiceKey;
      }

      const savedPace = await idbGet(PACE_KEY);
      if (savedPace) {
        const n = parseFloat(savedPace);
        if ([0.75, 0.88, 1.0].includes(n)) {
          /* pace applied per-voice speed multiplier below */
        }
      }

      return _tts;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Voice model failed to load';
      setLoadState('error', msg);
      _loadPromise = null;
      throw err;
    }
  })();

  return _loadPromise;
}

export function getActiveKokoroVoiceKey(): KokoroVoiceKey {
  return _activeVoiceKey;
}

export function getActiveKokoroVoiceLabel(): string {
  return KOKORO_VOICES[_activeVoiceKey].label;
}

export function setActiveKokoroVoice(key: KokoroVoiceKey): void {
  _activeVoiceKey = key;
  void idbSet(VOICE_KEY, key);
}

export function kokoroStop(): void {
  _speakToken += 1;
  stopAudioPlayback();
}

function paceMultiplier(): number {
  return 1;
}

export async function kokoroSpeak(text: string, voiceKey?: KokoroVoiceKey): Promise<void> {
  const tts = await loadKokoroEngine();
  const token = ++_speakToken;
  const key = voiceKey ?? _activeVoiceKey;
  const voice = KOKORO_VOICES[key];
  const speed = voice.speed * paceMultiplier();

  for (const sentence of splitSentences(text)) {
    if (token !== _speakToken) return;
    const raw = await tts.generate(sentence, { voice: voice.id, speed });
    if (token !== _speakToken) return;
    await playBlob(raw.toBlob());
  }
}

/** Start playback pipeline from a user tap (loads model on first use). */
export function kokoroSpeakFromGesture(
  text: string,
  voiceKey?: KokoroVoiceKey,
): Promise<void> {
  unlockAudioPlayback();
  return kokoroSpeak(text, voiceKey);
}

export async function kokoroAudition(voiceKey: KokoroVoiceKey): Promise<void> {
  setActiveKokoroVoice(voiceKey);
  return kokoroSpeakFromGesture('What is your weather right now?', voiceKey);
}
