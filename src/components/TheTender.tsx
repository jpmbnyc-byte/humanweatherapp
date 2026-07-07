import React, { useState, useEffect, useRef, startTransition } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Volume2, Play, Pause, Square, Music, Headphones, Sliders, Edit2, Check, Info } from 'lucide-react';
import { PRESETS } from '../data/presets';
import { getThemeStyles } from '../lib/theme';
import {
  TENDER_VOICES,
  getVoiceProfile,
  type TenderVoiceId,
  type TtsEngine,
} from '../lib/voices';

type NarrationPhase = 'idle' | 'preparing' | 'reading' | 'paused' | 'error';

function getStatusMessage(
  phase: NarrationPhase,
  voiceName: string,
  engine: TtsEngine | null,
  progress: string | null,
  error: string | null,
): string {
  if (phase === 'error' && error) return error;
  if (phase === 'preparing') return progress ?? `Preparing ${voiceName}'s voice…`;
  if (phase === 'reading') {
    return engine === 'kokoro'
      ? `${voiceName} is reading with a human Kokoro voice. Words highlight as they're spoken.`
      : `${voiceName} is reading aloud. Words highlight as they're spoken.`;
  }
  if (phase === 'paused') return "Paused. Tap Resume when you're ready to continue.";
  return 'Human voices run on our server — nothing downloads to your device. Tap Listen when you\'re ready.';
}

interface TheTenderProps {
  currentTheme: 'day' | 'night';
}

