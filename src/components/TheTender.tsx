import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Volume2, Play, Pause, Square, Music, Headphones, Sliders, Edit2, Check } from 'lucide-react';
import { PRESETS } from '../data/presets';
import { getThemeStyles } from '../lib/theme';

type TenderVoiceId = 'joan' | 'grace' | 'peter' | 'daniel';
interface TenderVoiceProfile {
  id: TenderVoiceId;
  name: string;
  descriptor: string;
  // OpenAI TTS voice (routed through Lovable AI Gateway)
  ttsVoice: 'shimmer' | 'nova' | 'onyx' | 'echo' | 'alloy' | 'sage' | 'coral' | 'ballad';
  // Natural-language steering for tone/pacing
  instructions: string;
}
const TENDER_VOICES: TenderVoiceProfile[] = [
  {
    id: 'joan',
    name: 'Joan',
    descriptor: 'Warm · Grounded',
    ttsVoice: 'shimmer',
    instructions:
      'Speak as a warm, grounded woman in her early 40s. Unhurried, gentle, with soft breath and a low, reassuring cadence. Meditative pauses between sentences.',
  },
  {
    id: 'grace',
    name: 'Grace',
    descriptor: 'Gentle · Airy',
    ttsVoice: 'nova',
    instructions:
      'Speak as a gentle, airy woman with a light, luminous tone. Slow, tender, contemplative pacing, as if reading a poem aloud in a candlelit room.',
  },
  {
    id: 'peter',
    name: 'Peter',
    descriptor: 'Deep · Anchored',
    ttsVoice: 'onyx',
    instructions:
      'Speak as a deep, anchored man with a resonant baritone. Slow, deliberate, monk-like. Long, calm breaths. Convey stillness and gravity.',
  },
  {
    id: 'daniel',
    name: 'Daniel',
    descriptor: 'Resonant · Measured',
    ttsVoice: 'echo',
    instructions:
      'Speak as a resonant, measured man — a thoughtful narrator with clear diction, gentle warmth and a reflective, unhurried tempo.',
  },
];

function formatSpeechError(raw?: string): string {
  if (!raw) return 'Voice playback failed. Tap Listen to try again.';
  const m = raw.toLowerCase();
  if (m.includes('lovable_api_key') || m.includes('not configured')) {
    return 'Studio voice is unavailable in this environment. Using your browser narrator instead.';
  }
  if (m.includes('notallowed') || m.includes('audio playback blocked') || m.includes('suspended')) {
    return 'Your browser paused audio. Tap Listen once to allow sound, then try again.';
  }
  if (m.includes('failed to fetch') || m.includes('network')) {
    return 'Could not reach the voice service. Check your connection and try again.';
  }
  if (m.includes('browser-speech-unavailable')) {
    return 'This browser does not support spoken narration.';
  }
  return raw.length > 140 ? `${raw.slice(0, 140)}…` : raw;
}

function shouldFallbackToBrowserTts(message?: string): boolean {
  if (!message) return true;
  const m = message.toLowerCase();
  return (
    m.includes('lovable_api_key') ||
    m.includes('not configured') ||
    m.includes('failed to fetch') ||
    m.includes('network') ||
    m.includes('upstream') ||
    m.includes('tts request failed') ||
    m.includes('no audio received') ||
    m.includes('503') ||
    m.includes('500') ||
    m.includes('502') ||
    m.includes('504')
  );
}

