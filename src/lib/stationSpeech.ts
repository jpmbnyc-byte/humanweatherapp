/**
 * Speech facade — Kokoro WASM + HTMLAudio on the client only (HW_HARNESS §6).
 * SSR-safe: Kokoro lives in *.client.ts modules via createClientOnlyFn.
 */
import { createClientOnlyFn } from '@tanstack/react-start';
import { idbGet, idbSet } from './idb';
import {
  KOKORO_VOICES,
  kokoroVoiceLabel,
  type KokoroVoiceKey,
  type KokoroLoadState,
} from './kokoroVoices';

export type { KokoroLoadState };

export const AUDITION_LINE = 'What is your weather right now?';
export const FAMILIAR_GREETING_LINE = 'A familiar voice is here.';

export type RosterEntry = {
  name: string;
  uri: string;
  lang: string;
  local: boolean;
  score: number;
  voiceKey: KokoroVoiceKey;
};

export type SavedVoiceMeta = { uri: string | null; name: string | null };

export type PaceOption = 'slow' | 'standard' | 'brisk';

export const PACE_VALUES: Record<PaceOption, number> = {
  slow: 0.75,
  standard: 0.88,
  brisk: 1.0,
};

let _activeVoiceKey: KokoroVoiceKey = 'joan';
let _paceRate = 0.88;

const unlockPlayback = createClientOnlyFn(() => {
  void import('./audioPlayback.client').then(m => m.unlockAudioPlayback());
});

const clientOnKokoroLoadState = createClientOnlyFn(
  (cb: (state: KokoroLoadState, detail?: string) => void) =>
    import('./kokoroEngine.client').then(m => m.onKokoroLoadState(cb)),
);

const clientGetKokoroLoadState = createClientOnlyFn(() =>
  import('./kokoroEngine.client').then(m => m.getKokoroLoadState()),
);

const clientSetActiveKokoroVoice = createClientOnlyFn((key: KokoroVoiceKey) =>
  import('./kokoroEngine.client').then(m => m.setActiveKokoroVoice(key)),
);

const clientLoadKokoroEngine = createClientOnlyFn(() =>
  import('./kokoroEngine.client').then(m => m.loadKokoroEngine()),
);

const clientKokoroStop = createClientOnlyFn(() =>
  import('./kokoroEngine.client').then(m => m.kokoroStop()),
);

const clientKokoroSpeakFromGesture = createClientOnlyFn((text: string) =>
  import('./kokoroEngine.client').then(m => m.kokoroSpeakFromGesture(text)),
);

const clientKokoroSpeak = createClientOnlyFn((text: string) =>
  import('./kokoroEngine.client').then(m => m.kokoroSpeak(text)),
);

const clientKokoroAudition = createClientOnlyFn((voiceKey: KokoroVoiceKey) =>
  import('./kokoroEngine.client').then(m => m.kokoroAudition(voiceKey)),
);

export function onKokoroLoadState(cb: (state: KokoroLoadState, detail?: string) => void): () => void {
  let disposed = false;
  let innerDispose: (() => void) | undefined;
  void clientOnKokoroLoadState(cb).then(unsub => {
    if (disposed) unsub();
    else innerDispose = unsub;
  });
  return () => {
    disposed = true;
    innerDispose?.();
  };
}

export function getKokoroLoadState(): KokoroLoadState {
  return 'idle';
}

export function isIosPlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function cleanVoiceName(name: string): string {
  return name.replace(/\s*\([^)]*\)/g, '').trim();
}

export function primeSpeechEngine(): void {
  unlockPlayback();
}

export function unlockIosSpeechSession(): void {
  unlockPlayback();
}

export function primeSpeechEngineForRefresh(): void {
  unlockPlayback();
}

function buildStaticRoster(): RosterEntry[] {
  return (Object.entries(KOKORO_VOICES) as [KokoroVoiceKey, (typeof KOKORO_VOICES)[KokoroVoiceKey]][])
    .map(([key, v], index) => ({
      name: v.label,
      uri: key,
      lang: 'en-US',
      local: true,
      score: 100 - index,
      voiceKey: key,
    }));
}

export function dedupeRoster(roster: RosterEntry[], max = 16): RosterEntry[] {
  return roster.slice(0, max);
}

