import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, Play, Square, Music, Headphones, Sliders, Edit2, Check } from 'lucide-react';
import { PRESETS } from '../data/presets';
import { getThemeStyles } from '../lib/theme';
import {
  initStationSpeech,
  stationSpeak,
  stationStop,
  chooseStationVoice,
  setPaceRate,
  getPaceRate,
  getActiveVoiceLabel,
  dedupeRoster,
  cleanVoiceName,
  rosterTier,
  platformVoiceHint,
  PACE_VALUES,
  paceFromRate,
  type RosterEntry,
  type PaceOption,
} from '../lib/stationSpeech';

interface TheTenderProps {
  currentTheme: 'day' | 'night';
}

export default function TheTender({ currentTheme }: TheTenderProps) {
  const [inputText, setInputText] = useState(PRESETS[0].text);
  const [soundEnv, setSoundEnv] = useState<'rain' | 'forest' | 'ocean' | 'hearth' | 'crickets' | 'silence'>('silence');
  const [speaking, setSpeaking] = useState(false);
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [currentVoiceLabel, setCurrentVoiceLabel] = useState('');
  const [currentTier, setCurrentTier] = useState<'PREMIUM' | 'ENHANCED' | 'STANDARD'>('STANDARD');
  const [pace, setPace] = useState<PaceOption>('standard');
  const [ambientVolume, setAmbientVolume] = useState(0.4);
  const [isEditMode, setIsEditMode] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const envGainNodeRef = useRef<GainNode | null>(null);
  const speakSessionRef = useRef(0);

  const syncVoiceHeader = useCallback((list: RosterEntry[]) => {
    const label = getActiveVoiceLabel();
    setCurrentVoiceLabel(label);
    const active = list.find(e => cleanVoiceName(e.name) === label);
    setCurrentTier(active ? rosterTier(active) : 'STANDARD');
  }, []);

  useEffect(() => {
    let cancelled = false;
    void initStationSpeech().then(list => {
      if (cancelled) return;
      setRoster(list);
      setPace(paceFromRate(getPaceRate()));
      syncVoiceHeader(list);
    });

    const onVoicesChanged = () => {
      void initStationSpeech().then(list => {
        if (cancelled) return;
        setRoster(list);
        syncVoiceHeader(list);
      });
    };
    const prevVoicesHandler = speechSynthesis.onvoiceschanged;
    speechSynthesis.onvoiceschanged = () => {
      prevVoicesHandler?.call(speechSynthesis, new Event('voiceschanged'));
      onVoicesChanged();
    };

    return () => {
      cancelled = true;
      speechSynthesis.onvoiceschanged = prevVoicesHandler;
      stationStop();
      stopSoundEnvironment();
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
    };
  }, [syncVoiceHeader]);

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
  }, [ambientVolume, soundEnv, speaking]);

  useEffect(() => {
    if (soundEnv !== 'silence') startSoundEnvironment(soundEnv);
    else stopSoundEnvironment();
  }, [soundEnv]);

  const getAmbientVolumeTarget = () => {
    if (soundEnv === 'silence') return 0;
    if (speaking) return ambientVolume * 0.15;
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
    speakSessionRef.current += 1;
    stationStop();
    setSpeaking(false);
    if (stopAmbient) stopSoundEnvironment();
  };

  const handleListenStop = () => {
    if (speaking) {
      stopReading(false);
      return;
    }
    const textSrc = inputText.trim();
    if (!textSrc || isEditMode) return;

    const session = ++speakSessionRef.current;
    if (soundEnv !== 'silence') startSoundEnvironment(soundEnv);
    setSpeaking(true);

    void stationSpeak(textSrc).finally(() => {
      if (speakSessionRef.current === session) setSpeaking(false);
    });
  };

  const handlePaceChange = (next: PaceOption) => {
    if (speaking) stopReading(false);
    setPace(next);
    void setPaceRate(PACE_VALUES[next]);
  };

  const handlePresetSelect = (preset: typeof PRESETS[0]) => {
    stopReading(true);
    setInputText(preset.text);
    setIsEditMode(false);
    if (preset.id === 'solitude') setSoundEnv('ocean');
    else if (preset.id === 'reflection') setSoundEnv('rain');
    else setSoundEnv('silence');
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

  const tierStyle = (tier: string) =>
    tier === 'PREMIUM'
      ? isNight ? 'text-[#d4b05a] border-[#d4b05a]/40' : 'text-amber-800 border-amber-300'
      : tier === 'ENHANCED'
        ? isNight ? 'text-emerald-300/80 border-emerald-500/30' : 'text-emerald-800 border-emerald-300'
        : isNight ? 'text-white/40 border-white/10' : 'text-stone-500 border-stone-200';

  const displayRoster = dedupeRoster(roster);

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
              {speaking && (
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
              {speaking && (
                <span className="flex items-end gap-[2px] h-3" aria-hidden="true">
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
                inputText.split('\n\n').map((paragraph, pIdx) => (
                  <p key={pIdx} className={`mb-4 hw-body text-left ${speaking ? (isNight ? 'text-white/85' : 'text-[#2c2824]') : isNight ? 'text-white/85' : 'text-[#2c2824]'}`}>
                    {paragraph}
                  </p>
                ))
              ) : (
                <p className={`hw-caption ${styles.mutedText}`}>Choose a preset or edit your own prose.</p>
              )}
            </div>

            <div className="flex gap-2 justify-end border-t border-accent/10 pt-4">
              <button
                id="tender-play-toggle-btn"
                disabled={isEditMode || !inputText.trim()}
                onClick={handleListenStop}
                aria-pressed={speaking}
                className={`px-5 py-2.5 rounded-full hw-btn-label flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-30 ${
                  speaking
                    ? isNight ? 'text-red-300/90 border border-red-500/30' : 'text-red-800 border border-red-300'
                    : isNight ? 'bg-[#d4b05a] text-white' : 'bg-[#2c2824] text-white'
                }`}
              >
                {speaking ? (
                  <><Square className="w-3.5 h-3.5 fill-current" /> Stop</>
                ) : (
                  <><Play className="w-3.5 h-3.5 fill-current" /> Listen</>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="md:col-span-5 flex flex-col gap-4">
          <div className={`p-4 rounded-xl border ${styles.innerBg}`} id="voice-panel">
            <div className="flex items-center gap-2 mb-3">
              <Sliders className={`w-4 h-4 ${styles.accentText}`} />
              <span className={`hw-eyebrow ${styles.mutedText}`}>Voice</span>
            </div>

            {displayRoster.length === 0 ? (
              <p className={`hw-caption ${styles.mutedText}`}>
                This device&apos;s standard voice will be used.
              </p>
            ) : (
              <>
                <div className="mb-4 pb-3 border-b border-accent/10">
                  <span className={`hw-eyebrow block mb-1 ${styles.mutedText}`}>Current voice</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-serif text-base ${styles.titleText}`}>
                      {currentVoiceLabel || cleanVoiceName(displayRoster[0].name)}
                    </span>
                    <span className={`text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full border ${tierStyle(currentTier)}`}>
                      {currentTier}
                    </span>
                  </div>
                </div>

                <ul className="space-y-2 mb-4 max-h-[220px] overflow-y-auto scrollbar-thin" role="list">
                  {displayRoster.map(entry => {
                    const cleaned = cleanVoiceName(entry.name);
                    const tier = rosterTier(entry);
                    const selected = currentVoiceLabel === cleaned;
                    return (
                      <li key={entry.uri}>
                        <button
                          type="button"
                          aria-label={`Try and select ${cleaned}, ${tier}`}
                          aria-pressed={selected}
                          onClick={() => {
                            if (speaking) stopReading(false);
                            setCurrentVoiceLabel(cleaned);
                            setCurrentTier(tier);
                            setSpeaking(true);
                            void chooseStationVoice(entry).finally(() => setSpeaking(false));
                          }}
                          className={`w-full text-left px-4 py-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2 min-h-[48px] ${
                            selected
                              ? isNight ? 'border-[#d4b05a] bg-[#d4b05a]/10' : 'border-[#2c2824] bg-stone-100'
                              : isNight ? 'border-white/8 hover:border-white/15' : 'border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          <span className={`font-sans text-sm ${selected ? styles.titleText : styles.mutedText}`}>{cleaned}</span>
                          <span className={`text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full border shrink-0 ${tierStyle(tier)}`}>
                            {tier}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <p className={`hw-caption text-xs mb-4 ${styles.mutedText}`}>{platformVoiceHint()}</p>
              </>
            )}

            <div className="pt-3 border-t border-accent/10">
              <span className={`hw-eyebrow block mb-2 ${styles.mutedText}`}>Pace</span>
              <div className="flex gap-2" role="radiogroup" aria-label="Reading pace">
                {(['slow', 'standard', 'brisk'] as const).map(opt => (
                  <button
                    key={opt}
                    type="button"
                    role="radio"
                    aria-checked={pace === opt}
                    onClick={() => handlePaceChange(opt)}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm font-sans capitalize cursor-pointer transition-all ${
                      pace === opt ? styles.badgeActive : styles.badgeInactive
                    }`}
                  >
                    {opt === 'slow' ? 'Slow' : opt === 'brisk' ? 'Brisk' : 'Standard'}
                  </button>
                ))}
              </div>
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
