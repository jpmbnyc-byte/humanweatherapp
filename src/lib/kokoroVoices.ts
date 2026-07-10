/** Kokoro voice roster — no kokoro-js import (safe for SSR). */

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

export function kokoroVoiceLabel(key: KokoroVoiceKey): string {
  return KOKORO_VOICES[key].label;
}