export function rosterMaxCount(): number {
  return Object.keys(KOKORO_VOICES).length;
}

export function rosterTier(entry: RosterEntry): 'PREMIUM' | 'ENHANCED' | 'STANDARD' | 'FAMILIAR' {
  const v = KOKORO_VOICES[entry.voiceKey];
  if (v.tier === 'PREMIUM') return 'PREMIUM';
  if (v.tier === 'ENHANCED') return 'ENHANCED';
  return 'STANDARD';
}

export function isFamiliarEntry(_entry: RosterEntry): boolean {
  return false;
}

export function hasFamiliarInRoster(_roster: RosterEntry[]): boolean {
  return false;
}

export function isActiveVoiceFamiliar(): boolean {
  return false;
}

export async function getFamiliarGreeted(): Promise<boolean> {
  return true;
}

export async function setFamiliarGreeted(): Promise<void> {
  /* no-op */
}

export function familiarVoiceCopy(): string {
  return 'Tap Listen now to download the voice model once (~86MB). Playback uses your device speaker — check that mute is off.';
}

export function getActiveVoiceLabel(): string {
  return kokoroVoiceLabel(_activeVoiceKey);
}

export function getPaceRate(): number {
  return _paceRate;
}

export async function setPaceRate(rate: number): Promise<void> {
  _paceRate = rate;
  await idbSet('hw-pace', String(rate));
}

export function paceFromRate(rate: number): PaceOption {
  if (rate <= 0.8) return 'slow';
  if (rate >= 0.95) return 'brisk';
  return 'standard';
}

export async function getSavedVoiceMeta(): Promise<SavedVoiceMeta> {
  const key = await idbGet('hw-station-voice');
  const label = key && key in KOKORO_VOICES ? KOKORO_VOICES[key as KokoroVoiceKey].label : null;
  return { uri: key, name: label };
}

export function isSavedVoiceEntry(entry: RosterEntry, saved: SavedVoiceMeta): boolean {
  if (saved.uri && entry.uri === saved.uri) return true;
  if (saved.name && entry.name === saved.name) return true;
  return false;
}

export async function initStationSpeech(): Promise<RosterEntry[]> {
  unlockPlayback();
  const savedPace = await idbGet('hw-pace');
  if (savedPace) {
    const n = parseFloat(savedPace);
    if ([0.75, 0.88, 1.0].includes(n)) _paceRate = n;
  }
  const saved = await idbGet('hw-station-voice');
  if (saved && saved in KOKORO_VOICES) {
    _activeVoiceKey = saved as KokoroVoiceKey;
    await clientSetActiveKokoroVoice(_activeVoiceKey);
  }
  return buildStaticRoster();
}

export async function ensureVoicesReady(): Promise<RosterEntry[]> {
  return initStationSpeech();
}

export async function refreshStationVoices(): Promise<RosterEntry[]> {
  unlockPlayback();
  try {
    await clientLoadKokoroEngine();
  } catch {
    /* roster still shown */
  }
  return buildStaticRoster();
}

export async function loadVoiceRosterInBackground(): Promise<RosterEntry[]> {
  return buildStaticRoster();
}

export function stationStop(): void {
  void clientKokoroStop();
}

export function stationSpeakFromUserGesture(text: string): Promise<void> {
  return clientKokoroSpeakFromGesture(text);
}

export async function stationSpeak(text: string): Promise<void> {
  await clientKokoroSpeak(text);
}

export function setStationVoice(entry: RosterEntry): void {
  _activeVoiceKey = entry.voiceKey;
  void clientSetActiveKokoroVoice(entry.voiceKey);
}

export function chooseStationVoiceFromGesture(entry: RosterEntry): Promise<void> {
  _activeVoiceKey = entry.voiceKey;
  return clientKokoroAudition(entry.voiceKey);
}

export async function chooseStationVoice(entry: RosterEntry): Promise<void> {
  return chooseStationVoiceFromGesture(entry);
}

export function platformVoiceHint(): string {
  return 'Voices run locally in your browser (Kokoro). First Listen downloads the model once, then works offline.';
}

export function buildVoiceRoster(): Promise<RosterEntry[]> {
  return Promise.resolve(buildStaticRoster());
}

export function getActiveVoice(): null {
  return null;
}

export { KOKORO_VOICES };
