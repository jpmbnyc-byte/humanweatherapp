import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Volume2, Play, Pause, Square, Music, Headphones, Sliders, Edit2, Check } from 'lucide-react';
import { PRESETS } from '../data/presets';

type TenderVoiceId = 'joan' | 'grace' | 'peter' | 'daniel';
interface TenderVoiceProfile {
  id: TenderVoiceId;
  name: string;
  descriptor: string;
  // kokoro-js voice id + speed — the entire KiKi voice system (HW_HARNESS.md §6).
  // Placeholder ids/speeds from the Kokoro Voice Protocol; swap after casting.
  kokoroId: string;
  speed: number;
}
const TENDER_VOICES: TenderVoiceProfile[] = [
  { id: 'joan', name: 'Joan', descriptor: 'Warm · Grounded', kokoroId: 'af_heart', speed: 0.88 },
  { id: 'grace', name: 'Grace', descriptor: 'Gentle · Airy', kokoroId: 'af_nicole', speed: 0.85 },
  { id: 'peter', name: 'Peter', descriptor: 'Deep · Anchored', kokoroId: 'bm_george', speed: 0.92 },
  { id: 'daniel', name: 'Daniel', descriptor: 'Resonant · Measured', kokoroId: 'am_michael', speed: 0.9 },
];

// ---- Kokoro voice engine (offline, perpetual, owned — HW_HARNESS.md §6 / Kokoro Voice Protocol) ----
// Pinned per the protocol: freeze the library + model revision, never `@latest`.
const KOKORO_CDN = 'https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/+esm';
const KOKORO_MODEL = 'onnx-community/Kokoro-82M-v1.0-ONNX';

// Module-level singletons so the ~86MB model loads once per session and is reused
// across mounts (the browser also Cache-Storage-caches it for instant offline reloads).
let kokoroEngine: any = null;
let kokoroLoading: Promise<any> | null = null;

async function loadVoiceEngine(onProgress?: (pct: number) => void): Promise<any> {
  if (kokoroEngine) return kokoroEngine;
  if (!kokoroLoading) {
    kokoroLoading = (async () => {
      const mod: any = await import(/* @vite-ignore */ KOKORO_CDN);
      const KokoroTTS = mod.KokoroTTS ?? mod.default?.KokoroTTS;
      // Run onnxruntime inference in a Web Worker (off the main thread) so generation
      // never blocks/freezes the UI — the foundation of butter-smooth playback. Requires
      // cross-origin isolation (COOP/COEP headers in vite.config.ts) for SharedArrayBuffer.
      try {
        const env = mod.env ?? mod.default?.env;
        if (env?.backends?.onnx?.wasm) {
          env.backends.onnx.wasm.proxy = true;
        }
      } catch {
        /* proxy is an optimization; fall through if unavailable */
      }
      const engine = await KokoroTTS.from_pretrained(KOKORO_MODEL, {
        dtype: 'q8', // ~86MB quantized — best size/quality balance for mobile
        device: 'wasm', // ship wasm default; WebGPU is inconsistent on iOS/Safari
        progress_callback: (info: any) => {
          if (info && typeof info.progress === 'number') onProgress?.(Math.round(info.progress));
        },
      });
      kokoroEngine = engine;
      return engine;
    })();
  }
  try {
    return await kokoroLoading;
  } catch (e) {
    kokoroLoading = null; // allow retry after a failed load
    throw e;
  }
}

