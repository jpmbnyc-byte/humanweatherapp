import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, Play, Pause, Square, Music, Headphones, Sliders, Edit2, Check } from 'lucide-react';
import { PRESETS } from '../data/presets';
import { getThemeStyles } from '../lib/theme';
import {
  TENDER_VOICES,
  getVoiceProfile,
  warmVoiceEngine,
  subscribeKokoroLoadProgress,
  getKokoroLoadState,
  type TenderVoiceId,
} from '../lib/voices';
import type { NarrationControls } from '../lib/readProse';

type Phase = 'idle' | 'loading' | 'live' | 'paused' | 'error';

interface TheTenderProps {
  currentTheme: 'day' | 'night';
}

export default function TheTender({ currentTheme }: TheTenderProps) {
  const [inputText, setInputText] = useState(PRESETS[0].text);
  const [soundEnv, setSoundEnv] = useState<'rain' | 'forest' | 'ocean' | 'hearth' | 'crickets' | 'silence'>('silence');
  const [tenderVoice, setTenderVoice] = useState<TenderVoiceId>('joan');
  const [phase, setPhase] = useState<Phase>('idle');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [loadPercent, setLoadPercent] = useState(0);
  const [loadLabel, setLoadLabel] = useState('');
  const [warmLoading, setWarmLoading] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [ambientVolume, setAmbientVolume] = useState(0.4);
  const [isEditMode, setIsEditMode] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const envGainNodeRef = useRef<GainNode | null>(null);
  const controlsRef = useRef<NarrationControls | null>(null);
  const sessionRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const isLive = phase === 'live';
  const isPaused = phase === 'paused';
  const isLoading = phase === 'loading';
  const isActive = isLive || isPaused;
  const showLoadStatus = isLoading || warmLoading || loadLabel.length > 0;

  useEffect(() => {
    warmVoiceEngine();

    const syncWarmState = () => setWarmLoading(getKokoroLoadState() === 'loading');
    syncWarmState();

    const onReady = () => {
      if (getKokoroLoadState() === 'ready') {
        setWarmLoading(false);
        setLoadPercent(0);
        setLoadLabel('');
      }
    };

    const unsub = subscribeKokoroLoadProgress(progress => {
      setWarmLoading(getKokoroLoadState() === 'loading');
      setLoadPercent(progress.percent);
      setLoadLabel(progress.status);
    });

    void import('../lib/kokoro').then(m =>
      m.getKokoroTts().then(onReady).catch(err => {
        console.error('Voice warm failed:', err);
        setWarmLoading(false);
        setSpeechError('Voice unavailable — tap Listen to retry.');
        setPhase('error');
      }),
    );

    return () => {
      unsub();
      abortRef.current?.abort();
      controlsRef.current?.stop();
      stopSoundEnvironment();
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (envGainNodeRef.current && audioCtxRef.current) {
      const ctx = audioCtxRef.current;
      const target = getAmbientVolumeTarget();
      try {
        envGainNodeRef.current.gain.setValueAtTime(envGainNodeRef.current.gain.value, ctx.currentTime);
        envGainNodeRef.current.gain.linearRampToValueAtTime(target, ctx.currentTime + 0.4);
      } catch {
        envGainNodeRef.current.gain.setValueAtTime(target, ctx.currentTime);
      }
    }
  }, [ambientVolume, soundEnv, phase]);

  useEffect(() => {
    if (soundEnv !== 'silence') startSoundEnvironment(soundEnv);
    else stopSoundEnvironment();
  }, [soundEnv]);

  const getAmbientVolumeTarget = () => {
    if (soundEnv === 'silence') return 0;
    if (isLive) return ambientVolume * 0.15;
    if (isPaused) return ambientVolume * 0.2;
    return ambientVolume * 0.45;
  };

  const stopSoundEnvironment = () => {
    if (noiseSourceRef.current) {
      try { noiseSourceRef.current.stop(); noiseSourceRef.current.disconnect(); } catch { /* noop */ }
      noiseSourceRef.current = null;
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
      envGain.gain.linearRampToValueAtTime(getAmbientVolumeTarget(), ctx.currentTime + 1);
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
    } catch {
      /* ambient optional */
    }
  };

  const stopReading = (stopAmbient = true) => {
    sessionRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    controlsRef.current?.stop();
    controlsRef.current = null;
    setPhase('idle');
    setSpeechError(null);
    setLoadPercent(0);
    setLoadLabel('');
    setCurrentWordIndex(-1);
    if (stopAmbient) stopSoundEnvironment();
  };

  const playNarration = async (textSrc: string, voiceId: TenderVoiceId) => {
    const session = ++sessionRef.current;
    const profile = getVoiceProfile(voiceId);
    const abort = new AbortController();
    abortRef.current = abort;

    setSpeechError(null);
    setPhase('loading');
    setLoadPercent(getKokoroLoadState() === 'ready' ? 0 : 0);
    setLoadLabel(getKokoroLoadState() === 'ready' ? 'Preparing speech…' : 'Preparing the voice — one-time download.');
    setCurrentWordIndex(-1);

    try {
      const { readProse } = await import('../lib/readProse');
      await readProse({
        text: textSrc,
        profile,
        signal: abort.signal,
        onStatus: status => {
          if (sessionRef.current !== session) return;
          if (status.phase === 'playing') {
            setLoadPercent(0);
            setLoadLabel('');
            return;
          }
          setLoadPercent(status.percent ?? 0);
          setLoadLabel(status.label);
        },
        onStart: controls => {
          if (sessionRef.current === session) {
            controlsRef.current = controls;
            setPhase('live');
            setLoadPercent(0);
            setLoadLabel('');
          }
        },
        onWordIndex: idx => {
          if (sessionRef.current === session) setCurrentWordIndex(idx);
        },
      });

      if (sessionRef.current === session) {
        setPhase('idle');
        setCurrentWordIndex(-1);
        controlsRef.current = null;
      }
    } catch (err) {
      if (sessionRef.current !== session || abort.signal.aborted) return;
      if (err instanceof DOMException && err.name === 'AbortError') return;

      console.error('Narration failed:', err);
      const { resetKokoroEngine } = await import('../lib/readProse');
      resetKokoroEngine();
      controlsRef.current = null;
      setSpeechError('Voice unavailable — tap Listen to retry.');
      setPhase('error');
    }
  };

  const handlePlayToggle = () => {
    if (isActive) {
      const controls = controlsRef.current;
      if (!controls) return;
      if (isPaused) {
        void controls.resume();
        setPhase('live');
      } else {
        controls.pause();
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
    if (isActive) {
      stopReading(false);
      setTimeout(() => void playNarration(inputText.trim(), voice), 80);
    }
  };

  const handlePresetSelect = (preset: typeof PRESETS[0]) => {
    stopReading(true);
    setInputText(preset.text);
    setIsEditMode(false);
    if (preset.id === 'solitude') setSoundEnv('ocean');
    else if (preset.id === 'reflection') setSoundEnv('rain');
    else setSoundEnv('silence');
  };

  const renderText = () => {
    let n = 0;
    return inputText.split('\n\n').map((paragraph, pIdx) => (
      <p key={pIdx} className="mb-4 hw-body text-left">
        {paragraph.split(/(\s+)/).map((part, i) => {
          const isWord = /\S/.test(part);
          const idx = n;
          if (isWord) n++;
          const current = isLive && isWord && idx === currentWordIndex;
          return (
            <span
              key={i}
              className={`transition-colors duration-100 rounded px-0.5 ${
                current
                  ? isNight ? 'text-[#f3efe8] bg-[#d4b05a]/25' : 'text-[#2c2824] bg-stone-200/90'
                  : isLive
                    ? isNight ? 'text-white/40' : 'text-stone-500'
                    : isNight ? 'text-white/85' : 'text-[#2c2824]'
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
          <span className="hw-eyebrow block">Guided narration</span>
          <h2 className={`hw-display mt-1 ${styles.titleText}`}>The Tender</h2>
        </div>
        <button
          id="toggle-edit-mode-btn"
          onClick={() => { stopReading(true); setIsEditMode(!isEditMode); }}
          className={`mt-3 sm:mt-0 px-4 py-2.5 rounded-full border hw-btn-label flex items-center gap-1.5 cursor-pointer transition-all ${
            isEditMode ? styles.badgeActive : styles.badgeInactive
          }`}
        >
          {isEditMode ? <><Check className="w-3.5 h-3.5" /> Done</> : <><Edit2 className="w-3.5 h-3.5" /> Edit</>}
        </button>
      </div>

      <div className="relative z-10 mb-5">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(preset => {
            const selected = !isEditMode && inputText === preset.text;
            return (
              <button
                key={preset.id}
                id={`preset-tab-${preset.id}`}
                onClick={() => handlePresetSelect(preset)}
                className={`px-4 py-2 rounded-full border font-sans text-sm transition-all cursor-pointer ${
                  selected ? styles.badgeActive : styles.badgeInactive
                }`}
              >
                {preset.title}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        <div className="md:col-span-7">
          <div className={`p-5 sm:p-6 rounded-xl border text-left flex flex-col min-h-[280px] ${styles.innerBg}`}>
            <AnimatePresence>
              {isLive && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-accent/[0.02] pointer-events-none rounded-xl"
                />
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between border-b pb-2 mb-4 border-accent/10">
              <Headphones className={`w-4 h-4 ${styles.accentText}`} />
              {isLive && (
                <span className="flex items-end gap-[2px] h-3">
                  {[0.4, 1, 0.65].map((h, i) => (
                    <span
                      key={i}
                      className="w-[2px] bg-[#d4b05a] rounded-full animate-[pulse_0.5s_ease-in-out_infinite_alternate]"
                      style={{ height: `${h * 100}%`, animationDelay: `${i * 0.08}s` }}
                    />
                  ))}
                </span>
              )}
            </div>

            <div className="flex-1 max-h-[220px] overflow-y-auto pr-1 select-text scrollbar-thin mb-4">
              {isEditMode ? (
                <textarea
                  id="tender-custom-textarea"
                  rows={8}
                  className={`w-full p-3 rounded-xl border hw-body focus:outline-none ${
                    isNight ? 'bg-black/60 border-white/10 text-white' : 'bg-white border-stone-300 text-[#2c2824]'
                  }`}
                  placeholder="Write or paste your reflection…"
                  value={inputText}
                  onChange={e => { stopReading(true); setInputText(e.target.value); }}
                />
              ) : inputText.trim() ? (
                renderText()
              ) : (
                <p className={`hw-caption ${styles.mutedText}`}>Choose a preset or edit your own prose.</p>
              )}
            </div>

            {showLoadStatus && (
              <div className="mb-3" aria-busy="true">
                <p
                  className={`hw-caption font-mono text-xs mb-1.5 ${isNight ? 'text-white/55' : 'text-stone-500'}`}
                  aria-live="polite"
                  role="status"
                >
                  {loadLabel || 'Preparing the voice…'}
                </p>
                <div
                  className={`h-0.5 w-full rounded-full overflow-hidden ${isNight ? 'bg-white/10' : 'bg-stone-200'}`}
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={loadPercent}
                  aria-label="Voice preparation progress"
                >
                  <div
                    className="h-full bg-[#d4b05a] transition-[width] duration-200 ease-out"
                    style={{ width: `${loadPercent}%` }}
                  />
                </div>
              </div>
            )}

            {phase === 'error' && (
              <p className="text-red-400/90 text-sm mb-3" role="alert">{speechError}</p>
            )}

            <div className="flex gap-2 justify-end border-t border-accent/10 pt-4">
              <button
                id="tender-play-toggle-btn"
                disabled={isEditMode || !inputText.trim() || isLoading}
                onClick={handlePlayToggle}
                className={`px-5 py-2.5 rounded-full hw-btn-label flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-30 ${
                  isLive
                    ? isNight ? 'text-emerald-400 border border-emerald-500/30' : 'text-emerald-800 border border-emerald-500/40'
                    : isLoading
                      ? isNight ? 'text-white/50 border border-white/10' : 'text-stone-500 border border-stone-200'
                      : isNight ? 'bg-[#d4b05a] text-white' : 'bg-[#2c2824] text-white'
                }`}
              >
                {isLoading ? <>Preparing…</> :
                  isLive ? <><Pause className="w-3.5 h-3.5 fill-current" /> Pause</> :
                  isPaused ? <><Play className="w-3.5 h-3.5 fill-current" /> Resume</> :
                  <><Play className="w-3.5 h-3.5 fill-current" /> Listen</>}
              </button>
              <button
                id="tender-stop-btn"
                disabled={!isActive}
                onClick={() => stopReading(true)}
                className={`px-4 py-2.5 rounded-full hw-btn-label border cursor-pointer transition-all disabled:opacity-20 ${
                  isNight ? 'text-red-300/80 border-red-500/20' : 'text-red-800 border-red-200'
                }`}
              >
                <Square className="w-3 h-3 inline mr-1" />Stop
              </button>
            </div>
          </div>
        </div>

        <div className="md:col-span-5 flex flex-col gap-4">
          <div className={`p-4 rounded-xl border ${styles.innerBg}`}>
            <div className="flex items-center gap-2 mb-3">
              <Sliders className={`w-4 h-4 ${styles.accentText}`} />
              <span className={`hw-eyebrow ${styles.mutedText}`}>Voice</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TENDER_VOICES.map(v => (
                <button
                  id={`voice-custom-btn-${v.id}`}
                  key={v.id}
                  onClick={() => handleVoiceChange(v.id)}
                  className="px-3 py-2.5 rounded-lg border transition-all cursor-pointer text-center"
                  style={{
                    backgroundColor: tenderVoice === v.id ? (isNight ? 'rgba(196,160,68,0.12)' : 'rgba(0,0,0,0.04)') : 'transparent',
                    borderColor: tenderVoice === v.id ? (isNight ? '#d4b05a' : '#2c2824') : isNight ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)',
                    color: tenderVoice === v.id ? (isNight ? '#d4b05a' : '#2c2824') : isNight ? 'rgba(255,255,255,0.55)' : '#6b6560',
                  }}
                >
                  <span className="font-serif text-base">{v.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={`p-4 rounded-xl border ${styles.innerBg}`}>
            <div className="flex items-center gap-2 mb-3">
              <Music className={`w-4 h-4 ${styles.accentText}`} />
              <span className={`hw-eyebrow ${styles.mutedText}`}>Backdrop</span>
            </div>
            <select
              id="tender-backdrop-select"
              value={soundEnv}
              onChange={e => setSoundEnv(e.target.value as typeof soundEnv)}
              className={`w-full px-3 py-2 border text-sm rounded-full font-sans cursor-pointer mb-2 ${
                isNight ? 'bg-black/60 border-white/10 text-[#d4b05a]' : 'bg-white border-stone-300'
              }`}
            >
              <option value="silence">Silence</option>
              <option value="rain">Rain</option>
              <option value="forest">Forest</option>
              <option value="ocean">Ocean</option>
              <option value="hearth">Hearth</option>
              <option value="crickets">Crickets</option>
            </select>
            {soundEnv !== 'silence' && (
              <div className="flex items-center gap-2">
                <Volume2 className={`w-4 h-4 ${styles.accentText}`} />
                <input
                  type="range" min="0" max="1" step="0.05" value={ambientVolume}
                  onChange={e => setAmbientVolume(parseFloat(e.target.value))}
                  className="flex-1 h-1 accent-[#d4b05a] cursor-pointer"
                  id="tender-backdrop-volume"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
