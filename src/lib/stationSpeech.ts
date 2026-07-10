import { idbGet, idbSet } from './idb';

const VOICE_KEY = 'hw-station-voice';
const VOICE_URI_KEY = 'hw-station-voice-uri';
const PACE_KEY = 'hw-pace';
const FAMILIAR_GREETED_KEY = 'hw-familiar-greeted';

export const AUDITION_LINE = 'What is your weather right now?';
export const FAMILIAR_GREETING_LINE = 'A familiar voice is here.';

export type RosterEntry = {
  name: string;
  uri: string;
  lang: string;
  local: boolean;
  score: number;
  voice: SpeechSynthesisVoice;
};

let _stationVoice: SpeechSynthesisVoice | null = null;
let _paceRate = 0.88;
let _voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;
let _speechPrimed = false;

function synthesis(): SpeechSynthesis | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  return window.speechSynthesis;
}

/** iOS/Safari loads voices asynchronously — never trust the first empty getVoices(). */
function loadVoices(timeoutMs = 8000): Promise<SpeechSynthesisVoice[]> {
  const syn = synthesis();
  if (!syn) return Promise.resolve([]);

  if (_voicesPromise) return _voicesPromise;

  _voicesPromise = new Promise(resolve => {
    let settled = false;
    let pollId = 0;
    let hardStopId = 0;
    const finish = (voices: SpeechSynthesisVoice[]) => {
      if (settled) return;
      settled = true;
      syn.removeEventListener('voiceschanged', onChange);
      window.clearInterval(pollId);
      window.clearTimeout(hardStopId);
      resolve(voices);
      _voicesPromise = null;
    };

    const read = () => {
      syn.getVoices();
      return syn.getVoices();
    };

    const onChange = () => {
      const voices = read();
      if (voices.length) finish(voices);
    };

    syn.addEventListener('voiceschanged', onChange);

    const immediate = read();
    if (immediate.length) {
      finish(immediate);
      return;
    }

    pollId = window.setInterval(() => {
      const voices = read();
      if (voices.length) finish(voices);
    }, 250);

    hardStopId = window.setTimeout(() => finish(read()), timeoutMs);
  });

  return _voicesPromise;
}

/** Call from a user gesture (tap) before first speak on iPhone. */
export function primeSpeechEngine(): void {
  const syn = synthesis();
  if (!syn || _speechPrimed) return;
  _speechPrimed = true;
  syn.getVoices();
  if (syn.paused) syn.resume();
  // iOS Safari won't populate getVoices() until the synth actually speaks once
  // after a user gesture. Speak a near-silent utterance to force the voice
  // list to load. Harmless on desktop.
  try {
    const kick = new SpeechSynthesisUtterance(' ');
    kick.volume = 0;
    kick.rate = 1;
    syn.speak(kick);
  } catch {
    /* noop */
  }
}

export function isIosPlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function cleanVoiceName(name: string): string {
  return name.replace(/\s*\([^)]*\)/g, '').trim();
}

export function isPersonalVoice(voice: SpeechSynthesisVoice): boolean {
  const hay = `${voice.name}|${voice.voiceURI}`.toLowerCase();
  return (
    /personal/.test(hay) ||
    /familiar/.test(hay) ||
    /com\.apple\.(tts|voice)[^.]*\.personal/.test(hay) ||
    /personalvoice/.test(hay)
  );
}

export function isFamiliarVoice(voice: SpeechSynthesisVoice): boolean {
  return isPersonalVoice(voice);
}

export function isFamiliarEntry(entry: RosterEntry): boolean {
  return isPersonalVoice(entry.voice);
}

function voiceScore(v: SpeechSynthesisVoice): number {
  const hay = `${v.name}${v.voiceURI}`;
  let score = 0;
  if (isPersonalVoice(v)) score += 250;
  if (/premium/i.test(hay)) score += 100;
  else if (/enhanced|natural|siri/i.test(hay)) score += 80;
  else if (/google us english/i.test(v.name)) score += 60;
  if (v.localService) score += 15;
  if (v.lang === 'en-US') score += 10;
  if (v.default) score += 5;
  return score;
}

export async function buildVoiceRoster(): Promise<RosterEntry[]> {
  const voices = await loadVoices(isIosPlatform() ? 10000 : 6000);
  const junk =
    /compact|fred|albert|zarvox|bad news|bells|trinoids|whisper|jester|organ|cellos|boing|bubbles/i;
  return voices
    .filter(v => v.lang.startsWith('en') && !junk.test(v.name))
    .map(v => ({
      name: v.name,
      uri: v.voiceURI,
      lang: v.lang,
      local: v.localService,
      score: voiceScore(v),
      voice: v,
    }))
    .sort((a, b) => b.score - a.score);
}

export function dedupeRoster(roster: RosterEntry[], max = 16): RosterEntry[] {
  const seen = new Map<string, RosterEntry>();
  for (const entry of roster) {
    const key = entry.uri || cleanVoiceName(entry.name).toLowerCase();
    const prev = seen.get(key);
    if (!prev || entry.score > prev.score) seen.set(key, entry);
  }
  return [...seen.values()].sort((a, b) => b.score - a.score).slice(0, max);
}

