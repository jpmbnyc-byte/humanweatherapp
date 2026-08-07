import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, Play, Square, Music, Headphones, Sliders, Check, RefreshCw, Bookmark, BookOpen, ExternalLink, Copy, TextSelect } from 'lucide-react';
import { PRESETS, HUMAN_WEATHER_PRESS_URL } from '../data/presets';
import { getThemeStyles } from '../lib/theme';
import { loadTenderSlots, saveTenderSlot, persistTenderSlots, type TenderSlot } from '../lib/tenderSlots';
import { registerAudioStop, stopAllAudio } from '../lib/stopAllAudio';
import { useSpokenProse } from '../hooks/useSpokenProse';
import {
  ensureVoicesReady,
  refreshStationVoices,
  primeSpeechEngine,
  persistStationVoice,
  setPaceRate,
  getPaceRate,
  getActiveVoiceLabel,
  getSavedVoiceMeta,
  isSavedVoiceEntry,
  pinSavedVoiceInRoster,
  cleanVoiceName,
  rosterTier,
  platformVoiceHint,
  PACE_VALUES,
  paceFromRate,
  isIosPlatform,
  isAndroidPlatform,
  isFamiliarEntry,
  hasFamiliarInRoster,
  isActiveVoiceFamiliar,
  getFamiliarGreeted,
  setFamiliarGreeted,
  familiarVoiceCopy,
  isPersonalVoiceBlockedOnWeb,
  AUDITION_LINE,
  FAMILIAR_GREETING_LINE,
  type RosterEntry,
  type PaceOption,
  type SavedVoiceMeta,
} from '../lib/stationSpeech';
import {
  copyProseForReadAloud,
  getNativeReadAloudGuide,
} from '../lib/nativeReadAloudGuide';

interface TheTenderProps {
  currentTheme: 'day' | 'night';
}

type ProseSource =
  | { type: 'slot'; slotId: string }
  | { type: 'preset'; presetId: string };

