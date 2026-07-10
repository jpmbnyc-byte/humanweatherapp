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

export type SavedVoiceMeta = { uri: string | null; name: string | null };

/** iOS/Safari loads voices asynchronously — never trust the first empty getVoices(). */
function loadVoices(timeoutMs = 8000, force = false): Promise<SpeechSynthesisVoice[]> {
  const syn = synthesis();
  if (!syn) return Promise.resolve([]);

  if (_voicesPromise && !force) return _voicesPromise;
  if (force) _voicesPromise = null;

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

/** Speak a near-silent utterance so iOS populates getVoices() after a user gesture. */
function kickVoiceListLoad(): void {
  const syn = synthesis();
  if (!syn) return;
  syn.getVoices();
  if (syn.paused) syn.resume();
  try {
    const kick = new SpeechSynthesisUtterance('.');
    kick.volume = 0.01;
    kick.rate = 2;
    syn.speak(kick);
  } catch {
    /* noop */
  }
}

/** Call from a user gesture (tap) before first speak on iPhone. */
export function primeSpeechEngine(): void {
  const syn = synthesis();
  if (!syn || _speechPrimed) return;
  _speechPrimed = true;
  kickVoiceListLoad();
}

/** Re-trigger voice list loading during an explicit refresh (user tap). */
export function primeSpeechEngineForRefresh(): void {
  kickVoiceListLoad();
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
    /smooth.*personal|personal.*smooth/.test(hay) ||
    /com\.apple\.(tts|voice)[^.]*\.personal/.test(hay) ||
    /personalvoice/.test(hay) ||
    /\.personal\b/.test(hay)
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

function rosterFromVoices(voices: SpeechSynthesisVoice[]): RosterEntry[] {
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

export function rosterMaxCount(): number {
  return isIosPlatform() ? 32 : 16;
}

export async function buildVoiceRoster(timeoutMs?: number, force = false): Promise<RosterEntry[]> {
  const ms = timeoutMs ?? (isIosPlatform() ? 10000 : 6000);
  const voices = await loadVoices(ms, force);
  return rosterFromVoices(voices);
}

function mergeRosterEntries(a: RosterEntry[], b: RosterEntry[]): RosterEntry[] {
  const seen = new Map<string, RosterEntry>();
  for (const entry of [...a, ...b]) {
    const key = entry.uri || cleanVoiceName(entry.name).toLowerCase();
    const prev = seen.get(key);
    if (!prev || entry.score > prev.score) seen.set(key, entry);
  }
  return [...seen.values()].sort((x, y) => y.score - x.score);
}

export function dedupeRoster(roster: RosterEntry[], max = rosterMaxCount()): RosterEntry[] {
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
let _iosResumeInterval: ReturnType<typeof setInterval> | null = null;

export function stationStop(): void {
  _speakToken += 1;
  stopIosSpeechKeepAlive();
  synthesis()?.cancel();
}

function startIosSpeechKeepAlive(): void {
  if (!isIosPlatform()) return;
  stopIosSpeechKeepAlive();
  _iosResumeInterval = window.setInterval(() => {
    const syn = synthesis();
    if (syn?.paused) syn.resume();
  }, 8000);
}

function stopIosSpeechKeepAlive(): void {
  if (_iosResumeInterval !== null) {
    window.clearInterval(_iosResumeInterval);
    _iosResumeInterval = null;
  }
}

function splitSentences(text: string): string[] {
  return text.match(/[^.!?]+[.!?]+["']?|[^.!?]+$/g) || [text];
}

function pickVoiceSync(): SpeechSynthesisVoice | null {
  if (_stationVoice) return _stationVoice;
  const syn = synthesis();
  if (!syn) return null;
  syn.getVoices();
  const voices = syn.getVoices().filter(v => v.lang.startsWith('en'));
  if (!voices.length) return null;
  const personal = voices.find(isPersonalVoice);
  return personal ?? voices.find(v => v.default) ?? voices[0] ?? null;
}

function speakSentence(
  syn: SpeechSynthesis,
  trimmed: string,
  voice: SpeechSynthesisVoice | null,
  token: number,
): Promise<void> {
  return new Promise<void>(resolve => {
    if (token !== _speakToken) {
      resolve();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(trimmed);
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang ?? 'en-US';
    utterance.rate = _paceRate;
    utterance.pitch = 0.95;
    utterance.volume = 1;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    syn.resume();
    syn.speak(utterance);
  });
}

/**
 * Start speech synchronously from a user tap — required for iOS Safari.
 * Must be called directly from the click/touch handler (no await before this call).
 */
export function stationSpeakFromUserGesture(text: string): Promise<void> {
  const syn = synthesis();
  if (!syn) return Promise.resolve();

  primeSpeechEngineForRefresh();
  syn.resume();

  const token = ++_speakToken;
  startIosSpeechKeepAlive();

  const sentences = splitSentences(text).map(s => s.trim()).filter(Boolean);
  const voice = pickVoiceSync();
  if (!sentences.length) {
    stopIosSpeechKeepAlive();
    return Promise.resolve();
  }

  return new Promise<void>(resolve => {
    let idx = 0;

    const speakNext = () => {
      if (token !== _speakToken || idx >= sentences.length) {
        stopIosSpeechKeepAlive();
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(sentences[idx++]);
      if (voice) utterance.voice = voice;
      utterance.lang = voice?.lang ?? 'en-US';
      utterance.rate = _paceRate;
      utterance.pitch = 0.95;
      utterance.volume = 1;
      utterance.onend = () => speakNext();
      utterance.onerror = () => speakNext();
      syn.resume();
      syn.speak(utterance);
    };

    // First syn.speak() runs in the same turn as the user gesture.
    speakNext();
  });
}

/** Set active voice immediately (sync) before iOS audition from a tap. */
export function setStationVoice(entry: RosterEntry): void {
  _stationVoice = entry.voice;
}

async function iosUnlockAfterCancel(): Promise<void> {
  if (!isIosPlatform()) return;
  const syn = synthesis();
  if (!syn) return;
  syn.resume();
  await new Promise<void>(resolve => window.setTimeout(resolve, 60));
}

export async function stationSpeak(text: string): Promise<void> {
  if (isIosPlatform()) {
    return stationSpeakFromUserGesture(text);
  }

  primeSpeechEngine();
  synthesis()?.cancel();
  await iosUnlockAfterCancel();

  const token = ++_speakToken;
  startIosSpeechKeepAlive();
  const sentences = splitSentences(text);
  const voice = await selectStationVoice();
  const syn = synthesis();
  if (!syn) return;

  try {
    for (const sentence of sentences) {
      if (token !== _speakToken) return;
      const trimmed = sentence.trim();
      if (!trimmed) continue;
      await speakSentence(syn, trimmed, voice, token);
    }
  } finally {
    if (token === _speakToken) stopIosSpeechKeepAlive();
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
  return 'Enable Personal Voice in Settings → Accessibility → Personal Voice, turn on “Allow Apps to Request to Use My Personal Voice,” then tap Refresh voices. Your smooth Personal Voice and other installed voices will appear here.';
}

export async function getSavedVoiceMeta(): Promise<SavedVoiceMeta> {
  const [uri, name] = await Promise.all([idbGet(VOICE_URI_KEY), idbGet(VOICE_KEY)]);
  return { uri, name };
}

export function isSavedVoiceEntry(entry: RosterEntry, saved: SavedVoiceMeta): boolean {
  if (saved.uri && entry.uri === saved.uri) return true;
  const cleaned = cleanVoiceName(entry.name);
  if (saved.name && (cleaned === saved.name || entry.name === saved.name)) return true;
  return false;
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

/** Aggressive refresh for iPhone — re-kicks speech engine and polls twice for Personal Voice. */
export async function refreshStationVoices(): Promise<RosterEntry[]> {
  primeSpeechEngineForRefresh();
  _stationVoice = null;
  _voicesPromise = null;

  const syn = synthesis();
  syn?.cancel();
  if (syn?.paused) syn.resume();

  const firstTimeout = isIosPlatform() ? 15000 : 8000;
  let roster = dedupeRoster(await buildVoiceRoster(firstTimeout, true));

  if (isIosPlatform()) {
    await new Promise<void>(resolve => window.setTimeout(resolve, 500));
    kickVoiceListLoad();
    _voicesPromise = null;
    const second = dedupeRoster(await buildVoiceRoster(8000, true));
    if (second.length >= roster.length) roster = second;
    else roster = dedupeRoster(mergeRosterEntries(roster, second));
  }

  _stationVoice = await pickDefaultVoice(roster);
  return roster;
}

export function chooseStationVoiceFromGesture(entry: RosterEntry): Promise<void> {
  setStationVoice(entry);
  void idbSet(VOICE_KEY, cleanVoiceName(entry.name));
  void idbSet(VOICE_URI_KEY, entry.uri);
  return stationSpeakFromUserGesture(AUDITION_LINE);
}

export async function chooseStationVoice(entry: RosterEntry): Promise<void> {
  setStationVoice(entry);
  await idbSet(VOICE_KEY, cleanVoiceName(entry.name));
  await idbSet(VOICE_URI_KEY, entry.uri);
  stationStop();
  return stationSpeakFromUserGesture(AUDITION_LINE);
}

export function platformVoiceHint(): string {
  if (typeof navigator === 'undefined') {
    return 'Your system\u2019s installed voices appear here automatically.';
  }
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) {
    return 'On iPhone, tap Refresh voices after enabling Personal Voice (Settings → Accessibility → Personal Voice → Allow Apps to Request to Use). Tap a voice to audition, then Listen now to hear your prose.';
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