// Escape hatch (Protocol §3.3): clear the transformers.js model cache + reset the engine.
async function resetVoiceEngine(): Promise<void> {
  kokoroEngine = null;
  kokoroLoading = null;
  try {
    if (typeof caches !== 'undefined') {
      for (const key of await caches.keys()) {
        if (/transformers|kokoro|onnx|huggingface/i.test(key)) await caches.delete(key);
      }
    }
  } catch {
    /* best-effort */
  }
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
  const [loadProgress, setLoadProgress] = useState<number | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [ambientVolume, setAmbientVolume] = useState(0.4);
  const [isEditMode, setIsEditMode] = useState(false);

  // Web Audio and Speech refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const envGainNodeRef = useRef<GainNode | null>(null);
  const cricketTimerRef = useRef<any>(null);
  const speakTimeoutRef = useRef<any>(null);

  // Kokoro playback refs
  const ttsGainRef = useRef<GainNode | null>(null);
  const ttsSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const ttsPlayheadRef = useRef<number>(0);
  const ttsSessionIdRef = useRef<number>(0);

  // Active word list cache for matching onboundary indices
  const [wordsList, setWordsList] = useState<string[]>([]);

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

  // ---- Kokoro in-browser TTS (offline, perpetual — HW_HARNESS.md §6 / Kokoro Voice Protocol) ----

  // Split prose into sentence-sized chunks so we can generate sentence n+1 while n plays.
  const chunkForTTS = (text: string): string[] => {
    const matches = text.match(/[^.!?\n]+[.!?]+["']?|\S[^.!?\n]*(?=\n|$)/g);
    const chunks = (matches ?? [text]).map(s => s.trim()).filter(Boolean);
    return chunks.length ? chunks : [text.trim()];
  };

  // Edge-case pronunciation pre-processing — fix at the input, never in the prose (Protocol §2.5).
  const preprocessProse = (text: string): string =>
    text
      .replace(/\u2026/g, ', ') // ellipsis → a breath
      .replace(/\s*\u2014\s*/g, ', ') // em dash → a breath
      .replace(/\bJn\b/g, 'John')
      .replace(/\bPs\b/g, 'Psalm')
      .replace(/\s+/g, ' ')
      .trim();

  const teardownTts = () => {
    ttsSessionIdRef.current += 1;
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

  // Queue a decoded mono buffer gaplessly against the shared playhead. A 0.2s lead-in on the
  // first buffer absorbs generation jitter; every later sentence is scheduled exactly where the
  // previous one ends, so playback is butter-smooth with no clicks or gaps between sentences.
  const scheduleAudio = (
    ctx: AudioContext,
    gain: GainNode,
    session: number,
    samples: Float32Array,
    sampleRate: number,
  ) => {
    if (ttsSessionIdRef.current !== session || !samples?.length) return;
    const buf = ctx.createBuffer(1, samples.length, sampleRate);
    buf.copyToChannel(samples instanceof Float32Array ? samples : Float32Array.from(samples), 0);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(gain);
    const startAt =
      ttsPlayheadRef.current === 0
        ? ctx.currentTime + 0.2
        : Math.max(ttsPlayheadRef.current, ctx.currentTime);
    src.start(startAt);
    ttsPlayheadRef.current = startAt + buf.duration;
    ttsSourcesRef.current.push(src);
    src.onended = () => {
      ttsSourcesRef.current = ttsSourcesRef.current.filter(x => x !== src);
      try { src.disconnect(); } catch {}
    };
  };

  const handleStartReading = (
    textToUse?: string,
    voiceOverride?: TenderVoiceId,
  ) => {
    const textSrc = (textToUse !== undefined ? textToUse : inputText).trim();
    if (!textSrc) return;

    teardownTts();
    setSpeechError(null);
    setIsPreparing(true);
    setIsReading(false);
    setIsPaused(false);
    setCurrentWordIndex(-1);
    setWordsList(textSrc.split(/\s+/));

    const profile = getVoiceProfile(voiceOverride || tenderVoice);

    if (!audioCtxRef.current) {
      try {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e: any) {
        setSpeechError(e?.message || 'audio-init-failed');
        setIsPreparing(false);
        return;
      }
    }
    const ctx = audioCtxRef.current;
    // Resume within the user gesture (iOS autoplay policy — Protocol §2.2).
    const ensureRunning = ctx.state === 'suspended' ? ctx.resume().catch(() => {}) : Promise.resolve();

    const gain = ctx.createGain();
    gain.gain.value = 1.0;
    gain.connect(ctx.destination);
    ttsGainRef.current = gain;
    ttsPlayheadRef.current = 0;

    const session = ++ttsSessionIdRef.current;

    const run = async () => {
      await ensureRunning;
      try {
        // Lazy-load the engine on first tap (Protocol §1.2) — cached & offline thereafter.
        const engine = await loadVoiceEngine(pct => {
          if (ttsSessionIdRef.current === session) setLoadProgress(pct);
        });
        if (ttsSessionIdRef.current !== session) return;
        setLoadProgress(null);

        const sentences = chunkForTTS(preprocessProse(textSrc));
        // Generate the first sentence, then generate n+1 while n plays (Protocol §1.4).
        let nextGen: Promise<any> = engine.generate(sentences[0], {
          voice: profile.kokoroId,
          speed: profile.speed,
        });
        for (let i = 0; i < sentences.length; i++) {
          if (ttsSessionIdRef.current !== session) return;
          const audio: any = await nextGen;
          if (i + 1 < sentences.length) {
            nextGen = engine.generate(sentences[i + 1], { voice: profile.kokoroId, speed: profile.speed });
          }
          if (ttsSessionIdRef.current !== session) return;
          const samples: Float32Array = audio?.audio ?? audio?.data ?? audio;
          const sampleRate: number = audio?.sampling_rate ?? audio?.sampleRate ?? 24000;
          scheduleAudio(ctx, gain, session, samples, sampleRate);
          if (i === 0) {
            setIsPreparing(false);
            setIsReading(true);
          }
        }
        if (ttsSessionIdRef.current !== session) return;
        // Resolve the reading state once the last scheduled buffer has finished playing.
        const remaining = Math.max(0, ttsPlayheadRef.current - ctx.currentTime);
        speakTimeoutRef.current = setTimeout(() => {
          if (ttsSessionIdRef.current !== session) return;
          setIsReading(false);
          setIsPreparing(false);
          setIsPaused(false);
        }, remaining * 1000 + 200);
      } catch (err: any) {
        console.error('[tender] voice engine failed:', err);
        if (ttsSessionIdRef.current !== session) return;
        setLoadProgress(null);
        setSpeechError(err?.message || 'voice-failed');
        setIsReading(false);
        setIsPreparing(false);
      }
    };
    void run();
  };

  const handleRedownloadVoices = async () => {
    stopReading(true);
    setSpeechError(null);
    setLoadProgress(null);
    await resetVoiceEngine();
  };

  const handlePauseToggle = () => {
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
    } else {
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
      if (soundEnv !== 'silence') {
        startSoundEnvironment(soundEnv);
      }
      handleStartReading(inputText);
    }
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
        handleStartReading(inputText, voice);
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
                      ? 'text-[#ffd700] font-bold bg-amber-500/20 drop-shadow-[0_0_12px_rgba(234,179,8,0.6)] scale-[1.03] inline-block'
                      : 'text-amber-900 font-bold bg-amber-500/25 drop-shadow-[0_0_12px_rgba(217,119,6,0.4)] scale-[1.03] inline-block'
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
  const styles = {
    cardBg: isNight ? 'bg-[#121214]/80 border-white/[0.08] backdrop-blur-md' : 'bg-white/75 border-sky-300/40 backdrop-blur-md shadow-lg shadow-sky-100/30',
    innerBg: isNight ? 'bg-black/45 border-white/5' : 'bg-sky-50/50 border-sky-200/40',
    titleText: isNight ? 'text-[#f1f5f9]' : 'text-[#0f172a]',
    mutedText: isNight ? 'text-[#94a3b8]' : 'text-[#475569]',
    goldText: isNight ? 'text-[#eab308]' : 'text-[#d97706]',
    goldBorder: isNight ? 'border-[#eab308]/30' : 'border-amber-500/30',
    badgeActive: isNight ? 'bg-[#eab308]/12 border-[#eab308] text-[#eab308]' : 'bg-amber-500/10 border-amber-500 text-amber-700 font-medium',
    badgeInactive: isNight ? 'bg-black/20 border-white/5 text-white/40 hover:text-white/80 hover:border-white/10' : 'bg-white/40 border-sky-200/50 text-sky-800 hover:text-sky-950 hover:bg-white',
  };

  return (
    <div 
      className={`flex flex-col w-full max-w-4xl mx-auto p-5 sm:p-7 rounded-2xl border backdrop-blur-md relative overflow-hidden ${styles.cardBg}`}
      id="the-tender-section"
    >
      {/* Visual background subtle warm aura */}
      <div className={`absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl pointer-events-none z-0 ${isNight ? 'bg-amber-500/[0.03]' : 'bg-amber-500/[0.05]'}`} />
      
      {/* 1. Header Section */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 mb-5" style={{ borderColor: isNight ? 'rgba(196,168,74,0.1)' : 'rgba(158,130,48,0.15)' }}>
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
          className={`mt-3 sm:mt-0 px-3.5 py-1.5 rounded-lg border font-mono text-[9px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${
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
                className={`px-3 py-2 rounded-lg border font-sans text-xs text-left transition-all cursor-pointer ${
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
                  className="absolute inset-0 bg-gold/[0.015] pointer-events-none"
                />
              )}
            </AnimatePresence>

            <div>
              <div className="flex items-center justify-between border-b pb-2.5 mb-4 border-zinc-200/10" style={{ borderColor: isNight ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                <div className="flex items-center gap-1.5">
                  <Headphones className={`w-3.5 h-3.5 ${styles.goldText}`} />
                  <span className={`font-mono text-[9px] uppercase tracking-widest ${styles.mutedText}`}>
                    {isEditMode ? 'Text Composer' : 'Guided Reading Sanctuary'}
                  </span>
                </div>
                
                {/* Micro soundwave pulse when speaking */}
                {isReading && !isPaused && (
                  <span className="flex items-end gap-[1.5px] h-3">
                    <span className="w-[1.5px] bg-amber-500 rounded-full animate-[pulse_0.5s_infinite_alternate]" style={{ height: '35%' }}></span>
                    <span className="w-[1.5px] bg-amber-500 rounded-full animate-[pulse_0.7s_infinite_alternate_0.15s]" style={{ height: '90%' }}></span>
                    <span className="w-[1.5px] bg-amber-500 rounded-full animate-[pulse_0.6s_infinite_alternate_0.1s]" style={{ height: '60%' }}></span>
                  </span>
                )}
              </div>

              {/* Contemplative Content (Formatted read view vs Custom Textarea edit mode) */}
              <div className="max-h-[220px] overflow-y-auto pr-1 select-text scrollbar-thin">
                {isEditMode ? (
                  <textarea
                    id="tender-custom-textarea"
                    rows={8}
                    className={`w-full p-3 rounded-lg border text-xs sm:text-sm font-serif leading-relaxed focus:outline-none focus:border-amber-500 ${
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

            {/* One-time download notice */}
            {isPreparing && loadProgress !== null && (
              <div className="mt-4 p-2.5 bg-amber-950/15 border border-amber-500/15 rounded-lg text-[10px] font-mono text-amber-300 leading-normal">
                Preparing the voice — one-time download (~86MB), {loadProgress}%. Works fully offline after this.
              </div>
            )}

            {/* Diagnostics Warnings */}
            {speechError && (
              <div className="mt-4 p-2.5 bg-red-950/15 border border-red-500/10 rounded-lg text-[10px] font-mono text-red-300 leading-normal">
                ⚠️ The voice couldn't load. Check your connection for the first-time download, or use “Re-download voices” below.
              </div>
            )}

            {/* Bottom Playback Deck */}
            <div className="border-t pt-4 mt-4 flex items-center justify-between border-zinc-200/10" style={{ borderColor: isNight ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
              
              {/* Dynamic Status Display */}
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  {isPreparing && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  )}
                  {isReading && !isPaused && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    isPreparing ? 'bg-amber-400' : isReading ? (isPaused ? 'bg-amber-400' : 'bg-emerald-400') : 'bg-zinc-500'
                  }`}></span>
                </span>
                <span className="font-mono text-[8px] uppercase tracking-widest opacity-60">
                  {isPreparing
                    ? loadProgress !== null
                      ? `Preparing Voice · ${loadProgress}%`
                      : 'Preparing Voice'
                    : isReading
                      ? isPaused
                        ? 'Narrator Paused'
                        : 'Narrating'
                      : 'Ready'}
                </span>
              </div>

              {/* Action Trigger Buttons */}
              <div className="flex gap-1.5">
                {/* PLAY / PAUSE */}
                <button
                  id="tender-play-toggle-btn"
                  disabled={isPreparing || isEditMode || !inputText.trim()}
                  onClick={handlePlayToggle}
                  className={`px-4 py-1.5 rounded-lg font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                    isReading && !isPaused
                      ? isNight 
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25'
                        : 'bg-emerald-600/15 text-emerald-800 border border-emerald-500/30 hover:bg-emerald-500/25'
                      : isNight
                        ? 'bg-[#eab308] text-black hover:bg-[#eab308]/90 hover:scale-[1.02]'
                        : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:shadow-md hover:scale-[1.02]'
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
                  className={`px-3 py-1.5 border disabled:opacity-20 disabled:cursor-not-allowed rounded-lg font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all ${
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
              <Sliders className={`w-3.5 h-3.5 ${styles.goldText}`} />
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
                        ? isNight ? 'rgba(234,179,8,0.12)' : 'rgba(217,119,6,0.12)' 
                        : 'transparent',
                      borderColor: isSelected 
                        ? isNight ? '#eab308' : '#d97706' 
                        : isNight ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)',
                      color: isSelected 
                        ? isNight ? '#eab308' : '#d97706' 
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
              Perpetual in-browser voices via Kokoro (kokoro-js). No API, no keys — each narrator reads the selected prose live, offline after a one-time download.
            </p>
          </div>

          {/* Environmental Sound Background Mixer */}
          <div className={`p-4 rounded-xl border flex flex-col justify-between ${styles.innerBg}`}>
            <div className="flex items-center gap-1.5 border-b pb-2 mb-3 border-zinc-200/10" style={{ borderColor: isNight ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
              <Music className={`w-3.5 h-3.5 ${styles.goldText}`} />
              <span className={`font-mono text-[9px] uppercase tracking-widest ${styles.mutedText}`}>
                Nature Weather Backdrop
              </span>
            </div>

            <select
              id="tender-backdrop-select"
              value={soundEnv}
              onChange={(e: any) => setSoundEnv(e.target.value)}
              className={`w-full px-3 py-2 border text-[11px] rounded focus:outline-none font-mono cursor-pointer mb-3.5 ${
                isNight 
                  ? 'bg-black/60 border-white/10 text-[#eab308] focus:border-[#eab308]' 
                  : 'bg-white/80 border-sky-300/40 text-[#d97706] focus:border-[#d97706]'
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
                <Volume2 className={`w-3.5 h-3.5 ${styles.goldText}`} />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={ambientVolume}
                  onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                  className="flex-1 h-0.5 rounded-lg appearance-none cursor-pointer accent-amber-500 bg-amber-500/10"
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
              <Sparkles className={`w-3.5 h-3.5 ${styles.goldText}`} />
              <span className={`font-mono text-[9px] uppercase tracking-widest ${styles.mutedText}`}>
                How it works
              </span>
            </div>
            <p className="font-sans text-[10px] leading-relaxed opacity-75">
              The narrator runs entirely in your browser via Kokoro — the ~86MB voice model downloads once, is cached, and then works fully offline with no API or keys. Sentences are generated ahead and scheduled gaplessly through Web Audio, which also ducks the ambient backdrop to keep the voice clean and warm.
            </p>
            <button
              id="tender-redownload-voices-btn"
              onClick={handleRedownloadVoices}
              className={`mt-3 w-full px-3 py-1.5 rounded-lg border font-mono text-[9px] uppercase tracking-wider cursor-pointer transition-all ${styles.badgeInactive}`}
              title="Clear the cached voice model and re-download on next Listen"
            >
              Re-download voices
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