export default function TheTender({ currentTheme }: TheTenderProps) {
  const [slots, setSlots] = useState<TenderSlot[]>(() => loadTenderSlots());
  const [source, setSource] = useState<ProseSource>({ type: 'slot', slotId: 'slot-1' });
  const [slotLabel, setSlotLabel] = useState(() => loadTenderSlots()[0]?.label ?? 'Morning note');
  const [inputText, setInputText] = useState(() => loadTenderSlots()[0]?.text ?? '');
  const [saveAck, setSaveAck] = useState(false);
  const [lastSlotId, setLastSlotId] = useState('slot-1');
  const [soundEnv, setSoundEnv] = useState<'rain' | 'forest' | 'ocean' | 'hearth' | 'crickets' | 'silence'>('silence');
  const { speak: speakProse, stop: stopProse, status: proseStatus } = useSpokenProse();
  const isProseSpeaking = proseStatus === 'speaking';
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [currentVoiceLabel, setCurrentVoiceLabel] = useState('');
  const [currentTier, setCurrentTier] = useState<'PREMIUM' | 'ENHANCED' | 'STANDARD' | 'FAMILIAR'>('STANDARD');
  const [currentVoiceFamiliar, setCurrentVoiceFamiliar] = useState(false);
  const [pace, setPace] = useState<PaceOption>('standard');
  const [ambientVolume, setAmbientVolume] = useState(0.4);
  const [inlineVoiceOpen, setInlineVoiceOpen] = useState(false);
  const [showFamiliarGreeting, setShowFamiliarGreeting] = useState(false);
  const [familiarGreetingFading, setFamiliarGreetingFading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [savedVoice, setSavedVoice] = useState<SavedVoiceMeta>({ uri: null, name: null });
  const [liveSpeechCopyAck, setLiveSpeechCopyAck] = useState(false);

  const nativeReadAloudGuide = getNativeReadAloudGuide();

  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const envGainNodeRef = useRef<GainNode | null>(null);
  const suppressTenderStopRef = useRef(false);
  const proseRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const activeSlot = slots.find(s => s.id === (source.type === 'slot' ? source.slotId : ''));
  const isSlotMode = source.type === 'slot';

  const selectSlot = (slotId: string) => {
    stopReading(true);
    let nextSlots = slots;
    if (source.type === 'slot') {
      nextSlots = slots.map(s =>
        s.id === source.slotId ? { ...s, label: slotLabel.trim() || s.label, text: inputText } : s,
      );
      setSlots(nextSlots);
      persistTenderSlots(nextSlots);
    }
    const target = nextSlots.find(s => s.id === slotId);
    if (!target) return;
    setSource({ type: 'slot', slotId });
    setLastSlotId(slotId);
    setSlotLabel(target.label);
    setInputText(target.text);
  };

  const handleSaveSlot = () => {
    if (source.type !== 'slot') return;
    const next = saveTenderSlot({
      id: source.slotId,
      label: slotLabel.trim() || activeSlot?.label || 'Your message',
      text: inputText,
    });
    setSlots(next);
    setSaveAck(true);
    window.setTimeout(() => setSaveAck(false), 2200);
  };

  const copyPresetToSlot = (slotId: string) => {
    if (source.type !== 'preset') return;
    const preset = PRESETS.find(p => p.id === source.presetId);
    const target = slots.find(s => s.id === slotId);
    if (!preset || !target) return;
    stopReading(true);
    setSource({ type: 'slot', slotId });
    setLastSlotId(slotId);
    setSlotLabel(target.label);
    setInputText(preset.text);
  };

  const preferredVoiceName = useCallback(() => {
    const label = currentVoiceLabel || getActiveVoiceLabel();
    const match = pinSavedVoiceInRoster(roster).find(e => cleanVoiceName(e.name) === label);
    return match?.name ?? null;
  }, [currentVoiceLabel, roster]);

  const syncVoiceHeader = useCallback((list: RosterEntry[]) => {
    const label = getActiveVoiceLabel();
    setCurrentVoiceLabel(label);
    const active = list.find(e => cleanVoiceName(e.name) === label);
    setCurrentTier(active ? rosterTier(active) : 'STANDARD');
    setCurrentVoiceFamiliar(isActiveVoiceFamiliar());
  }, []);

  const syncSavedVoice = useCallback(() => {
    void getSavedVoiceMeta().then(setSavedVoice);
  }, []);

  useEffect(() => {
    syncSavedVoice();
  }, [syncSavedVoice]);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      void ensureVoicesReady().then(list => {
        if (cancelled) return;
        setRoster(list);
        setPace(paceFromRate(getPaceRate()));
        syncVoiceHeader(list);
        if (isIosPlatform() && hasFamiliarInRoster(list)) {
          void getFamiliarGreeted().then(greeted => {
            if (!cancelled && !greeted) setShowFamiliarGreeting(true);
          });
        }
      });
    };

    load();

    const onVoicesChanged = () => load();
    const syn = speechSynthesis;
    syn.addEventListener('voiceschanged', onVoicesChanged);

    return () => {
      cancelled = true;
      syn.removeEventListener('voiceschanged', onVoicesChanged);
      stopProse();
      stopSoundEnvironment();
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
    };
  }, [syncVoiceHeader, stopProse]);

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
  }, [ambientVolume, soundEnv, isProseSpeaking]);

  useEffect(() => {
    if (isIosPlatform()) {
      stopSoundEnvironment();
      return;
    }
    if (soundEnv !== 'silence') startSoundEnvironment(soundEnv);
    else stopSoundEnvironment();
  }, [soundEnv]);

  const getAmbientVolumeTarget = () => {
    if (soundEnv === 'silence') return 0;
    if (isProseSpeaking) return ambientVolume * 0.15;
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
    stopProse();
    if (stopAmbient) stopSoundEnvironment();
  };

  useEffect(() => {
    return registerAudioStop(() => {
      if (suppressTenderStopRef.current) return;
      stopProse();
      if (noiseSourceRef.current) {
        try { noiseSourceRef.current.stop(); noiseSourceRef.current.disconnect(); } catch { /* noop */ }
        noiseSourceRef.current = null;
      }
      if (envGainNodeRef.current) {
        try { envGainNodeRef.current.disconnect(); } catch { /* noop */ }
        envGainNodeRef.current = null;
      }
    });
  }, [stopProse]);

  const dismissFamiliarGreeting = useCallback(() => {
    setFamiliarGreetingFading(true);
    window.setTimeout(() => {
      setShowFamiliarGreeting(false);
      setFamiliarGreetingFading(false);
    }, 600);
    void setFamiliarGreeted();
  }, []);

  const handleVoiceSelect = (entry: RosterEntry) => {
    const cleaned = cleanVoiceName(entry.name);
    const tier = rosterTier(entry);
    if (isProseSpeaking) stopProse();
    setCurrentVoiceLabel(cleaned);
    setCurrentTier(tier);
    setCurrentVoiceFamiliar(isFamiliarEntry(entry));
    persistStationVoice(entry);
    void speakProse(AUDITION_LINE, entry.name, { rate: PACE_VALUES[pace] });
    void getSavedVoiceMeta().then(meta => {
      setSavedVoice(meta);
      setInlineVoiceOpen(false);
      proseRef.current?.focus();
    });
  };

  const handleListenStop = () => {
    if (proseStatus === 'speaking') {
      stopProse();
      return;
    }
    const textSrc = inputText.trim();
    if (!textSrc) return;
    if (showFamiliarGreeting) dismissFamiliarGreeting();
    suppressTenderStopRef.current = true;
    stopAllAudio({ skipSpeechCancel: true });
    suppressTenderStopRef.current = false;
    if (!isIosPlatform() && soundEnv !== 'silence') startSoundEnvironment(soundEnv);
    void speakProse(textSrc, preferredVoiceName(), { rate: PACE_VALUES[pace] });
  };

  const handleRefreshVoices = () => {
    if (refreshing) return;
    setRefreshing(true);
    primeSpeechEngine();
    void refreshStationVoices()
      .then(list => {
        setRoster(list);
        syncVoiceHeader(list);
        syncSavedVoice();
        setInlineVoiceOpen(true);
        if (isIosPlatform() && hasFamiliarInRoster(list)) {
          void getFamiliarGreeted().then(greeted => {
            if (!greeted) setShowFamiliarGreeting(true);
          });
        }
      })
      .finally(() => setRefreshing(false));
  };

  const handlePaceChange = (next: PaceOption) => {
    if (isProseSpeaking) stopReading(false);
    setPace(next);
    void setPaceRate(PACE_VALUES[next]);
  };

  const handleSelectAllProse = () => {
    if (isSlotMode && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
      return;
    }
    const el = proseRef.current;
    if (!el) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    proseRef.current?.focus();
  };

  const handleCopyForLiveSpeech = () => {
    void copyProseForReadAloud(inputText).then(ok => {
      if (!ok) return;
      setLiveSpeechCopyAck(true);
      window.setTimeout(() => setLiveSpeechCopyAck(false), 2400);
    });
  };

  const handlePresetSelect = (preset: typeof PRESETS[0]) => {
    stopReading(true);
    if (source.type === 'slot') {
      const next = slots.map(s =>
        s.id === source.slotId ? { ...s, label: slotLabel.trim() || s.label, text: inputText } : s,
      );
      setSlots(next);
      persistTenderSlots(next);
    }
    setSource({ type: 'preset', presetId: preset.id });
    setInputText(preset.text);
    if (preset.id === 'on-bliss') setSoundEnv('forest');
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
    tier === 'FAMILIAR'
      ? isNight ? 'text-[#e8cc6a] border-[#d4b05a]/50' : 'text-amber-900 border-amber-400'
      : tier === 'PREMIUM'
      ? isNight ? 'text-[#d4b05a] border-[#d4b05a]/40' : 'text-amber-800 border-amber-300'
      : tier === 'ENHANCED'
        ? isNight ? 'text-emerald-300/80 border-emerald-500/30' : 'text-emerald-800 border-emerald-300'
        : isNight ? 'text-white/40 border-white/10' : 'text-stone-500 border-stone-200';

  const displayRoster = pinSavedVoiceInRoster(roster);
  const isIos = isIosPlatform();
  const chipName = currentVoiceLabel || (displayRoster[0] ? cleanVoiceName(displayRoster[0].name) : '');

  const goldVoiceText = isNight ? 'text-[#e8cc6a]' : 'text-[#b8860b]';

  const voiceNameClass = (entry: RosterEntry, selected: boolean) => {
    const saved = isSavedVoiceEntry(entry, savedVoice);
    const familiar = isFamiliarEntry(entry);
    if (saved || familiar) return goldVoiceText;
    if (selected) return styles.titleText;
    return styles.mutedText;
  };

  const renderRosterRows = (onSelect: (entry: RosterEntry) => void) =>
    displayRoster.map(entry => {
      const cleaned = cleanVoiceName(entry.name);
      const tier = rosterTier(entry);
      const selected = currentVoiceLabel === cleaned;
      const saved = isSavedVoiceEntry(entry, savedVoice);
      return (
        <li key={entry.uri}>
          <button
            type="button"
            aria-label={`Try and select ${cleaned}, ${tier}`}
            aria-pressed={selected}
            onClick={() => onSelect(entry)}
            className={`w-full text-left px-4 py-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2 min-h-[48px] ${
              selected
                ? isNight ? 'border-[#d4b05a] bg-[#d4b05a]/10' : 'border-[#2c2824] bg-stone-100'
                : saved || isFamiliarEntry(entry)
                  ? isNight ? 'border-[#d4b05a]/40 hover:border-[#d4b05a]/60' : 'border-amber-300 hover:border-amber-400'
                  : isNight ? 'border-white/8 hover:border-white/15' : 'border-stone-200 hover:border-stone-300'
            }`}
          >
            <span className={`font-sans text-sm ${voiceNameClass(entry, selected)}`}>
              {cleaned}
              {isFamiliarEntry(entry) ? ' · Personal' : saved ? ' · Saved' : ''}
            </span>
            <span className={`text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full border shrink-0 ${tierStyle(tier)}`}>
              {tier}
            </span>
          </button>
        </li>
      );
    });

  return (
    <div
      className={`flex flex-col w-full max-w-4xl mx-auto p-5 sm:p-7 rounded-2xl border relative overflow-hidden ${styles.cardBg}`}
      id="the-tender-section"
    >
      <div className={`absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl pointer-events-none z-0 ${isNight ? 'bg-[#d4b05a]/[0.04]' : 'bg-stone-300/20'}`} />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between border-b pb-4 mb-5 border-accent/10 gap-3">
        <div className="text-left max-w-prose">
          <span className="hw-eyebrow block">Guided narration</span>
          <h2 className={`hw-display mt-1 ${styles.titleText}`}>The Tender</h2>
          <p className={`font-serif text-sm italic mt-2 leading-relaxed ${styles.mutedText}`}>
            Write your own words in one of four personal slots — save your message, then press Listen to hear it read aloud.
          </p>
        </div>
      </div>

      <div className="relative z-10 mb-5 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Bookmark className={`w-3.5 h-3.5 ${styles.accentText}`} aria-hidden />
            <span className="hw-eyebrow">Your recordable messages</span>
          </div>
          <p className={`font-sans text-sm leading-relaxed mb-3 ${styles.mutedText}`}>
            Choose a slot, type or paste your own prose, and tap <strong className="font-medium opacity-90">Save message</strong>. Each slot keeps your text on this device for easy replay.
          </p>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Your message slots">
            {slots.map(slot => {
              const selected = source.type === 'slot' && source.slotId === slot.id;
              const hasText = Boolean(slot.text.trim());
              return (
                <button
                  key={slot.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  id={`tender-slot-${slot.id}`}
                  onClick={() => selectSlot(slot.id)}
                  className={`px-4 py-2 rounded-full border font-sans text-sm transition-all cursor-pointer flex items-center gap-2 ${
                    selected ? styles.badgeActive : styles.badgeInactive
                  }`}
                >
                  {slot.label}
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      hasText ? 'bg-accent shadow-[0_0_6px_rgba(196,160,68,0.45)]' : isNight ? 'bg-white/20' : 'bg-stone-300'
                    }`}
                    aria-hidden
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className={`w-3.5 h-3.5 ${styles.accentText}`} aria-hidden />
            <span className="hw-eyebrow">From the library</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(preset => {
              const selected = source.type === 'preset' && source.presetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  id={`preset-tab-${preset.id}`}
                  onClick={() => handlePresetSelect(preset)}
                  className={`px-4 py-2 rounded-full border font-sans text-sm transition-all cursor-pointer text-left ${
                    selected ? styles.badgeActive : styles.badgeInactive
                  }`}
                >
                  <span className="block">{preset.title}</span>
                  {preset.durationLabel && (
                    <span className={`block font-mono text-[9px] uppercase tracking-widest mt-0.5 ${
                      selected ? 'opacity-80' : 'opacity-60'
                    }`}>
                      {preset.durationLabel}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        <div className="md:col-span-7">
          <div className={`p-5 sm:p-6 rounded-xl border text-left flex flex-col min-h-[280px] ${styles.innerBg}`}>
            <AnimatePresence>
              {isProseSpeaking && (
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
              {isProseSpeaking && (
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

            <AnimatePresence>
              {showFamiliarGreeting && (
                <motion.p
                  initial={{ opacity: 1 }}
                  animate={{ opacity: familiarGreetingFading ? 0 : 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  className={`font-mono text-xs tracking-wide mb-3 ${styles.mutedText}`}
                >
                  {FAMILIAR_GREETING_LINE}
                </motion.p>
              )}
            </AnimatePresence>

            <div
              ref={proseRef}
              tabIndex={-1}
              className="flex-1 max-h-[260px] overflow-y-auto pr-1 select-text scrollbar-thin mb-4 outline-none"
            >
              {isSlotMode ? (
                <div className="flex flex-col gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className={`hw-meta ${styles.mutedText}`}>Slot name</span>
                    <input
                      type="text"
                      id="tender-slot-label"
                      value={slotLabel}
                      onChange={e => setSlotLabel(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border font-sans text-sm focus:outline-none ${
                        isNight ? 'bg-black/60 border-white/10 text-white' : 'bg-white border-stone-300 text-[#2c2824]'
                      }`}
                      placeholder="Name this message"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 flex-1">
                    <span className={`hw-meta ${styles.mutedText}`}>Your words</span>
                    <textarea
                      ref={textareaRef}
                      id="tender-custom-textarea"
                      rows={9}
                      className={`w-full p-3 rounded-xl border hw-body focus:outline-none resize-y min-h-[180px] ${
                        isNight ? 'bg-black/60 border-white/10 text-white' : 'bg-white border-stone-300 text-[#2c2824]'
                      }`}
                      placeholder="Write or paste your own reflection, prayer, letter, or reminder here…"
                      value={inputText}
                      onChange={e => { stopReading(true); setInputText(e.target.value); }}
                    />
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      id="tender-save-slot-btn"
                      onClick={handleSaveSlot}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-mono uppercase tracking-widest cursor-pointer transition-colors ${
                        isNight
                          ? 'border-accent/40 text-accent hover:bg-accent/10'
                          : 'border-accent/50 text-[#8a6f2e] hover:bg-accent/5'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      {saveAck ? 'Saved' : 'Save message'}
                    </button>
                    {saveAck && (
                      <span className={`font-mono text-[10px] uppercase tracking-wide ${styles.mutedText}`} aria-live="polite">
                        Ready to listen
                      </span>
                    )}
                  </div>
                </div>
              ) : inputText.trim() ? (
                <>
                  {inputText.split('\n\n').map((paragraph, pIdx) => (
                    <p key={pIdx} className={`mb-4 hw-body text-left ${isNight ? 'text-white/85' : 'text-[#2c2824]'}`}>
                      {paragraph}
                    </p>
                  ))}
                  <button
                    type="button"
                    onClick={() => copyPresetToSlot(lastSlotId)}
                    className={`mt-2 font-mono text-[10px] uppercase tracking-widest cursor-pointer hover:opacity-80 ${styles.accentText}`}
                  >
                    Copy to {slots.find(s => s.id === lastSlotId)?.label ?? 'your slot'} →
                  </button>
                </>
              ) : (
                <p className={`hw-caption ${styles.mutedText}`}>Select a library piece or choose one of your message slots above.</p>
              )}
            </div>

            {nativeReadAloudGuide && inputText.trim() && (
              <div
                className={`mb-4 p-4 rounded-xl border ${
                  isNight
                    ? 'border-[#d4b05a]/25 bg-[#d4b05a]/5'
                    : 'border-amber-200/80 bg-amber-50/60'
                }`}
                id="tender-native-read-aloud-guide"
              >
                <span className={`hw-eyebrow block mb-2 ${styles.mutedText}`}>{nativeReadAloudGuide.title}</span>
                <p className={`font-sans text-xs leading-relaxed mb-3 ${isNight ? 'text-white/75' : 'text-stone-700'}`}>
                  {nativeReadAloudGuide.intro}
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  <button
                    type="button"
                    id="tender-select-all-prose-btn"
                    onClick={handleSelectAllProse}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full border text-[10px] font-mono uppercase tracking-widest cursor-pointer transition-colors ${
                      isNight
                        ? 'border-white/15 text-white/80 hover:border-[#d4b05a]/40'
                        : 'border-stone-300 text-stone-700 hover:border-amber-400'
                    }`}
                  >
                    <TextSelect className="w-3.5 h-3.5" aria-hidden />
                    Select all
                  </button>
                  {nativeReadAloudGuide.showCopyButton && (
                    <button
                      type="button"
                      id="tender-copy-live-speech-btn"
                      onClick={handleCopyForLiveSpeech}
                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full border text-[10px] font-mono uppercase tracking-widest cursor-pointer transition-colors ${
                        isNight
                          ? 'border-[#d4b05a]/40 text-[#d4b05a] hover:bg-[#d4b05a]/10'
                          : 'border-amber-400 text-[#8a6f2e] hover:bg-amber-50'
                      }`}
                    >
                      <Copy className="w-3.5 h-3.5" aria-hidden />
                      {liveSpeechCopyAck ? 'Copied' : nativeReadAloudGuide.copyButtonLabel}
                    </button>
                  )}
                </div>
                <ol className={`list-decimal list-inside space-y-1.5 font-sans text-xs leading-relaxed ${isNight ? 'text-white/70' : 'text-stone-600'}`}>
                  {nativeReadAloudGuide.steps.map(step => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                <p className={`font-mono text-[10px] leading-relaxed mt-3 ${styles.mutedText}`}>
                  {nativeReadAloudGuide.setupHint}
                </p>
              </div>
            )}

            <AnimatePresence>
              {inlineVoiceOpen && displayRoster.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-3"
                  id="tender-inline-voice-chooser"
                >
                  {isIos && (
                    <p className={`font-mono text-xs mb-3 ${styles.mutedText}`}>
                      {familiarVoiceCopy()}
                    </p>
                  )}
                  <ul className="space-y-2 max-h-[180px] overflow-y-auto scrollbar-thin" role="list">
                    {renderRosterRows(handleVoiceSelect)}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between gap-3 border-t border-accent/10 pt-4">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <button
                  type="button"
                  id="tender-voice-chip"
                  onClick={() => {
                    primeSpeechEngine();
                    void ensureVoicesReady().then(list => {
                      setRoster(list);
                      syncVoiceHeader(list);
                      setInlineVoiceOpen(open => !open);
                    });
                  }}
                  aria-expanded={inlineVoiceOpen}
                  aria-controls="tender-inline-voice-chooser"
                  className={`font-mono text-[11px] tracking-wide uppercase text-left cursor-pointer truncate hover:opacity-80 transition-opacity ${
                    currentVoiceFamiliar || (chipName && savedVoice.name === chipName)
                      ? goldVoiceText
                      : styles.mutedText
                  }`}
                >
                  {chipName
                    ? currentVoiceFamiliar
                      ? `READ BY · ${chipName} · FAMILIAR`
                      : `READ BY · ${chipName}`
                    : 'READ BY · standard voice'}
                </button>
                <button
                  type="button"
                  id="tender-refresh-voices-btn"
                  onClick={handleRefreshVoices}
                  disabled={refreshing}
                  aria-label="Refresh voice list"
                  title="Refresh voices"
                  className={`p-1.5 rounded-full border cursor-pointer transition-all disabled:opacity-40 ${
                    isNight ? 'border-white/10 text-white/60 hover:text-white/90' : 'border-stone-300 text-stone-600 hover:text-[#2c2824]'
                  }`}
                >
                  <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <button
                id="tender-play-toggle-btn"
                disabled={!inputText.trim()}
                onClick={handleListenStop}
                aria-label={isProseSpeaking ? 'Stop reading' : 'Listen now'}
                aria-pressed={isProseSpeaking}
                className={`px-5 py-2.5 rounded-full hw-btn-label flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-30 ${
                  isProseSpeaking
                    ? isNight ? 'text-red-300/90 border border-red-500/30' : 'text-red-800 border border-red-300'
                    : isNight ? 'bg-[#d4b05a] text-white' : 'bg-[#2c2824] text-white'
                }`}
              >
                {isProseSpeaking ? (
                  <><Square className="w-3.5 h-3.5 fill-current" /> Stop</>
                ) : (
                  <><Play className="w-3.5 h-3.5 fill-current" /> Listen now</>
                )}
                {proseStatus === 'error' && (
                  <span className="text-[10px] font-mono normal-case tracking-normal opacity-80">voice unavailable</span>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="md:col-span-5 flex flex-col gap-4">
          <div className={`p-4 rounded-xl border ${styles.innerBg}`} id="voice-panel">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Sliders className={`w-4 h-4 ${styles.accentText}`} />
                <span className={`hw-eyebrow ${styles.mutedText}`}>Voice</span>
              </div>
              <button
                type="button"
                id="tender-voice-panel-refresh-btn"
                onClick={handleRefreshVoices}
                disabled={refreshing}
                aria-label="Refresh voice list"
                className={`px-3 py-1.5 rounded-full border text-[11px] font-mono uppercase tracking-wide flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-40 ${
                  isNight ? 'border-white/10 text-white/60 hover:text-white/90' : 'border-stone-300 text-stone-600 hover:text-[#2c2824]'
                }`}
              >
                <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh voices
              </button>
            </div>

            {isPersonalVoiceBlockedOnWeb() && roster.length > 0 && !hasFamiliarInRoster(roster) && (
              <p
                className={`font-sans text-xs leading-relaxed mb-4 p-3 rounded-lg border ${
                  isNight
                    ? 'border-[#d4b05a]/25 bg-[#d4b05a]/5 text-white/75'
                    : 'border-amber-200 bg-amber-50/80 text-stone-700'
                }`}
                id="tender-personal-voice-pwa-notice"
              >
                Personal Voice does not appear in iPhone web apps. Use the Live Speech guide below the prose — highlight, copy, then triple-click the side button.
              </p>
            )}

            {isAndroidPlatform() && roster.length > 0 && (
              <p
                className={`font-sans text-xs leading-relaxed mb-4 p-3 rounded-lg border ${
                  isNight
                    ? 'border-[#d4b05a]/25 bg-[#d4b05a]/5 text-white/75'
                    : 'border-amber-200 bg-amber-50/80 text-stone-700'
                }`}
                id="tender-android-read-aloud-notice"
              >
                For your full system voice, use the read-aloud guide below the prose — Select all, then ⋮ More → Speak or Read aloud.
              </p>
            )}

            {displayRoster.length === 0 ? (
              <p className={`hw-caption ${styles.mutedText}`}>
                This device&apos;s standard voice will be used.
              </p>
            ) : (
              <>
                <div className="mb-4 pb-3 border-b border-accent/10">
                  <span className={`hw-eyebrow block mb-1 ${styles.mutedText}`}>Current voice</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-serif text-base ${
                      currentVoiceLabel || currentVoiceFamiliar || savedVoice.name
                        ? goldVoiceText
                        : styles.titleText
                    }`}>
                      {currentVoiceLabel || cleanVoiceName(displayRoster[0].name)}
                    </span>
                    <span className={`text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full border ${tierStyle(currentTier)}`}>
                      {currentTier}
                    </span>
                  </div>
                </div>

                <ul className="space-y-2 mb-4 max-h-[220px] overflow-y-auto scrollbar-thin" role="list">
                  {renderRosterRows(handleVoiceSelect)}
                </ul>

                <p className={`hw-caption text-xs mb-4 ${styles.mutedText}`}>{platformVoiceHint()}</p>
              </>
            )}

            <div className="pt-3 border-t border-accent/10">
              <span className={`hw-eyebrow block mb-2 ${styles.mutedText}`}>Pace</span>
              <div className="flex gap-2" role="radiogroup" aria-label="Speech pace">
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

      <div className="relative z-10 mt-8 pt-6 border-t border-accent/10" id="tender-press-card">
        <a
          href={HUMAN_WEATHER_PRESS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`hw-pressable block p-5 rounded-xl border text-left transition-colors ${
            isNight
              ? 'border-white/10 bg-black/20 hover:border-[#d4b05a]/30 hover:bg-black/30'
              : 'border-stone-200/80 bg-white/50 hover:border-stone-300 hover:bg-white/80'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span className={`hw-eyebrow block mb-2 ${styles.mutedText}`}>Human Weather Press</span>
              <h3 className={`font-serif text-lg font-medium leading-snug mb-2 ${styles.titleText}`}>
                More available at Human Weather Press
              </h3>
              <p className={`font-sans text-sm leading-relaxed ${styles.mutedText}`}>
                The full On Bliss series, essays, and books — beyond what plays here in The Tender.
              </p>
              <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase mt-4 ${styles.accentText}`}>
                humanweather.press
                <ExternalLink className="w-3 h-3" aria-hidden />
              </span>
            </div>
            <BookOpen className={`w-5 h-5 shrink-0 mt-1 ${styles.accentText} opacity-70`} aria-hidden />
          </div>
        </a>
      </div>
    </div>
  );
}
