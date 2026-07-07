import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Volume2, Play, Pause, Square, Music, Headphones, Sliders, Edit2, Check } from 'lucide-react';
import { PRESETS } from '../data/presets';
import { getThemeStyles } from '../lib/theme';
import {
  generateSpeech,
  subscribeKokoroLoad,
  type KokoroLoadState,
  type KokoroVoiceId,
} from '../lib/kokoro';

type TenderVoiceId = 'joan' | 'grace' | 'peter' | 'daniel';

interface TenderVoiceProfile {
  id: TenderVoiceId;
  name: string;
  descriptor: string;
  kokoroVoice: KokoroVoiceId;
  speed: number;
}

const TENDER_VOICES: TenderVoiceProfile[] = [
  { id: 'joan', name: 'Joan', descriptor: 'Warm · Grounded', kokoroVoice: 'af_heart', speed: 0.92 },
  { id: 'grace', name: 'Grace', descriptor: 'Gentle · Airy', kokoroVoice: 'af_bella', speed: 0.88 },
  { id: 'peter', name: 'Peter', descriptor: 'Deep · Anchored', kokoroVoice: 'am_michael', speed: 0.85 },
  { id: 'daniel', name: 'Daniel', descriptor: 'Resonant · Measured', kokoroVoice: 'bm_daniel', speed: 0.9 },
];

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
  const [kokoroLoad, setKokoroLoad] = useState<KokoroLoadState>({ status: 'idle', progress: 0, message: '' });
  const [genProgress, setGenProgress] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const envGainNodeRef = useRef<GainNode | null>(null);
  const cricketTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const narrationRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const sessionRef = useRef(0);
  const wordsRef = useRef<string[]>([]);

  useEffect(() => subscribeKokoroLoad(setKokoroLoad), []);

  useEffect(() => {
    return () => {
      stopReading(true);
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (envGainNodeRef.current && audioCtxRef.current) {
      const ctx = audioCtxRef.current;
      const targetGain = getAmbientVolumeTarget();
      try {
        envGainNodeRef.current.gain.setValueAtTime(envGainNodeRef.current.gain.value, ctx.currentTime);
        envGainNodeRef.current.gain.linearRampToValueAtTime(targetGain, ctx.currentTime + 0.6);
      } catch {
        envGainNodeRef.current.gain.setValueAtTime(targetGain, ctx.currentTime);
      }
    }
  }, [ambientVolume, soundEnv, isReading, isPaused, isPreparing]);

  useEffect(() => {
    if (soundEnv !== 'silence') startSoundEnvironment(soundEnv);
    else stopSoundEnvironment();
  }, [soundEnv]);

  const getAmbientVolumeTarget = () => {
    if (soundEnv === 'silence') return 0;
    if (isReading && !isPaused) return ambientVolume * 0.15;
    if (isPreparing) return ambientVolume * 0.25;
    return ambientVolume * 0.5;
  };

  const getVoiceProfile = (id: TenderVoiceId) =>
    TENDER_VOICES.find(v => v.id === id) ?? TENDER_VOICES[0];

  const revokeBlobUrl = () => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  };

  const stopNarration = () => {
    sessionRef.current += 1;
    const audio = narrationRef.current;
    if (audio) {
      audio.onended = null;
      audio.ontimeupdate = null;
      audio.onerror = null;
      audio.pause();
      audio.src = '';
      narrationRef.current = null;
    }
    revokeBlobUrl();
    setCurrentWordIndex(-1);
  };

  const stopSoundEnvironment = () => {
    if (noiseSourceRef.current) {
      try {
        noiseSourceRef.current.stop();
        noiseSourceRef.current.disconnect();
      } catch { /* noop */ }
      noiseSourceRef.current = null;
    }
    if (cricketTimerRef.current) {
      clearInterval(cricketTimerRef.current);
      cricketTimerRef.current = null;
    }
    if (envGainNodeRef.current) {
      try { envGainNodeRef.current.disconnect(); } catch { /* noop */ }
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
      if (ctx.state === 'suspended') ctx.resume();

      const envGain = ctx.createGain();
      const targetVolume = getAmbientVolumeTarget();
      envGain.gain.setValueAtTime(0, ctx.currentTime);
      envGain.gain.linearRampToValueAtTime(targetVolume, ctx.currentTime + 1.5);
      envGain.connect(ctx.destination);
      envGainNodeRef.current = envGain;

      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;
      noiseSourceRef.current = noiseSource;

      if (env === 'ocean' || env === 'rain' || env === 'forest' || env === 'hearth') {
        const lowpass = ctx.createBiquadFilter();
        lowpass.type = 'lowpass';

        if (env === 'ocean') {
          lowpass.frequency.setValueAtTime(250, ctx.currentTime);
          const lfo = ctx.createOscillator();
          lfo.frequency.setValueAtTime(0.08, ctx.currentTime);
          const lfoGain = ctx.createGain();
          lfoGain.gain.setValueAtTime(120, ctx.currentTime);
          lfo.connect(lfoGain);
          lfoGain.connect(lowpass.frequency);
          lfo.start();
          noiseSource.connect(lowpass);
          lowpass.connect(envGain);
        } else if (env === 'rain') {
          lowpass.frequency.setValueAtTime(750, ctx.currentTime);
          const bandpass = ctx.createBiquadFilter();
          bandpass.type = 'bandpass';
          bandpass.frequency.setValueAtTime(1100, ctx.currentTime);
          bandpass.Q.setValueAtTime(1.2, ctx.currentTime);
          noiseSource.connect(lowpass);
          lowpass.connect(envGain);
          noiseSource.connect(bandpass);
          bandpass.connect(envGain);
        } else if (env === 'forest') {
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
        } else if (env === 'hearth') {
          lowpass.frequency.setValueAtTime(170, ctx.currentTime);
          noiseSource.connect(lowpass);
          lowpass.connect(envGain);
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
      } else if (env === 'crickets') {
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
      console.warn('Ambient audio failed:', e);
    }
  };

  const stopReading = (stopAmbient = true) => {
    stopNarration();
    setIsReading(false);
    setIsPreparing(false);
    setIsPaused(false);
    setGenProgress(null);
    if (stopAmbient) stopSoundEnvironment();
  };

  const playNarration = async (textSrc: string, voiceId: TenderVoiceId) => {
    const session = ++sessionRef.current;
    const profile = getVoiceProfile(voiceId);
    wordsRef.current = textSrc.split(/\s+/).filter(Boolean);

    setSpeechError(null);
    setIsPreparing(true);
    setIsReading(false);
    setIsPaused(false);
    setCurrentWordIndex(-1);
    setGenProgress('Loading voice engine…');

    try {
      const raw = await generateSpeech(
        textSrc,
        profile.kokoroVoice,
        profile.speed,
        (chunk, total) => {
          if (sessionRef.current !== session) return;
          setGenProgress(total > 1 ? `Generating part ${chunk} of ${total}…` : 'Generating narration…');
        },
      );

      if (sessionRef.current !== session) return;

      const blob = raw.toBlob();
      revokeBlobUrl();
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;

      const audio = new Audio(url);
      narrationRef.current = audio;

      audio.ontimeupdate = () => {
        if (sessionRef.current !== session || !audio.duration) return;
        const ratio = audio.currentTime / audio.duration;
        setCurrentWordIndex(Math.min(
          Math.floor(ratio * wordsRef.current.length),
          wordsRef.current.length - 1,
        ));
      };

      audio.onended = () => {
        if (sessionRef.current !== session) return;
        setIsReading(false);
        setIsPreparing(false);
        setIsPaused(false);
        setCurrentWordIndex(-1);
        setGenProgress(null);
      };

      audio.onerror = () => {
        if (sessionRef.current !== session) return;
        setSpeechError('Playback failed. Tap Listen to try again.');
        stopReading(false);
      };

      setGenProgress(null);
      setIsPreparing(false);
      setIsReading(true);
      await audio.play();
    } catch (err) {
      if (sessionRef.current !== session) return;
      const msg = err instanceof Error ? err.message : 'Voice generation failed';
      setSpeechError(msg.length > 120 ? `${msg.slice(0, 120)}…` : msg);
      setIsPreparing(false);
      setIsReading(false);
      setGenProgress(null);
    }
  };

  const handlePlayToggle = () => {
    const audio = narrationRef.current;
    if (isReading && audio) {
      if (isPaused) {
        audio.play().then(() => setIsPaused(false)).catch(() => {});
      } else {
        audio.pause();
        setIsPaused(true);
      }
      return;
    }

    const textSrc = inputText.trim();
    if (!textSrc || isEditMode) return;

    if (soundEnv !== 'silence') startSoundEnvironment(soundEnv);
    void playNarration(textSrc, tenderVoice);
  };

  const handleVoiceChange = (voice: TenderVoiceId) => {
    setTenderVoice(voice);
    if (isReading || isPreparing) {
      stopReading(false);
      setTimeout(() => void playNarration(inputText.trim(), voice), 150);
    }
  };

  const handlePresetSelect = (preset: typeof PRESETS[0]) => {
    stopReading(true);
    setInputText(preset.text);
    setIsEditMode(false);
    let backdrop: typeof soundEnv = 'silence';
    if (preset.id === 'solitude') backdrop = 'ocean';
    if (preset.id === 'reflection') backdrop = 'rain';
    setSoundEnv(backdrop);
  };

  const renderContemplativeText = () => {
    let wordCounter = 0;
    return inputText.split('\n\n').map((paragraph, pIdx) => {
      const parts = paragraph.split(/(\s+)/);
      return (
        <p key={pIdx} className="mb-4 font-serif text-sm sm:text-[15px] leading-relaxed tracking-wide text-left">
          {parts.map((part, index) => {
            const isWord = /\S/.test(part);
            const currentIdx = wordCounter;
            if (isWord) wordCounter++;
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

  const isNight = currentTheme === 'night';
  const theme = getThemeStyles(currentTheme);
  const styles = {
    cardBg: theme.cardBg,
    innerBg: theme.innerBg,
    titleText: theme.text,
    mutedText: theme.textMuted,
    accentText: theme.accent,
    badgeActive: isNight
      ? 'bg-[#d4b05a]/12 border-[#d4b05a] text-[#d4b05a]'
      : 'bg-[#d4b05a]/10 border-[#b8956b] text-[#b8956b] font-medium',
    badgeInactive: isNight
      ? 'bg-black/20 border-white/5 text-white/40 hover:text-white/80 hover:border-white/10'
      : 'bg-white/40 border-stone-200/50 text-stone-600 hover:text-[#8a6f2e] hover:bg-white',
  };

  const statusLabel = isPreparing
    ? kokoroLoad.status === 'loading'
      ? `Loading engine ${kokoroLoad.progress}%`
      : genProgress ?? 'Preparing voice…'
    : isReading
      ? isPaused ? 'Paused' : 'Narrating'
      : 'Ready';

  return (
    <div
      className={`flex flex-col w-full max-w-4xl mx-auto p-5 sm:p-6 rounded-2xl border relative overflow-hidden ${styles.cardBg}`}
      id="the-tender-section"
    >
      <div className={`absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl pointer-events-none z-0 ${isNight ? 'bg-[#d4b05a]/[0.04]' : 'bg-[#d4b05a]/[0.06]'}`} />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 mb-4 border-accent/10">
        <div className="text-left">
          <span className="font-mono text-[9px] tracking-widest uppercase opacity-50 block">Guided narration</span>
          <h2 className={`font-serif text-2xl font-normal tracking-wide mt-0.5 ${styles.titleText}`}>The Tender</h2>
          <p className={`font-sans text-[10px] italic mt-0.5 ${styles.mutedText}`}>
            Local Kokoro voice — gentle reading with optional nature backdrops
          </p>
        </div>
        <button
          id="toggle-edit-mode-btn"
          onClick={() => { stopReading(true); setIsEditMode(!isEditMode); }}
          className={`mt-3 sm:mt-0 px-4 py-2 rounded-full border font-display text-[9px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${
            isEditMode ? styles.badgeActive : styles.badgeInactive
          }`}
        >
          {isEditMode ? <><Check className="w-3 h-3" /> Reading Mode</> : <><Edit2 className="w-3 h-3" /> Edit Prose</>}
        </button>
      </div>

      <div className="relative z-10 mb-4">
        <span className="font-mono text-[8px] uppercase tracking-widest block text-left mb-2 opacity-50">Presets</span>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(preset => {
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

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        <div className="md:col-span-7 flex flex-col gap-3">
          <div className={`p-5 rounded-xl border text-left flex flex-col justify-between min-h-[280px] relative overflow-hidden ${styles.innerBg}`}>
            <AnimatePresence>
              {isReading && !isPaused && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-accent/[0.015] pointer-events-none" />
              )}
            </AnimatePresence>

            <div>
              <div className="flex items-center justify-between border-b pb-2 mb-3 border-zinc-200/10"
                style={{ borderColor: isNight ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                <div className="flex items-center gap-1.5">
                  <Headphones className={`w-3.5 h-3.5 ${styles.accentText}`} />
                  <span className={`font-mono text-[9px] uppercase tracking-widest ${styles.mutedText}`}>
                    {isEditMode ? 'Text composer' : 'Reading sanctuary'}
                  </span>
                </div>
                {isReading && !isPaused && (
                  <span className="flex items-end gap-[1.5px] h-3">
                    {[0.35, 0.9, 0.6].map((h, i) => (
                      <span key={i} className="w-[1.5px] bg-[#d4b05a] rounded-full animate-[pulse_0.6s_infinite_alternate]"
                        style={{ height: `${h * 100}%`, animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </span>
                )}
              </div>

              <div className="max-h-[200px] overflow-y-auto pr-1 select-text scrollbar-thin">
                {isEditMode ? (
                  <textarea
                    id="tender-custom-textarea"
                    rows={8}
                    className={`w-full p-3 rounded-2xl border text-xs sm:text-sm font-serif leading-relaxed focus:outline-none focus:border-[#d4b05a] ${
                      isNight ? 'bg-black/60 border-white/10 text-white placeholder-white/20' : 'bg-white/80 border-zinc-300 text-zinc-900 placeholder-zinc-400'
                    }`}
                    placeholder="Write or paste your reflection here…"
                    value={inputText}
                    onChange={e => { stopReading(true); setInputText(e.target.value); }}
                  />
                ) : inputText.trim() ? (
                  renderContemplativeText()
                ) : (
                  <p className={`font-serif text-sm italic ${styles.mutedText}`}>
                    Select a preset or edit your own prose.
                  </p>
                )}
              </div>
            </div>

            {speechError && (
              <div className="mt-3 p-3 bg-red-950/15 border border-red-500/10 rounded-xl text-xs font-sans text-red-300/90 leading-relaxed">
                {speechError}
              </div>
            )}

            {(isPreparing && kokoroLoad.status === 'loading') && (
              <div className="mt-3">
                <div className="h-1 rounded-full bg-accent/10 overflow-hidden">
                  <div className="h-full bg-accent transition-all duration-300" style={{ width: `${kokoroLoad.progress}%` }} />
                </div>
                <p className="font-mono text-[8px] uppercase tracking-widest opacity-50 mt-1.5">{kokoroLoad.message}</p>
              </div>
            )}

            <div className="border-t pt-3 mt-3 flex items-center justify-between border-zinc-200/10"
              style={{ borderColor: isNight ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  {(isPreparing || (isReading && !isPaused)) && (
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isPreparing ? 'bg-[#e8cc6a]' : 'bg-emerald-400'
                    }`} />
                  )}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    isPreparing ? 'bg-[#e8cc6a]' : isReading ? (isPaused ? 'bg-[#e8cc6a]' : 'bg-emerald-400') : 'bg-zinc-500'
                  }`} />
                </span>
                <span className="font-mono text-[8px] uppercase tracking-widest opacity-60">{statusLabel}</span>
              </div>

              <div className="flex gap-1.5">
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
                  {isReading && !isPaused ? <><Pause className="w-3 h-3 fill-current" /> Pause</> :
                    <><Play className="w-3 h-3 fill-current translate-x-[0.5px]" /> {isReading ? 'Resume' : 'Listen'}</>}
                </button>
                <button
                  id="tender-stop-btn"
                  disabled={!isReading && !isPreparing}
                  onClick={() => stopReading(true)}
                  className={`px-4 py-2 border disabled:opacity-20 disabled:cursor-not-allowed rounded-full font-display text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all ${
                    isNight ? 'bg-red-950/15 hover:bg-red-950/35 text-red-300 border-red-500/10' : 'bg-red-50/50 hover:bg-red-100 text-red-800 border-red-200'
                  }`}
                >
                  <Square className="w-2.5 h-2.5" /> Stop
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-5 flex flex-col gap-3">
          <div className={`p-4 rounded-xl border flex flex-col ${styles.innerBg}`}>
            <div className="flex items-center gap-1.5 border-b pb-2 mb-3 border-zinc-200/10"
              style={{ borderColor: isNight ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
              <Sliders className={`w-3.5 h-3.5 ${styles.accentText}`} />
              <span className={`font-mono text-[9px] uppercase tracking-widest ${styles.mutedText}`}>Voice</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TENDER_VOICES.map(v => {
                const isSelected = tenderVoice === v.id;
                return (
                  <button
                    id={`voice-custom-btn-${v.id}`}
                    key={v.id}
                    onClick={() => handleVoiceChange(v.id)}
                    className="px-2.5 py-2 rounded border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5"
                    style={{
                      backgroundColor: isSelected ? (isNight ? 'rgba(196,160,68,0.12)' : 'rgba(184,149,107,0.12)') : 'transparent',
                      borderColor: isSelected ? (isNight ? '#d4b05a' : '#b8956b') : isNight ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)',
                      color: isSelected ? (isNight ? '#d4b05a' : '#b8956b') : isNight ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)',
                    }}
                  >
                    <span className="font-serif text-[13px] tracking-wide leading-tight">{v.name}</span>
                    <span className="font-mono text-[8px] uppercase tracking-widest opacity-70">{v.descriptor}</span>
                  </button>
                );
              })}
            </div>
            <p className="font-sans text-[9.5px] italic text-left opacity-60 mt-2">
              Kokoro runs locally in your browser — no server or API key needed.
            </p>
          </div>

          <div className={`p-4 rounded-xl border flex flex-col ${styles.innerBg}`}>
            <div className="flex items-center gap-1.5 border-b pb-2 mb-3 border-zinc-200/10"
              style={{ borderColor: isNight ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
              <Music className={`w-3.5 h-3.5 ${styles.accentText}`} />
              <span className={`font-mono text-[9px] uppercase tracking-widest ${styles.mutedText}`}>Backdrop</span>
            </div>
            <select
              id="tender-backdrop-select"
              value={soundEnv}
              onChange={e => setSoundEnv(e.target.value as typeof soundEnv)}
              className={`w-full px-3 py-2 border text-[11px] rounded-full focus:outline-none font-mono cursor-pointer mb-3 ${
                isNight ? 'bg-black/60 border-white/10 text-[#d4b05a] focus:border-[#d4b05a]' : 'bg-white/80 border-[#d4b05a]/30 text-[#b8956b] focus:border-[#b8956b]'
              }`}
            >
              <option value="silence">Silence</option>
              <option value="rain">Rain</option>
              <option value="forest">Forest</option>
              <option value="ocean">Ocean</option>
              <option value="hearth">Hearth fire</option>
              <option value="crickets">Night crickets</option>
            </select>
            {soundEnv !== 'silence' ? (
              <div className={`flex items-center gap-3 px-3 py-2 rounded border ${isNight ? 'bg-black/40 border-white/5' : 'bg-white border-zinc-100'}`}>
                <Volume2 className={`w-3.5 h-3.5 ${styles.accentText}`} />
                <input type="range" min="0" max="1" step="0.05" value={ambientVolume}
                  onChange={e => setAmbientVolume(parseFloat(e.target.value))}
                  className="flex-1 h-0.5 rounded-lg appearance-none cursor-pointer accent-[#d4b05a] bg-[#d4b05a]/10"
                  id="tender-backdrop-volume" />
                <span className="font-mono text-[8px] opacity-75 w-6 text-right">{Math.round(ambientVolume * 100)}%</span>
              </div>
            ) : (
              <div className={`text-center p-2 border rounded font-sans text-[10px] italic ${styles.mutedText}`}
                style={{ borderColor: isNight ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)' }}>
                No backdrop — voice only.
              </div>
            )}
          </div>

          <div className={`p-4 rounded-xl border text-left ${styles.innerBg}`}>
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className={`w-3.5 h-3.5 ${styles.accentText}`} />
              <span className={`font-mono text-[9px] uppercase tracking-widest ${styles.mutedText}`}>How it works</span>
            </div>
            <p className="font-sans text-[10px] leading-relaxed opacity-75">
              Kokoro generates speech on your device. First listen downloads the model (~90 MB). Ambient backdrops duck automatically while the voice plays.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
