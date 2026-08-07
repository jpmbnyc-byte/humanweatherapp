import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const idbStore = new Map<string, string>();
const lsStore = new Map<string, string>();

vi.mock('./idb', () => ({
  idbGet: (key: string) => Promise.resolve(idbStore.get(key) ?? null),
  idbSet: (key: string, value: string) => {
    idbStore.set(key, value);
    return Promise.resolve();
  },
}));

function mockLocalStorage() {
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => lsStore.get(key) ?? null,
    setItem: (key: string, value: string) => {
      lsStore.set(key, value);
    },
    removeItem: (key: string) => {
      lsStore.delete(key);
    },
    clear: () => {
      lsStore.clear();
    },
  });
}

describe('stationSpeech saved voice', () => {
  beforeEach(() => {
    idbStore.clear();
    lsStore.clear();
    mockLocalStorage();
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('hydrates saved voice cache from IndexedDB and mirrors to localStorage', async () => {
    idbStore.set('hw-station-voice-uri', 'personal-uri');
    idbStore.set('hw-station-voice', 'My Personal Voice');

    const { hydrateSavedVoiceCache } = await import('./stationSpeech');
    await hydrateSavedVoiceCache();

    expect(localStorage.getItem('hw-station-voice-uri')).toBe('personal-uri');
    expect(localStorage.getItem('hw-station-voice-name')).toBe('My Personal Voice');
  });

  it('persists voice choice to localStorage immediately for sync reads', async () => {
    const personalVoice = {
      name: 'My Personal Voice',
      voiceURI: 'personal-uri',
      lang: 'en-US',
      localService: true,
      default: false,
    } as SpeechSynthesisVoice;

    const syn = {
      getVoices: () => [personalVoice],
      paused: false,
      resume: vi.fn(),
      cancel: vi.fn(),
      speak: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    vi.stubGlobal('window', { speechSynthesis: syn });
    vi.stubGlobal('speechSynthesis', syn);

    const { persistStationVoice } = await import('./stationSpeech');
    persistStationVoice({
      name: personalVoice.name,
      uri: personalVoice.voiceURI,
      lang: personalVoice.lang,
      local: true,
      score: 250,
      voice: personalVoice,
    });

    expect(localStorage.getItem('hw-station-voice-uri')).toBe('personal-uri');
    expect(localStorage.getItem('hw-station-voice-name')).toBe('My Personal Voice');
  });

  it('prefers saved voice over a fallback when warming speech from a gesture', async () => {
    const fallbackVoice = {
      name: 'Samantha',
      voiceURI: 'samantha-uri',
      lang: 'en-US',
      localService: true,
      default: true,
    } as SpeechSynthesisVoice;
    const personalVoice = {
      name: 'My Personal Voice',
      voiceURI: 'personal-uri',
      lang: 'en-US',
      localService: true,
      default: false,
    } as SpeechSynthesisVoice;

    localStorage.setItem('hw-station-voice-uri', 'personal-uri');
    localStorage.setItem('hw-station-voice-name', 'My Personal Voice');

    vi.stubGlobal('window', {
      speechSynthesis: {
        getVoices: () => [fallbackVoice, personalVoice],
        paused: false,
        resume: vi.fn(),
        cancel: vi.fn(),
        speak: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });
    vi.stubGlobal('speechSynthesis', (window as any).speechSynthesis);

    const { warmSpeechVoicesFromGesture, getActiveVoice } = await import('./stationSpeech');
    warmSpeechVoicesFromGesture();

    expect(getActiveVoice()?.voiceURI).toBe('personal-uri');
  });
});
