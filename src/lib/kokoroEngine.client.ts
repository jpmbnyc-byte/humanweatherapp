/** Kokoro TTS engine — browser only (*.client.ts). */
import { idbGet, idbSet } from './idb';
import { playBlob, stopAudioPlayback, unlockAudioPlayback } from './audioPlayback.client';
import { registerAudioStop } from './stopAllAudio';
import {
  KOKORO_VOICES,
  kokoroVoiceLabel,
  type KokoroVoiceKey,
  type KokoroLoadState,
} from './kokoroVoices';

export { KOKORO_VOICES, type KokoroVoiceKey, type KokoroLoadState };

const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';
const VOICE_KEY = 'hw-station-voice';

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
  if (typeof window === 'undefined') {
    throw new Error('Kokoro is browser-only');
  }
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
  return kokoroVoiceLabel(_activeVoiceKey);
}

export function setActiveKokoroVoice(key: KokoroVoiceKey): void {
  _activeVoiceKey = key;
  void idbSet(VOICE_KEY, key);
}

export function kokoroStop(): void {
  _speakToken += 1;
  stopAudioPlayback();
}

export async function kokoroSpeak(text: string, voiceKey?: KokoroVoiceKey): Promise<void> {
  const tts = await loadKokoroEngine();
  const token = ++_speakToken;
  const key = voiceKey ?? _activeVoiceKey;
  const voice = KOKORO_VOICES[key];

  for (const sentence of splitSentences(text)) {
    if (token !== _speakToken) return;
    const raw = await tts.generate(sentence, { voice: voice.id, speed: voice.speed });
    if (token !== _speakToken) return;
    await playBlob(raw.toBlob());
  }
}

export function kokoroSpeakFromGesture(text: string, voiceKey?: KokoroVoiceKey): Promise<void> {
  unlockAudioPlayback();
  return kokoroSpeak(text, voiceKey);
}

export async function kokoroAudition(voiceKey: KokoroVoiceKey): Promise<void> {
  setActiveKokoroVoice(voiceKey);
  return kokoroSpeakFromGesture('What is your weather right now?', voiceKey);
}

registerAudioStop(kokoroStop);