export default function TheTender({ currentTheme }: TheTenderProps) {
  const [inputText, setInputText] = useState(PRESETS[0].text);
  const [soundEnv, setSoundEnv] = useState<'rain' | 'forest' | 'ocean' | 'hearth' | 'crickets' | 'silence'>('silence');
  const [tenderVoice, setTenderVoice] = useState<TenderVoiceId>('joan');
  const [phase, setPhase] = useState<NarrationPhase>('idle');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [ambientVolume, setAmbientVolume] = useState(0.4);
  const [isEditMode, setIsEditMode] = useState(false);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [activeEngine, setActiveEngine] = useState<TtsEngine | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const envGainNodeRef = useRef<GainNode | null>(null);
  const cricketTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const narrationRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const sessionRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const isReading = phase === 'reading';
  const isPaused = phase === 'paused';
  const isPreparing = phase === 'preparing';

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
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
  }, [ambientVolume, soundEnv, phase]);

  useEffect(() => {
    if (soundEnv !== 'silence') startSoundEnvironment(soundEnv);
    else stopSoundEnvironment();
  }, [soundEnv]);

  const getAmbientVolumeTarget = () => {
    if (soundEnv === 'silence') return 0;
    if (isReading) return ambientVolume * 0.15;
    if (isPreparing) return ambientVolume * 0.25;
    return ambientVolume * 0.5;
  };

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
      try { noiseSourceRef.current.stop(); noiseSourceRef.current.disconnect(); } catch { /* noop */ }
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
      envGain.gain.setValueAtTime(0, ctx.currentTime);
      envGain.gain.linearRampToValueAtTime(getAmbientVolumeTarget(), ctx.currentTime + 1.5);
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
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(env === 'rain' ? 750 : 400, ctx.currentTime);
      noiseSource.connect(lowpass);
      lowpass.connect(envGain);
      noiseSource.start();
    } catch (e) {
      console.warn('Ambient audio failed:', e);
    }
  };

  const stopReading = (stopAmbient = true) => {
    abortRef.current?.abort();
    abortRef.current = null;
    stopNarration();
    setPhase('idle');
    setSpeechError(null);
    setProgressMessage(null);
    setActiveEngine(null);
    if (stopAmbient) stopSoundEnvironment();
  };

  const playNarration = async (textSrc: string, voiceId: TenderVoiceId) => {
    const session = ++sessionRef.current;
    const profile = getVoiceProfile(voiceId);
    const words = textSrc.split(/\s+/).filter(Boolean);

    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    setSpeechError(null);
    setPhase('preparing');
    setProgressMessage(`Connecting to voice server for ${profile.name}…`);

    const { fetchNarrationAudio } = await import('../lib/voices-client');

    const result = await fetchNarrationAudio(
      textSrc,
      profile,
      msg => {
        if (sessionRef.current === session) {
          startTransition(() => setProgressMessage(msg));
        }
      },
      abort.signal,
    );

    if (sessionRef.current !== session || abort.signal.aborted) return;

    if (!result.ok || !result.blob) {
      setSpeechError(result.error ?? 'Could not generate voice. Please try again.');
      setPhase('error');
      setProgressMessage(null);
      return;
    }

    setActiveEngine(result.engine ?? 'kokoro');
    revokeBlobUrl();
    const url = URL.createObjectURL(result.blob);
    blobUrlRef.current = url;

    const audio = new Audio(url);
    narrationRef.current = audio;

    audio.ontimeupdate = () => {
      if (sessionRef.current !== session || !audio.duration) return;
      const ratio = audio.currentTime / audio.duration;
      setCurrentWordIndex(Math.min(Math.floor(ratio * words.length), words.length - 1));
    };

    audio.onended = () => {
      if (sessionRef.current !== session) return;
      setPhase('idle');
      setProgressMessage(null);
      setCurrentWordIndex(-1);
    };

    audio.onerror = () => {
      if (sessionRef.current !== session) return;
      setSpeechError('Playback failed. Tap Listen to try again.');
      setPhase('error');
    };

    setProgressMessage(null);
    setPhase('reading');
    try {
      await audio.play();
    } catch {
      setSpeechError('Your browser blocked audio. Tap Listen once to allow sound.');
      setPhase('error');
    }
  };

  const handlePlayToggle = () => {
    const audio = narrationRef.current;
    if (isReading || isPaused) {
      if (!audio) return;
      if (isPaused) {
        audio.play().then(() => setPhase('reading')).catch(() => {});
      } else {
        audio.pause();
        setPhase('paused');
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
    if (phase !== 'idle') {
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
    return inputText.split('\n\n').map((paragraph, pIdx) => (
      <p key={pIdx} className="mb-4 font-serif text-base sm:text-lg leading-relaxed tracking-wide text-left">
        {paragraph.split(/(\s+)/).map((part, index) => {
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
                    ? 'text-[#f3efe8] font-semibold bg-[#d4b05a]/20 inline-block'
                    : 'text-[#2c2824] font-semibold bg-stone-200/80 inline-block'
                  : isReading
                    ? currentTheme === 'night' ? 'text-white/45' : 'text-stone-500'
                    : currentTheme === 'night' ? 'text-white/85' : 'text-[#2c2824]'
              }`}
            >
              {part}
            </span>
          );
        })}
      </p>
    ));
  };

  const isNight = currentTheme === 'night';
  const theme = getThemeStyles(currentTheme);
  const profile = getVoiceProfile(tenderVoice);
  const statusMessage = getStatusMessage(phase, profile.name, activeEngine, progressMessage, speechError);

  const styles = {
    cardBg: theme.cardBg,
    innerBg: theme.innerBg,
    titleText: theme.text,
    mutedText: theme.textMuted,
    accentText: theme.accent,
    badgeActive: isNight
      ? 'bg-[#d4b05a]/12 border-[#d4b05a] text-[#d4b05a]'
      : 'bg-stone-100 border-stone-400 text-[#2c2824] font-medium',
    badgeInactive: isNight
      ? 'bg-black/20 border-white/5 text-white/50 hover:text-white/85 hover:border-white/10'
      : 'bg-white/60 border-stone-200/70 text-stone-600 hover:text-[#2c2824] hover:bg-white',
  };

  return (
    <div
      className={`flex flex-col w-full max-w-4xl mx-auto p-5 sm:p-7 rounded-2xl border relative overflow-hidden ${styles.cardBg}`}
      id="the-tender-section"
    >
      <div className={`absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl pointer-events-none z-0 ${isNight ? 'bg-[#d4b05a]/[0.04]' : 'bg-stone-300/20'}`} />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 mb-5 border-accent/10">
        <div className="text-left">
          <span className="font-mono text-xs tracking-widest uppercase opacity-50 block">Guided narration</span>
          <h2 className={`font-serif text-2xl md:text-3xl font-normal tracking-wide mt-1 ${styles.titleText}`}>The Tender</h2>
          <p className={`font-sans text-sm md:text-base mt-1 ${styles.mutedText}`}>
            Human Kokoro voices — generated on the server, played instantly
          </p>
        </div>
        <button
          id="toggle-edit-mode-btn"
          onClick={() => { stopReading(true); setIsEditMode(!isEditMode); }}
          className={`mt-3 sm:mt-0 px-4 py-2.5 rounded-full border font-sans text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${
            isEditMode ? styles.badgeActive : styles.badgeInactive
          }`}
        >
          {isEditMode ? <><Check className="w-3.5 h-3.5" /> Reading mode</> : <><Edit2 className="w-3.5 h-3.5" /> Edit prose</>}
        </button>
      </div>

      <div
        className={`relative z-10 mb-5 flex items-start gap-3 p-4 rounded-xl border text-left ${
          phase === 'error'
            ? 'bg-red-950/10 border-red-500/20'
            : isPreparing
              ? isNight ? 'bg-[#d4b05a]/5 border-[#d4b05a]/20' : 'bg-stone-100 border-stone-300/70'
              : isNight ? 'bg-black/25 border-white/10' : 'bg-stone-100/80 border-stone-200/70'
        }`}
        role="status"
        aria-live="polite"
      >
        <Info className={`w-4 h-4 mt-1 shrink-0 ${phase === 'error' ? 'text-red-400' : styles.accentText}`} />
        <div>
          <p className={`font-sans text-sm md:text-base leading-relaxed ${phase === 'error' ? 'text-red-300' : theme.text}`}>
            {statusMessage}
          </p>
          {activeEngine && phase === 'reading' && (
            <p className="font-mono text-xs uppercase tracking-widest opacity-50 mt-1.5">
              Engine: {activeEngine === 'kokoro' ? 'Kokoro (human)' : 'Studio voice'}
            </p>
          )}
        </div>
      </div>

      <div className="relative z-10 mb-5">
        <span className="font-mono text-xs uppercase tracking-widest block text-left mb-2 opacity-50">Presets</span>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(preset => {
            const isSelected = !isEditMode && inputText === preset.text;
            return (
              <button
                key={preset.id}
                id={`preset-tab-${preset.id}`}
                onClick={() => handlePresetSelect(preset)}
                className={`px-4 py-2.5 rounded-full border font-sans text-sm text-left transition-all cursor-pointer ${
                  isSelected ? styles.badgeActive : styles.badgeInactive
                }`}
              >
                <div className="font-serif font-semibold text-base">{preset.title}</div>
                <div className="text-xs opacity-60 font-mono mt-0.5 uppercase tracking-tight">{preset.author}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        <div className="md:col-span-7 flex flex-col gap-3">
          <div className={`p-5 sm:p-6 rounded-xl border text-left flex flex-col justify-between min-h-[300px] relative overflow-hidden ${styles.innerBg}`}>
            <AnimatePresence>
              {isReading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-accent/[0.015] pointer-events-none" />
              )}
            </AnimatePresence>

            <div>
              <div className="flex items-center justify-between border-b pb-2.5 mb-4 border-zinc-200/10"
                style={{ borderColor: isNight ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                <div className="flex items-center gap-2">
                  <Headphones className={`w-4 h-4 ${styles.accentText}`} />
                  <span className={`font-mono text-xs uppercase tracking-widest ${styles.mutedText}`}>
                    {isEditMode ? 'Text composer' : 'Reading sanctuary'}
                  </span>
                </div>
                {isReading && (
                  <span className="flex items-end gap-[2px] h-3.5">
                    {[0.35, 0.9, 0.6].map((h, i) => (
                      <span key={i} className="w-[2px] bg-[#d4b05a] rounded-full animate-[pulse_0.6s_infinite_alternate]"
                        style={{ height: `${h * 100}%`, animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </span>
                )}
              </div>

              <div className="max-h-[220px] overflow-y-auto pr-1 select-text scrollbar-thin">
                {isEditMode ? (
                  <textarea
                    id="tender-custom-textarea"
                    rows={8}
                    className={`w-full p-3 rounded-2xl border text-base font-serif leading-relaxed focus:outline-none focus:border-stone-400 ${
                      isNight ? 'bg-black/60 border-white/10 text-white placeholder-white/25' : 'bg-white border-stone-300 text-[#2c2824] placeholder-stone-400'
                    }`}
                    placeholder="Write or paste your reflection here…"
                    value={inputText}
                    onChange={e => { stopReading(true); setInputText(e.target.value); }}
                  />
                ) : inputText.trim() ? (
                  renderContemplativeText()
                ) : (
                  <p className={`font-serif text-base italic ${styles.mutedText}`}>
                    Select a preset or edit your own prose.
                  </p>
                )}
              </div>
            </div>

            <div className="border-t pt-4 mt-4 flex items-center justify-between border-zinc-200/10"
              style={{ borderColor: isNight ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  {(isPreparing || isReading) && (
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isPreparing ? 'bg-[#e8cc6a]' : 'bg-emerald-400'
                    }`} />
                  )}
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isPreparing ? 'bg-[#e8cc6a]' : isReading ? 'bg-emerald-400' : isPaused ? 'bg-[#e8cc6a]' : 'bg-stone-400'
                  }`} />
                </span>
                <span className="font-mono text-xs uppercase tracking-widest opacity-70">
                  {isPreparing ? 'Generating…' : isReading ? 'Speaking' : isPaused ? 'Paused' : 'Ready'}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  id="tender-play-toggle-btn"
                  disabled={isPreparing || isEditMode || !inputText.trim()}
                  onClick={handlePlayToggle}
                  className={`px-5 py-2.5 rounded-full font-sans text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                    isReading
                      ? isNight
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                        : 'bg-emerald-600/15 text-emerald-800 border border-emerald-500/30'
                      : isNight
                        ? 'bg-[#d4b05a] text-white hover:bg-[#d4b05a]/90'
                        : 'bg-[#2c2824] text-white hover:bg-[#2c2824]/90'
                  }`}
                >
                  {isReading ? <><Pause className="w-3.5 h-3.5 fill-current" /> Pause</> :
                    <><Play className="w-3.5 h-3.5 fill-current" /> {isPaused ? 'Resume' : 'Listen'}</>}
                </button>
                <button
                  id="tender-stop-btn"
                  disabled={phase === 'idle'}
                  onClick={() => stopReading(true)}
                  className={`px-4 py-2.5 border disabled:opacity-20 disabled:cursor-not-allowed rounded-full font-sans text-xs font-semibold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all ${
                    isNight ? 'bg-red-950/15 text-red-300 border-red-500/10' : 'bg-red-50 text-red-800 border-red-200'
                  }`}
                >
                  <Square className="w-3 h-3" /> Stop
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-5 flex flex-col gap-4">
          <div className={`p-4 sm:p-5 rounded-xl border flex flex-col ${styles.innerBg}`}>
            <div className="flex items-center gap-2 border-b pb-2.5 mb-3 border-zinc-200/10"
              style={{ borderColor: isNight ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
              <Sliders className={`w-4 h-4 ${styles.accentText}`} />
              <span className={`font-mono text-xs uppercase tracking-widest ${styles.mutedText}`}>Voice</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TENDER_VOICES.map(v => {
                const isSelected = tenderVoice === v.id;
                return (
                  <button
                    id={`voice-custom-btn-${v.id}`}
                    key={v.id}
                    onClick={() => handleVoiceChange(v.id)}
                    className="px-3 py-3 rounded-lg border transition-all cursor-pointer flex flex-col items-center justify-center gap-1"
                    style={{
                      backgroundColor: isSelected ? (isNight ? 'rgba(196,160,68,0.12)' : 'rgba(0,0,0,0.04)') : 'transparent',
                      borderColor: isSelected ? (isNight ? '#d4b05a' : '#2c2824') : isNight ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)',
                      color: isSelected ? (isNight ? '#d4b05a' : '#2c2824') : isNight ? 'rgba(255,255,255,0.55)' : '#6b6560',
                    }}
                  >
                    <span className="font-serif text-base tracking-wide leading-tight">{v.name}</span>
                    <span className="font-sans text-xs opacity-75">{v.descriptor}</span>
                  </button>
                );
              })}
            </div>
            <p className="font-sans text-sm text-left opacity-70 mt-3 leading-relaxed">
              Four human Kokoro voices. Audio is made on the server and streamed to you — your device never downloads the model.
            </p>
          </div>

          <div className={`p-4 sm:p-5 rounded-xl border flex flex-col ${styles.innerBg}`}>
            <div className="flex items-center gap-2 border-b pb-2.5 mb-3 border-zinc-200/10"
              style={{ borderColor: isNight ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
              <Music className={`w-4 h-4 ${styles.accentText}`} />
              <span className={`font-mono text-xs uppercase tracking-widest ${styles.mutedText}`}>Backdrop</span>
            </div>
            <select
              id="tender-backdrop-select"
              value={soundEnv}
              onChange={e => setSoundEnv(e.target.value as typeof soundEnv)}
              className={`w-full px-3 py-2.5 border text-sm rounded-full focus:outline-none font-sans cursor-pointer mb-3 ${
                isNight ? 'bg-black/60 border-white/10 text-[#d4b05a]' : 'bg-white border-stone-300 text-[#2c2824]'
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
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${isNight ? 'bg-black/40 border-white/5' : 'bg-white border-stone-200'}`}>
                <Volume2 className={`w-4 h-4 ${styles.accentText}`} />
                <input type="range" min="0" max="1" step="0.05" value={ambientVolume}
                  onChange={e => setAmbientVolume(parseFloat(e.target.value))}
                  className="flex-1 h-1 rounded-lg appearance-none cursor-pointer accent-[#d4b05a]"
                  id="tender-backdrop-volume" />
                <span className="font-mono text-xs opacity-75 w-8 text-right">{Math.round(ambientVolume * 100)}%</span>
              </div>
            ) : (
              <div className={`text-center p-2.5 border rounded-lg font-sans text-sm italic ${styles.mutedText}`}
                style={{ borderColor: isNight ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)' }}>
                No backdrop — voice only.
              </div>
            )}
          </div>

          <div className={`p-4 sm:p-5 rounded-xl border text-left ${styles.innerBg}`}>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className={`w-4 h-4 ${styles.accentText}`} />
              <span className={`font-mono text-xs uppercase tracking-widest ${styles.mutedText}`}>How it works</span>
            </div>
            <p className="font-sans text-sm md:text-base leading-relaxed opacity-80">
              Like Kokoro Web&apos;s API mode: the 82M voice model runs on a server. When you tap Listen, we generate audio there and play it here — human quality, no model download on your phone or laptop.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