function pickBrowserVoice(profile: TenderVoiceProfile): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const en = voices.filter(v => v.lang.startsWith('en'));
  const pool = en.length ? en : voices;
  const preferFemale = profile.id === 'joan' || profile.id === 'grace';
  const scored = pool.map(v => {
    const name = v.name.toLowerCase();
    let score = 0;
    if (preferFemale && /female|samantha|victoria|karen|moira|fiona|zira|susan|kate|emily|ava|allison|siri/.test(name)) score += 10;
    if (!preferFemale && /male|daniel|alex|fred|david|mark|james|tom|aaron|nathan|matthew|fred/.test(name)) score += 10;
    if (v.default) score += 1;
    return { v, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.v ?? pool[0];
}

interface TheTenderProps {
  currentTheme: 'day' | 'night';
}

export default function TheTender({ currentTheme }: TheTenderProps) {
  const [inputText, setInputText] = useState(PRESETS[0].text);
  const [soundEnv, setSoundEnv] = useState<'rain' | 'forest' | 'ocean' | 'hearth' | 'crickets' | 'silence'>('silence');
  const [tenderVoice, setTenderVoice] = useState<TenderVoiceId>('joan');
  
  const [isReading, setIsReading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [ambientVolume, setAmbientVolume] = useState(0.4);
  const [isEditMode, setIsEditMode] = useState(false);

  // Web Audio and Speech refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const envGainNodeRef = useRef<GainNode | null>(null);
  const cricketTimerRef = useRef<any>(null);
  const speakTimeoutRef = useRef<any>(null);

  // AI TTS streaming refs
  const ttsAbortRef = useRef<AbortController | null>(null);
  const ttsGainRef = useRef<GainNode | null>(null);
  const ttsSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const ttsPlayheadRef = useRef<number>(0);
  const ttsSessionIdRef = useRef<number>(0);
  const ttsModeRef = useRef<'ai' | 'browser' | null>(null);
  const browserSessionRef = useRef<number>(0);
  const apiUnavailableRef = useRef<boolean | null>(null);

  // Active word list cache for matching onboundary indices
  const [wordsList, setWordsList] = useState<string[]>([]);

  // Preload browser speech voices + probe studio TTS availability
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const load = () => window.speechSynthesis.getVoices();
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);

    fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'ok', voice: 'alloy' }),
    })
      .then(res => { apiUnavailableRef.current = res.status === 503; })
      .catch(() => { apiUnavailableRef.current = true; });

    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopReading(true);
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Sync volume node when ambientVolume, soundEnv, or reading states change
  useEffect(() => {
    if (envGainNodeRef.current && audioCtxRef.current) {
      const ctx = audioCtxRef.current;
      const targetGain = getAmbientVolumeTarget();
      try {
        envGainNodeRef.current.gain.setValueAtTime(envGainNodeRef.current.gain.value, ctx.currentTime);
        envGainNodeRef.current.gain.linearRampToValueAtTime(targetGain, ctx.currentTime + 0.6);
      } catch (e) {
        envGainNodeRef.current.gain.setValueAtTime(targetGain, ctx.currentTime);
      }
    }
  }, [ambientVolume, soundEnv, isReading, isPaused, isPreparing]);

  // Sync environment change
  useEffect(() => {
    if (soundEnv !== 'silence') {
      startSoundEnvironment(soundEnv);
    } else {
      stopSoundEnvironment();
    }
  }, [soundEnv]);

  // Helper to determine ducked or full ambient volume target
  const getAmbientVolumeTarget = () => {
    if (soundEnv === 'silence') return 0;
    // Beautifully duck the background environment when speech narration is active
    if (isReading && !isPaused) {
      return ambientVolume * 0.15; 
    }
    if (isPreparing) {
      return ambientVolume * 0.25;
    }
    return ambientVolume * 0.5; // Normal ambient listening volume
  };

  // Web Audio Procedural Background Sound Synthesis
  const stopSoundEnvironment = () => {
    if (noiseSourceRef.current) {
      try {
        noiseSourceRef.current.stop();
        noiseSourceRef.current.disconnect();
      } catch (e) {}
      noiseSourceRef.current = null;
    }
    if (cricketTimerRef.current) {
      clearInterval(cricketTimerRef.current);
      cricketTimerRef.current = null;
    }
    if (envGainNodeRef.current) {
      try {
        envGainNodeRef.current.disconnect();
      } catch (e) {}
      envGainNodeRef.current = null;
    }
  };

  const startSoundEnvironment = (env: typeof soundEnv) => {
    stopSoundEnvironment();
    if (env === 'silence') return;

    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const envGain = ctx.createGain();
      const targetVolume = getAmbientVolumeTarget();
      envGain.gain.setValueAtTime(0, ctx.currentTime);
      envGain.gain.linearRampToValueAtTime(targetVolume, ctx.currentTime + 1.5);
      envGain.connect(ctx.destination);
      envGainNodeRef.current = envGain;

      // Generate brown noise buffer (deep, rich natural warmth)
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;
      noiseSourceRef.current = noiseSource;

      // Lowpass and modulation filters based on selected nature weather
      if (env === 'ocean' || env === 'rain' || env === 'forest' || env === 'hearth') {
        const lowpass = ctx.createBiquadFilter();
        lowpass.type = 'lowpass';

        if (env === 'ocean') {
          lowpass.frequency.setValueAtTime(250, ctx.currentTime);
          const lfo = ctx.createOscillator();
          lfo.frequency.setValueAtTime(0.08, ctx.currentTime); // Low frequency wave swells
          const lfoGain = ctx.createGain();
          lfoGain.gain.setValueAtTime(120, ctx.currentTime);

          lfo.connect(lfoGain);
          lfoGain.connect(lowpass.frequency);
          lfo.start();

          noiseSource.connect(lowpass);
          lowpass.connect(envGain);
        } 
        else if (env === 'rain') {
          lowpass.frequency.setValueAtTime(750, ctx.currentTime);
          const bandpass = ctx.createBiquadFilter();
          bandpass.type = 'bandpass';
          bandpass.frequency.setValueAtTime(1100, ctx.currentTime);
          bandpass.Q.setValueAtTime(1.2, ctx.currentTime);

          noiseSource.connect(lowpass);
          lowpass.connect(envGain);
          noiseSource.connect(bandpass);
          bandpass.connect(envGain);
        }
        else if (env === 'forest') {
          lowpass.frequency.setValueAtTime(400, ctx.currentTime);
          const windLfo = ctx.createOscillator();
          windLfo.frequency.setValueAtTime(0.06, ctx.currentTime);
          const windGain = ctx.createGain();
          windGain.gain.setValueAtTime(180, ctx.currentTime);

          windLfo.connect(windGain);
          windGain.connect(lowpass.frequency);
          windLfo.start();

          noiseSource.connect(lowpass);
          lowpass.connect(envGain);
        }
        else if (env === 'hearth') {
          lowpass.frequency.setValueAtTime(170, ctx.currentTime);
          noiseSource.connect(lowpass);
          lowpass.connect(envGain);

          // Wood crackles synthesizer
          const clickOsc = ctx.createOscillator();
          clickOsc.type = 'sawtooth';
          clickOsc.frequency.setValueAtTime(7500, ctx.currentTime);
          const clickGain = ctx.createGain();
          clickGain.gain.setValueAtTime(0, ctx.currentTime);

          clickOsc.connect(clickGain);
          clickGain.connect(envGain);
          clickOsc.start();

          cricketTimerRef.current = setInterval(() => {
            if (Math.random() > 0.45) {
              const now = ctx.currentTime;
              clickGain.gain.setValueAtTime(0.07, now);
              clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);
            }
          }, 90);
        }
      } 
      else if (env === 'crickets') {
        const carrier = ctx.createOscillator();
        carrier.type = 'sine';
        carrier.frequency.setValueAtTime(4000, ctx.currentTime);
        const cricketGain = ctx.createGain();
        cricketGain.gain.setValueAtTime(0, ctx.currentTime);

        carrier.connect(cricketGain);
        cricketGain.connect(envGain);
        carrier.start();

        let count = 0;
        cricketTimerRef.current = setInterval(() => {
          count++;
          if (count % 8 < 3) {
            const now = ctx.currentTime;
            cricketGain.gain.setValueAtTime(0.04, now);
            cricketGain.gain.setValueAtTime(0, now + 0.04);
          }
        }, 160);
      }

      noiseSource.start();
    } catch (e) {
      console.warn('Procedural Web Audio failure:', e);
    }
  };

  const getVoiceProfile = (id: TenderVoiceId): TenderVoiceProfile =>
    TENDER_VOICES.find(v => v.id === id) || TENDER_VOICES[0];

  // ---- Lovable AI streaming TTS ----

  // Split into chunks that stay well under the model input cap and start at sentence boundaries
  const chunkForTTS = (text: string, maxChars = 900): string[] => {
    const sentences = text.match(/[^.!?\n]+[.!?]?[\n]?|\n+/g) ?? [text];
    const chunks: string[] = [];
    let current = '';
    const flush = () => { if (current.trim()) chunks.push(current.trim()); current = ''; };
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
    return chunks;
  };

  const stopAiTts = () => {
    if (ttsAbortRef.current) {
      try { ttsAbortRef.current.abort(); } catch {}
      ttsAbortRef.current = null;
    }
    for (const src of ttsSourcesRef.current) {
      try { src.stop(); } catch {}
      try { src.disconnect(); } catch {}
    }
    ttsSourcesRef.current = [];
    if (ttsGainRef.current) {
      try { ttsGainRef.current.disconnect(); } catch {}
      ttsGainRef.current = null;
    }
    ttsPlayheadRef.current = 0;
  };

  const stopBrowserSpeech = () => {
    browserSessionRef.current += 1;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (ttsModeRef.current === 'browser') {
      ttsModeRef.current = null;
    }
  };

  const teardownTts = () => {
    ttsSessionIdRef.current += 1;
    stopAiTts();
    stopBrowserSpeech();
  };

  const ensureAudioUnlocked = async (): Promise<AudioContext> => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    if (ctx.state !== 'running') {
      throw new Error('Audio playback blocked. Tap Listen to allow sound.');
    }
    return ctx;
  };

  const beginBrowserSpeech = (
    text: string,
    profile: TenderVoiceProfile,
    session: number,
  ) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      throw new Error('browser-speech-unavailable');
    }

    window.speechSynthesis.cancel();
    browserSessionRef.current = session;
    ttsModeRef.current = 'browser';

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    const voice = pickBrowserVoice(profile);
    if (voice) utterance.voice = voice;

    const voiceSettings: Record<TenderVoiceId, { rate: number; pitch: number }> = {
      joan: { rate: 0.88, pitch: 0.95 },
      grace: { rate: 0.82, pitch: 1.05 },
      peter: { rate: 0.78, pitch: 0.75 },
      daniel: { rate: 0.85, pitch: 0.85 },
    };
    const settings = voiceSettings[profile.id];
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;

    utterance.onstart = () => {
      if (browserSessionRef.current !== session) return;
      setIsPreparing(false);
      setIsReading(true);
      setIsPaused(false);
      setSpeechError(null);
    };

    utterance.onboundary = (ev) => {
      if (browserSessionRef.current !== session) return;
      const prefix = text.slice(0, ev.charIndex);
      setCurrentWordIndex(prefix.trim().split(/\s+/).filter(Boolean).length);
    };

    utterance.onend = () => {
      if (browserSessionRef.current !== session) return;
      setIsReading(false);
      setIsPreparing(false);
      setIsPaused(false);
      setCurrentWordIndex(-1);
      ttsModeRef.current = null;
    };

    utterance.onerror = (ev) => {
      if (browserSessionRef.current !== session) return;
      ttsModeRef.current = null;
      if (ev.error === 'interrupted' || ev.error === 'canceled') return;
      setSpeechError(`${formatSpeechError(ev.error || 'browser-speech-failed')} Tap Listen to try again.`);
      setIsReading(false);
      setIsPreparing(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleBrowserReading = (
    textToUse?: string,
    voiceOverride?: TenderVoiceId,
  ) => {
    const textSrc = (textToUse !== undefined ? textToUse : inputText).trim();
    if (!textSrc) return;

    stopAiTts();
    stopBrowserSpeech();
    setSpeechError(null);
    setIsPreparing(true);
    setIsReading(false);
    setIsPaused(false);
    setCurrentWordIndex(-1);
    setWordsList(textSrc.split(/\s+/));

    const profile = getVoiceProfile(voiceOverride || tenderVoice);
    const session = ++ttsSessionIdRef.current;

    try {
      beginBrowserSpeech(textSrc, profile, session);
    } catch (err: any) {
      setSpeechError(`${formatSpeechError(err?.message)} Tap Listen to try again.`);
      setIsPreparing(false);
    }
  };

  const streamTtsChunk = async (
    ctx: AudioContext,
    gain: GainNode,
    session: number,
    text: string,
    voice: string,
    instructions: string,
    abort: AbortController,
    onFirstAudio: () => void,
  ): Promise<void> => {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice, instructions }),
      signal: abort.signal,
    });
    if (!res.ok || !res.body) {
      const msg = await res.text().catch(() => '');
      try {
        const json = JSON.parse(msg);
        throw new Error(json.error || json.code || msg || `TTS request failed (${res.status})`);
      } catch (parseErr) {
        if (parseErr instanceof Error && parseErr.message !== msg && !parseErr.message.startsWith('TTS request failed')) {
          throw parseErr;
        }
        throw new Error(msg || `TTS request failed (${res.status})`);
      }
    }

    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = '';
    let pending = new Uint8Array(0);
    let firstEmitted = false;

    const emitPcm = (incoming: Uint8Array) => {
      if (ttsSessionIdRef.current !== session) return;
      const bytes = new Uint8Array(pending.length + incoming.length);
      bytes.set(pending);
      bytes.set(incoming, pending.length);
      const usable = bytes.length - (bytes.length % 2);
      pending = bytes.slice(usable);
      if (usable === 0) return;
      const samples = new Int16Array(bytes.buffer, 0, usable / 2);
      const floats = Float32Array.from(samples, s => s / 32768);
      const buf = ctx.createBuffer(1, floats.length, 24000);
      buf.copyToChannel(floats, 0);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(gain);
      if (ttsPlayheadRef.current === 0) {
        ttsPlayheadRef.current = ctx.currentTime + 0.08;
      } else {
        ttsPlayheadRef.current = Math.max(ttsPlayheadRef.current, ctx.currentTime);
      }
      src.start(ttsPlayheadRef.current);
      ttsPlayheadRef.current += buf.duration;
      ttsSourcesRef.current.push(src);
      src.onended = () => {
        ttsSourcesRef.current = ttsSourcesRef.current.filter(x => x !== src);
        try { src.disconnect(); } catch {}
      };
      if (!firstEmitted) {
        firstEmitted = true;
        onFirstAudio();
      }
    };

    const handleEvent = (data: string) => {
      if (!data) return;
      let payload: any;
      try { payload = JSON.parse(data); } catch { return; }
      if (payload?.type !== 'speech.audio.delta' || !payload.audio) return;
      const binary = atob(payload.audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      emitPcm(bytes);
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (ttsSessionIdRef.current !== session) { try { reader.cancel(); } catch {} return; }
      buffer += value;
      let idx: number;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const block = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        for (const line of block.split('\n')) {
          if (line.startsWith('data: ')) handleEvent(line.slice(6));
          else if (line.startsWith('data:')) handleEvent(line.slice(5).trim());
        }
      }
    }
  };

  const handleStartReading = (
    textToUse?: string,
    voiceOverride?: TenderVoiceId,
  ) => {
    const textSrc = (textToUse !== undefined ? textToUse : inputText).trim();
    if (!textSrc) return;

    stopAiTts();
    stopBrowserSpeech();
    setSpeechError(null);
    setIsPreparing(true);
    setIsReading(false);
    setIsPaused(false);
    setCurrentWordIndex(-1);
    setWordsList(textSrc.split(/\s+/));

    const profile = getVoiceProfile(voiceOverride || tenderVoice);
    const session = ++ttsSessionIdRef.current;

    const run = async () => {
      let ctx: AudioContext;
      try {
        ctx = await ensureAudioUnlocked();
      } catch (e: any) {
        setSpeechError(formatSpeechError(e?.message || 'audio-init-failed'));
        setIsPreparing(false);
        return;
      }

      const gain = ctx.createGain();
      gain.gain.value = 1.0;
      gain.connect(ctx.destination);
      ttsGainRef.current = gain;
      ttsPlayheadRef.current = 0;

      const abort = new AbortController();
      ttsAbortRef.current = abort;

      try {
        const chunks = chunkForTTS(textSrc);
        let gotAudio = false;
        for (const chunk of chunks) {
          if (ttsSessionIdRef.current !== session) return;
          await streamTtsChunk(ctx, gain, session, chunk, profile.ttsVoice, profile.instructions, abort, () => {
            if (ttsSessionIdRef.current !== session) return;
            gotAudio = true;
            setIsPreparing(false);
            setIsReading(true);
            ttsModeRef.current = 'ai';
          });
        }
        if (!gotAudio) {
          throw new Error('No audio received from voice service.');
        }
        if (ttsSessionIdRef.current !== session) return;
        const remaining = Math.max(0, ttsPlayheadRef.current - ctx.currentTime);
        setTimeout(() => {
          if (ttsSessionIdRef.current !== session) return;
          setIsReading(false);
          setIsPreparing(false);
          setIsPaused(false);
          setCurrentWordIndex(-1);
          ttsModeRef.current = null;
        }, remaining * 1000 + 200);
      } catch (err: any) {
        if (abort.signal.aborted || ttsSessionIdRef.current !== session) return;
        stopAiTts();

        if (shouldFallbackToBrowserTts(err?.message)) {
          apiUnavailableRef.current = true;
          setSpeechError('Studio voice unavailable. Tap Listen again to use your browser narrator.');
          setIsReading(false);
          setIsPreparing(false);
          return;
        } else {
          setSpeechError(formatSpeechError(err?.message));
        }
        setIsReading(false);
        setIsPreparing(false);
      }
    };
    void run();
  };

  const handlePauseToggle = () => {
    if (ttsModeRef.current === 'browser') {
      if (typeof window === 'undefined' || !window.speechSynthesis) return;
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
      return;
    }

    const ctx = audioCtxRef.current;
    if (!ctx || !isReading) return;
    if (isPaused) {
      ctx.resume().then(() => setIsPaused(false)).catch(() => setIsPaused(false));
    } else {
      ctx.suspend().then(() => setIsPaused(true)).catch(() => setIsPaused(true));
    }
  };

  const handlePlayToggle = () => {
    if (isReading) {
      handlePauseToggle();
      return;
    }

    setSpeechError(null);

    if (soundEnv !== 'silence') {
      startSoundEnvironment(soundEnv);
    }

    if (apiUnavailableRef.current) {
      handleBrowserReading(inputText);
      void ensureAudioUnlocked().catch(() => {});
      return;
    }

    void (async () => {
      try {
        await ensureAudioUnlocked();
      } catch (e: any) {
        setSpeechError(formatSpeechError(e?.message || 'audio-blocked'));
        return;
      }
      handleStartReading(inputText);
    })();
  };

  const stopReading = (stopAmbient = true) => {
    if (speakTimeoutRef.current) {
      clearTimeout(speakTimeoutRef.current);
    }
    teardownTts();
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    setIsReading(false);
    setIsPreparing(false);
    setIsPaused(false);
    setCurrentWordIndex(-1);
    
    if (stopAmbient) {
      stopSoundEnvironment();
    }
  };

  const handleVoiceChange = (voice: TenderVoiceId) => {
    setTenderVoice(voice);
    if (isReading) {
      stopReading(false);
      setTimeout(() => {
        if (apiUnavailableRef.current) {
          handleBrowserReading(inputText, voice);
        } else {
          handleStartReading(inputText, voice);
        }
      }, 150);
    }
  };

  const handlePresetSelect = (preset: typeof PRESETS[0]) => {
    stopReading(true);
    setInputText(preset.text);
    setIsEditMode(false);
    
    // Automatically match appropriate ambient weather backdrop for the preset
    let backdrop: typeof soundEnv = 'silence';
    if (preset.id === 'solitude') backdrop = 'ocean';
    if (preset.id === 'reflection') backdrop = 'rain';
    setSoundEnv(backdrop);
  };

  // Renders the prose text with active word-by-word highlights
  const renderContemplativeText = () => {
    let wordCounter = 0;
    const paragraphs = inputText.split('\n\n');
    
    return paragraphs.map((paragraph, pIdx) => {
      const parts = paragraph.split(/(\s+)/);
      return (
        <p key={pIdx} className="mb-5 font-serif text-sm sm:text-[15px] leading-relaxed tracking-wide text-left">
          {parts.map((part, index) => {
            const isWord = /\S/.test(part);
            const currentIdx = wordCounter;
            if (isWord) {
              wordCounter++;
            }
            
            const isCurrent = isReading && isWord && currentIdx === currentWordIndex;
            
            return (
              <span
                key={index}
                className={`transition-all duration-150 rounded px-0.5 ${
                  isCurrent
                    ? currentTheme === 'night'
                      ? 'text-[#f3efe8] font-bold bg-[#d4b05a]/20 drop-shadow-[0_0_12px_rgba(196,160,68,0.6)] scale-[1.03] inline-block'
                      : 'text-[#8a6f2e] font-bold bg-[#d4b05a]/25 drop-shadow-[0_0_12px_rgba(184,149,107,0.4)] scale-[1.03] inline-block'
                    : isReading 
                      ? currentTheme === 'night' ? 'text-white/40' : 'text-zinc-400'
                      : currentTheme === 'night' ? 'text-white/80' : 'text-zinc-800'
                }`}
              >
                {part}
              </span>
            );
          })}
        </p>
      );
    });
  };

  // Aesthetic theme colors definitions
  const isNight = currentTheme === 'night';
  const theme = getThemeStyles(currentTheme);
  const styles = {
    cardBg: theme.cardBg,
    innerBg: theme.innerBg,
    titleText: theme.text,
    mutedText: theme.textMuted,
    accentText: theme.accent,
    accentBorder: isNight ? 'border-[#d4b05a]/30' : 'border-[#b8956b]/30',
    badgeActive: isNight
      ? 'bg-[#d4b05a]/12 border-[#d4b05a] text-[#d4b05a]'
      : 'bg-[#d4b05a]/10 border-[#b8956b] text-[#b8956b] font-medium',
    badgeInactive: isNight
      ? 'bg-black/20 border-white/5 text-white/40 hover:text-white/80 hover:border-white/10'
      : 'bg-white/40 border-stone-200/50 text-stone-600 hover:text-[#8a6f2e] hover:bg-white',
  };

  return (
    <div 
      className={`flex flex-col w-full max-w-4xl mx-auto p-5 sm:p-7 rounded-2xl border relative overflow-hidden ${styles.cardBg}`}
      id="the-tender-section"
    >
      {/* Visual background subtle warm aura */}
      <div className={`absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl pointer-events-none z-0 ${isNight ? 'bg-[#d4b05a]/[0.04]' : 'bg-[#d4b05a]/[0.06]'}`} />
      
      {/* 1. Header Section */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 mb-5 border-accent/10">
        <div className="text-left">
          <span className="font-mono text-[9px] tracking-widest uppercase opacity-60 block">04 — Guided Somatic Narration</span>
          <h2 className={`font-serif text-2xl font-normal tracking-wide mt-0.5 ${styles.titleText}`}>The Tender</h2>
          <p className={`font-sans text-[10px] italic mt-0.5 ${styles.mutedText}`}>
            A gentle spoken voice to guide your reflection, accompanied by soothing natural acoustics
          </p>
        </div>

        {/* Action button to quickly toggling custom editing */}
        <button
          id="toggle-edit-mode-btn"
          onClick={() => {
            stopReading(true);
            setIsEditMode(!isEditMode);
          }}
          className={`mt-3 sm:mt-0 px-4 py-2 rounded-full border font-display text-[9px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${
            isEditMode ? styles.badgeActive : styles.badgeInactive
          }`}
        >
          {isEditMode ? (
            <>
              <Check className="w-3 h-3" /> Reading Mode
            </>
          ) : (
            <>
              <Edit2 className="w-3 h-3" /> Edit Prose Text
            </>
          )}
        </button>
      </div>

      {/* 2. Preset Contemplative Selection Bar */}
      <div className="relative z-10 mb-5">
        <span className="font-mono text-[8px] uppercase tracking-widest block text-left mb-2 opacity-50">
          Select Contemplative Prose Preset
        </span>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => {
            const isSelected = !isEditMode && inputText === preset.text;
            return (
              <button
                key={preset.id}
                id={`preset-tab-${preset.id}`}
                onClick={() => handlePresetSelect(preset)}
                className={`px-4 py-2 rounded-full border font-sans text-xs text-left transition-all cursor-pointer ${
                  isSelected ? styles.badgeActive : styles.badgeInactive
                }`}
              >
                <div className="font-serif font-semibold">{preset.title}</div>
                <div className="text-[9px] opacity-60 font-mono mt-0.5 uppercase tracking-tight">{preset.author}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Main Workspace Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: The Sanctuary Reader Card (Takes up 7 cols) */}
        <div className="md:col-span-7 flex flex-col gap-4">
          <div className={`p-5 sm:p-6 rounded-xl border text-left flex flex-col justify-between min-h-[310px] relative overflow-hidden ${styles.innerBg}`}>
            
            {/* Visual focus aura while speaking */}
            <AnimatePresence>
              {isReading && !isPaused && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-accent/[0.015] pointer-events-none"
                />
              )}
            </AnimatePresence>

            <div>
              <div className="flex items-center justify-between border-b pb-2.5 mb-4 border-zinc-200/10" style={{ borderColor: isNight ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                <div className="flex items-center gap-1.5">
                  <Headphones className={`w-3.5 h-3.5 ${styles.accentText}`} />
                  <span className={`font-mono text-[9px] uppercase tracking-widest ${styles.mutedText}`}>
                    {isEditMode ? 'Text Composer' : 'Guided Reading Sanctuary'}
                  </span>
                </div>
                
                {/* Micro soundwave pulse when speaking */}
                {isReading && !isPaused && (
                  <span className="flex items-end gap-[1.5px] h-3">
                    <span className="w-[1.5px] bg-[#d4b05a] rounded-full animate-[pulse_0.5s_infinite_alternate]" style={{ height: '35%' }}></span>
                    <span className="w-[1.5px] bg-[#d4b05a] rounded-full animate-[pulse_0.7s_infinite_alternate_0.15s]" style={{ height: '90%' }}></span>
                    <span className="w-[1.5px] bg-[#d4b05a] rounded-full animate-[pulse_0.6s_infinite_alternate_0.1s]" style={{ height: '60%' }}></span>
                  </span>
                )}
              </div>

              {/* Contemplative Content (Formatted read view vs Custom Textarea edit mode) */}
              <div className="max-h-[220px] overflow-y-auto pr-1 select-text scrollbar-thin">
                {isEditMode ? (
                  <textarea
                    id="tender-custom-textarea"
                    rows={8}
                    className={`w-full p-3 rounded-2xl border text-xs sm:text-sm font-serif leading-relaxed focus:outline-none focus:border-[#d4b05a] ${
                      isNight ? 'bg-black/60 border-white/10 text-white placeholder-white/20' : 'bg-white/80 border-zinc-300 text-zinc-900 placeholder-zinc-400'
                    }`}
                    placeholder="Write or paste your custom journal writing, meditation prose, or daily reflections here..."
                    value={inputText}
                    onChange={(e) => {
                      stopReading(true);
                      setInputText(e.target.value);
                    }}
                  />
                ) : (
                  <div className="transition-all duration-300">
                    {inputText.trim() ? (
                      renderContemplativeText()
                    ) : (
                      <p className={`font-serif text-sm italic ${styles.mutedText}`}>
                        No prose text loaded. Select a preset above or toggle the "Edit Prose Text" button to compose your own.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Diagnostics Warnings */}
            {speechError && (
              <div className="mt-4 p-3 bg-red-950/15 border border-red-500/10 rounded-xl text-xs font-sans text-red-300/90 leading-relaxed">
                {formatSpeechError(speechError)}
              </div>
            )}

            {/* Bottom Playback Deck */}
            <div className="border-t pt-4 mt-4 flex items-center justify-between border-zinc-200/10" style={{ borderColor: isNight ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
              
              {/* Dynamic Status Display */}
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  {isPreparing && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e8cc6a] opacity-75"></span>
                  )}
                  {isReading && !isPaused && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    isPreparing ? 'bg-[#e8cc6a]' : isReading ? (isPaused ? 'bg-[#e8cc6a]' : 'bg-emerald-400') : 'bg-zinc-500'
                  }`}></span>
                </span>
                <span className="font-mono text-[8px] uppercase tracking-widest opacity-60">
                  {isPreparing ? 'Loading Voice' : isReading ? (isPaused ? 'Narrator Paused' : 'Narrating') : 'Ready'}
                </span>
              </div>

              {/* Action Trigger Buttons */}
              <div className="flex gap-1.5">
                {/* PLAY / PAUSE */}
                <button
                  id="tender-play-toggle-btn"
                  disabled={isPreparing || isEditMode || !inputText.trim()}
                  onClick={handlePlayToggle}
                  className={`px-5 py-2 rounded-full font-display text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                    isReading && !isPaused
                      ? isNight 
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25'
                        : 'bg-emerald-600/15 text-emerald-800 border border-emerald-500/30 hover:bg-emerald-500/25'
                      : isNight
                        ? 'bg-[#d4b05a] text-white hover:bg-[#d4b05a]/90 hover:scale-[1.02]'
                        : 'bg-gradient-to-r from-[#b8956b] to-[#d4b05a] text-white hover:shadow-md hover:scale-[1.02]'
                  }`}
                >
                  {isReading && !isPaused ? (
                    <>
                      <Pause className="w-3 h-3 fill-current" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-current translate-x-[0.5px]" /> {isReading ? 'Resume' : 'Listen'}
                    </>
                  )}
                </button>

                {/* STOP */}
                <button
                  id="tender-stop-btn"
                  disabled={!isReading && !isPreparing}
                  onClick={() => stopReading(true)}
                  className={`px-4 py-2 border disabled:opacity-20 disabled:cursor-not-allowed rounded-full font-display text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all ${
                    isNight
                      ? 'bg-red-950/15 hover:bg-red-950/35 text-red-300 border-red-500/10'
                      : 'bg-red-50/50 hover:bg-red-100 text-red-800 border-red-200'
                  }`}
                  title="Stop Narration & Acoustics"
                >
                  <Square className="w-2.5 h-2.5" /> Stop
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: The Acoustic Console Bento Box (Takes up 5 cols) */}
        <div className="md:col-span-5 flex flex-col gap-4">
          
          {/* Tender Voice Selection */}
          <div className={`p-4 rounded-xl border flex flex-col justify-between ${styles.innerBg}`}>
            <div className="flex items-center gap-1.5 border-b pb-2 mb-3 border-zinc-200/10" style={{ borderColor: isNight ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
              <Sliders className={`w-3.5 h-3.5 ${styles.accentText}`} />
              <span className={`font-mono text-[9px] uppercase tracking-widest ${styles.mutedText}`}>
                Tender Voice
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {TENDER_VOICES.map((v) => {
                const isSelected = tenderVoice === v.id;
                return (
                  <button
                    id={`voice-custom-btn-${v.id}`}
                    key={v.id}
                    onClick={() => handleVoiceChange(v.id)}
                    className="px-2.5 py-2 rounded border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5"
                    style={{
                      backgroundColor: isSelected 
                        ? isNight ? 'rgba(196,160,68,0.12)' : 'rgba(184,149,107,0.12)' 
                        : 'transparent',
                      borderColor: isSelected 
                        ? isNight ? '#d4b05a' : '#b8956b' 
                        : isNight ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)',
                      color: isSelected 
                        ? isNight ? '#d4b05a' : '#b8956b' 
                        : isNight ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)',
                    }}
                  >
                    <span className="font-serif text-[13px] tracking-wide leading-tight">{v.name}</span>
                    <span className="font-mono text-[8px] uppercase tracking-widest opacity-70">{v.descriptor}</span>
                  </button>
                );
              })}
            </div>
            <p className="font-sans text-[9.5px] italic text-left opacity-60 mt-2">
              Studio-grade AI voiceovers via Lovable AI. Each narrator reads the selected prose live with its own timbre, cadence and breath.
            </p>
          </div>

          {/* Environmental Sound Background Mixer */}
          <div className={`p-4 rounded-xl border flex flex-col justify-between ${styles.innerBg}`}>
            <div className="flex items-center gap-1.5 border-b pb-2 mb-3 border-zinc-200/10" style={{ borderColor: isNight ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
              <Music className={`w-3.5 h-3.5 ${styles.accentText}`} />
              <span className={`font-mono text-[9px] uppercase tracking-widest ${styles.mutedText}`}>
                Nature Weather Backdrop
              </span>
            </div>

            <select
              id="tender-backdrop-select"
              value={soundEnv}
              onChange={(e: any) => setSoundEnv(e.target.value)}
              className={`w-full px-3 py-2 border text-[11px] rounded-full focus:outline-none font-mono cursor-pointer mb-3.5 ${
                isNight 
                  ? 'bg-black/60 border-white/10 text-[#d4b05a] focus:border-[#d4b05a]' 
                  : 'bg-white/80 border-[#d4b05a]/30 text-[#b8956b] focus:border-[#b8956b]'
              }`}
            >
              <option value="silence">Silence (Pure Narration)</option>
              <option value="rain">Rain (Lowpass Brown Noise)</option>
              <option value="forest">Forest (Pink Wind Gusts)</option>
              <option value="ocean">Ocean (Slow Wave Swells)</option>
              <option value="hearth">Hearth fire (Crackling embers)</option>
              <option value="crickets">Night crickets (Sine chirping)</option>
            </select>

            {/* Environmental Backdrop Volume Slider */}
            {soundEnv !== 'silence' ? (
              <div className={`flex items-center gap-3 px-3 py-2 rounded border ${isNight ? 'bg-black/40 border-white/5' : 'bg-white border-zinc-100'}`}>
                <Volume2 className={`w-3.5 h-3.5 ${styles.accentText}`} />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={ambientVolume}
                  onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                  className="flex-1 h-0.5 rounded-lg appearance-none cursor-pointer accent-[#d4b05a] bg-[#d4b05a]/10"
                  id="tender-backdrop-volume"
                />
                <span className="font-mono text-[8px] opacity-75 w-6 text-right">
                  {Math.round(ambientVolume * 100)}%
                </span>
              </div>
            ) : (
              <div className={`text-center p-2.5 border rounded font-sans text-[10px] italic ${styles.mutedText}`} style={{ borderColor: isNight ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)' }}>
                Acoustics are currently set to silent.
              </div>
            )}
          </div>

          {/* Interactive Guided Info Box */}
          <div className={`p-4 rounded-xl border text-left ${styles.innerBg}`}>
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className={`w-3.5 h-3.5 ${styles.accentText}`} />
              <span className={`font-mono text-[9px] uppercase tracking-widest ${styles.mutedText}`}>
                How it works
              </span>
            </div>
            <p className="font-sans text-[10px] leading-relaxed opacity-75">
              The somatic narrator engine uses your operating system's native text-to-speech API to narrate contemplative prose. As you listen, our local Web Audio synthesizes real-time natural frequency backdrops, smoothly ducking in volume to keep the voice clean, warm, and comforting.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
