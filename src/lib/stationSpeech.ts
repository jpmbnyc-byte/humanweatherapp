// ── VOICES READY (handles the empty-first-call race on iOS/Chrome) ──
function _voicesReady() {
  return new Promise<SpeechSynthesisVoice[]>(resolve => {
    const v = speechSynthesis.getVoices();
    if (v.length) return resolve(v);
    let done = false;
    speechSynthesis.onvoiceschanged = () => {
      if (!done) {
        done = true;
        resolve(speechSynthesis.getVoices());
      }
    };
    setTimeout(() => {
      if (!done) {
        done = true;
        resolve(speechSynthesis.getVoices());
      }
    }, 2000);
  });
}

export type RosterEntry = {
  name: string;
  uri: string;
  lang: string;
  local: boolean;
  score: number;
  voice: SpeechSynthesisVoice;
};

// ── VOICE ROSTER — every compatible English voice on the device, ranked ──
let _stationVoice: SpeechSynthesisVoice | null = null;
let _paceRate = 0.88; // updated by the Pace setting in Step 5

export async function buildVoiceRoster() {
  const voices = await _voicesReady();
  const JUNK = /compact|fred|albert|zarvox|bad news|bells|trinoids|whisper|jester|organ|cellos|boing|bubbles/i;
  return voices
    .filter(v => v.lang.startsWith('en') && !JUNK.test(v.name))
    .map(v => ({
      name: v.name,
      uri: v.voiceURI,
      lang: v.lang,
      local: v.localService,
      score:
        (/premium/i.test(v.name + v.voiceURI) ? 100 :
          /enhanced|natural/i.test(v.name + v.voiceURI) ? 80 :
            /google us english/i.test(v.name) ? 60 : 0)
        + (v.localService ? 15 : 0)
        + (v.lang === 'en-US' ? 10 : 0),
      voice: v,
    }))
    .sort((a, b) => b.score - a.score);
}

// ── SELECT + SPEAK ──
async function selectStationVoice() {
  if (_stationVoice) return _stationVoice;
  const roster = await buildVoiceRoster();
  _stationVoice = roster.length ? roster[0].voice : null;
  return _stationVoice;
}

let _speakToken = 0;

export function stationStop() {
  _speakToken += 1;
  speechSynthesis.cancel();
}

export async function stationSpeak(text: string) {
  const token = ++_speakToken;
  speechSynthesis.cancel();
  const sentences = text.match(/[^.!?]+[.!?]+["']?|[^.!?]+$/g) || [text];
  const v = await selectStationVoice();
  for (const s of sentences) {
    if (token !== _speakToken) return;
    await new Promise<void>(res => {
      const u = new SpeechSynthesisUtterance(s.trim());
      if (v) u.voice = v;
      u.rate = _paceRate;
      u.pitch = 0.95;
      u.onend = () => res();
      u.onerror = () => res();
      if (token !== _speakToken) {
        res();
        return;
      }
      speechSynthesis.speak(u);
    });
  }
}

// ── IndexedDB persistence + UI helpers (Step 4 & 5) ──

const DB_NAME = 'human-weather';
const STORE = 'settings';
const VOICE_KEY = 'hw-station-voice';
const PACE_KEY = 'hw-pace';
export const AUDITION_LINE = 'What is your weather right now?';

function idbOpen(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key: string): Promise<string | null> {
  if (typeof indexedDB === 'undefined') return null;
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const get = tx.objectStore(STORE).get(key);
    get.onsuccess = () => resolve((get.result as string | undefined) ?? null);
    get.onerror = () => reject(get.error);
  });
}

async function idbSet(key: string, value: string): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function cleanVoiceName(name: string): string {
  return name.replace(/\s*\([^)]*\)/g, '').trim();
}

export function rosterTier(entry: RosterEntry): 'PREMIUM' | 'ENHANCED' | 'STANDARD' {
  const hay = entry.name + entry.uri;
  if (/premium/i.test(hay)) return 'PREMIUM';
  if (/enhanced|natural/i.test(hay)) return 'ENHANCED';
  return 'STANDARD';
}

export function dedupeRoster(roster: RosterEntry[], max = 12): RosterEntry[] {
  const seen = new Map<string, RosterEntry>();
  for (const entry of roster) {
    const key = cleanVoiceName(entry.name).toLowerCase();
    const prev = seen.get(key);
    if (!prev || entry.score > prev.score) seen.set(key, entry);
  }
  return [...seen.values()].sort((a, b) => b.score - a.score).slice(0, max);
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

export async function initStationSpeech(): Promise<RosterEntry[]> {
  const savedPace = await idbGet(PACE_KEY);
  if (savedPace) {
    const n = parseFloat(savedPace);
    if ([0.75, 0.88, 1.0].includes(n)) _paceRate = n;
  }

  const roster = dedupeRoster(await buildVoiceRoster());
  const savedVoice = await idbGet(VOICE_KEY);

  if (savedVoice && roster.length) {
    const match = roster.find(
      e => cleanVoiceName(e.name) === savedVoice || e.name === savedVoice,
    );
    if (match) _stationVoice = match.voice;
    else _stationVoice = roster[0].voice;
  } else if (roster.length) {
    _stationVoice = roster[0].voice;
  }

  return roster;
}

export async function chooseStationVoice(entry: RosterEntry): Promise<void> {
  _stationVoice = entry.voice;
  await idbSet(VOICE_KEY, cleanVoiceName(entry.name));
  stationStop();
  await stationSpeak(AUDITION_LINE);
}

export function platformVoiceHint(): string {
  if (typeof navigator === 'undefined') {
    return 'Your system\u2019s installed voices appear here automatically.';
  }
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) {
    return 'Richer voices are free in Settings \u2192 Accessibility \u2192 Spoken Content \u2192 Voices. New voices appear here automatically.';
  }
  if (/Android/i.test(ua)) {
    return 'Add voices in Settings \u2192 Text-to-speech output. New voices appear here automatically.';
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