async function pickDefaultVoice(roster: RosterEntry[]): Promise<SpeechSynthesisVoice | null> {
  if (!roster.length) return null;

  const savedUri = await idbGet(VOICE_URI_KEY);
  if (savedUri) {
    const byUri = roster.find(e => e.uri === savedUri);
    if (byUri) return byUri.voice;
  }

  const savedName = await idbGet(VOICE_KEY);
  if (savedName) {
    const byName = roster.find(
      e => cleanVoiceName(e.name) === savedName || e.name === savedName,
    );
    if (byName) return byName.voice;
  }

  const personal = roster.find(isFamiliarEntry);
  if (personal) return personal.voice;

  return roster[0].voice;
}

async function selectStationVoice(): Promise<SpeechSynthesisVoice | null> {
  if (_stationVoice) return _stationVoice;
  const roster = dedupeRoster(await buildVoiceRoster());
  _stationVoice = await pickDefaultVoice(roster);
  return _stationVoice;
}

let _speakToken = 0;

export function stationStop(): void {
  _speakToken += 1;
  synthesis()?.cancel();
}

async function iosUnlockAfterCancel(): Promise<void> {
  if (!isIosPlatform()) return;
  const syn = synthesis();
  if (!syn) return;
  syn.resume();
  await new Promise<void>(resolve => window.setTimeout(resolve, 60));
}

export async function stationSpeak(text: string): Promise<void> {
  primeSpeechEngine();
  synthesis()?.cancel();
  await iosUnlockAfterCancel();

  const token = ++_speakToken;
  const sentences = text.match(/[^.!?]+[.!?]+["']?|[^.!?]+$/g) || [text];
  const voice = await selectStationVoice();
  const syn = synthesis();
  if (!syn) return;

  for (const sentence of sentences) {
    if (token !== _speakToken) return;
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    await new Promise<void>(resolve => {
      const utterance = new SpeechSynthesisUtterance(trimmed);
      if (voice) utterance.voice = voice;
      utterance.lang = voice?.lang ?? 'en-US';
      utterance.rate = _paceRate;
      utterance.pitch = 0.95;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      if (token !== _speakToken) {
        resolve();
        return;
      }
      syn.resume();
      syn.speak(utterance);
    });
  }
}

export function rosterTier(entry: RosterEntry): 'PREMIUM' | 'ENHANCED' | 'STANDARD' | 'FAMILIAR' {
  if (isFamiliarEntry(entry)) return 'FAMILIAR';
  const hay = entry.name + entry.uri;
  if (/premium/i.test(hay)) return 'PREMIUM';
  if (/enhanced|natural|siri/i.test(hay)) return 'ENHANCED';
  return 'STANDARD';
}

export function getPaceRate(): number {
  return _paceRate;
}

export async function setPaceRate(rate: number): Promise<void> {
  _paceRate = rate;
  await idbSet(PACE_KEY, String(rate));
}

export function getActiveVoice(): SpeechSynthesisVoice | null {
  return _stationVoice;
}

export function getActiveVoiceLabel(): string {
  if (!_stationVoice) return '';
  return cleanVoiceName(_stationVoice.name);
}

export function hasFamiliarInRoster(roster: RosterEntry[]): boolean {
  return roster.some(isFamiliarEntry);
}

export function isActiveVoiceFamiliar(): boolean {
  return _stationVoice ? isFamiliarVoice(_stationVoice) : false;
}

export async function getFamiliarGreeted(): Promise<boolean> {
  return (await idbGet(FAMILIAR_GREETED_KEY)) === '1';
}

export async function setFamiliarGreeted(): Promise<void> {
  await idbSet(FAMILIAR_GREETED_KEY, '1');
}

export function familiarVoiceCopy(): string {
  return 'Personal Voice appears here when enabled in Settings → Accessibility → Personal Voice, with “Allow Apps to Request to Use” turned on. Tap Listen once, then open the voice list.';
}

export async function initStationSpeech(): Promise<RosterEntry[]> {
  primeSpeechEngine();

  const savedPace = await idbGet(PACE_KEY);
  if (savedPace) {
    const n = parseFloat(savedPace);
    if ([0.75, 0.88, 1.0].includes(n)) _paceRate = n;
  }

  const roster = dedupeRoster(await buildVoiceRoster());
  _stationVoice = await pickDefaultVoice(roster);
  return roster;
}

/** Refresh voices after a user gesture — use before first Listen on iPhone. */
export async function ensureVoicesReady(): Promise<RosterEntry[]> {
  primeSpeechEngine();
  _stationVoice = null;
  _voicesPromise = null;
  return initStationSpeech();
}

export async function chooseStationVoice(entry: RosterEntry): Promise<void> {
  _stationVoice = entry.voice;
  await idbSet(VOICE_KEY, cleanVoiceName(entry.name));
  await idbSet(VOICE_URI_KEY, entry.uri);
  stationStop();
  await stationSpeak(AUDITION_LINE);
}

export function platformVoiceHint(): string {
  if (typeof navigator === 'undefined') {
    return 'Your system\u2019s installed voices appear here automatically.';
  }
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) {
    return 'On iPhone, voices load after your first tap. Enable Personal Voice under Settings → Accessibility → Personal Voice, then tap a voice below to audition.';
  }
  if (/Android/i.test(ua)) {
    return 'Add voices in Settings → Text-to-speech output. New voices appear here automatically.';
  }
  return 'Your system\u2019s installed voices appear here automatically.';
}

export type PaceOption = 'slow' | 'standard' | 'brisk';

export const PACE_VALUES: Record<PaceOption, number> = {
  slow: 0.75,
  standard: 0.88,
  brisk: 1.0,
};

export function paceFromRate(rate: number): PaceOption {
  if (rate <= 0.8) return 'slow';
  if (rate >= 0.95) return 'brisk';
  return 'standard';
}
