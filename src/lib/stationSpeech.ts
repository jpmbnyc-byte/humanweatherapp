/**
 * Speech facade — Tender and narration use Kokoro WASM + HTMLAudio (HW_HARNESS §6).
 * Web Speech API removed from playback path (unreliable on iOS Safari).
 */
import { idbGet, idbSet } from './idb';
import {
  KOKORO_VOICES,
  kokoroAudition,
  kokoroSpeak,
  kokoroSpeakFromGesture,
  kokoroStop,
  loadKokoroEngine,
  getActiveKokoroVoiceKey,
  getActiveKokoroVoiceLabel,
  setActiveKokoroVoice,
  getKokoroLoadState,
  onKokoroLoadState,
  type KokoroVoiceKey,
  type KokoroLoadState,
} from './kokoroEngine';
import { unlockAudioPlayback } from './audioPlayback';

export { onKokoroLoadState, getKokoroLoadState, type KokoroLoadState };

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

let _paceRate = 0.88;

export function isIosPlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function cleanVoiceName(name: string): string {
  return name.replace(/\s*\([^)]*\)/g, '').trim();
}

export function primeSpeechEngine(): void {
  unlockAudioPlayback();
}

export function unlockIosSpeechSession(): void {
  unlockAudioPlayback();
}

export function primeSpeechEngineForRefresh(): void {
  unlockAudioPlayback();
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
  /* no-op — Kokoro voices are always available */
}

export function familiarVoiceCopy(): string {
  return 'Tap Listen now to download the voice model once (~86MB). Playback uses your device speaker — check that mute is off.';
}

export function getActiveVoiceLabel(): string {
  return getActiveKokoroVoiceLabel();
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
  unlockAudioPlayback();
  const savedPace = await idbGet('hw-pace');
  if (savedPace) {
    const n = parseFloat(savedPace);
    if ([0.75, 0.88, 1.0].includes(n)) _paceRate = n;
  }
  const saved = await idbGet('hw-station-voice');
  if (saved && saved in KOKORO_VOICES) {
    setActiveKokoroVoice(saved as KokoroVoiceKey);
  }
  return buildStaticRoster();
}

export async function ensureVoicesReady(): Promise<RosterEntry[]> {
  return initStationSpeech();
}

export async function refreshStationVoices(): Promise<RosterEntry[]> {
  unlockAudioPlayback();
  try {
    await loadKokoroEngine();
  } catch {
    /* roster still shown even if model pending */
  }
  return buildStaticRoster();
}

export async function loadVoiceRosterInBackground(): Promise<RosterEntry[]> {
  return buildStaticRoster();
}

export function stationStop(): void {
  kokoroStop();
}

export function stationSpeakFromUserGesture(text: string): Promise<void> {
  return kokoroSpeakFromGesture(text);
}

export async function stationSpeak(text: string): Promise<void> {
  return kokoroSpeak(text);
}

export function setStationVoice(entry: RosterEntry): void {
  setActiveKokoroVoice(entry.voiceKey);
}

export function chooseStationVoiceFromGesture(entry: RosterEntry): Promise<void> {
  return kokoroAudition(entry.voiceKey);
}

export async function chooseStationVoice(entry: RosterEntry): Promise<void> {
  return kokoroAudition(entry.voiceKey);
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
