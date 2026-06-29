import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Volume2, Play, Pause, Square, Music, Headphones, Sliders, Edit2, Check, Globe } from 'lucide-react';
import { PRESETS } from '../data/presets';

interface TheTenderProps {
  currentTheme: 'day' | 'night';
}

export default function TheTender({ currentTheme }: TheTenderProps) {
  const [inputText, setInputText] = useState(PRESETS[0].text);
  const [activeVoice, setActiveVoice] = useState<'warm' | 'deep' | 'gentle' | 'resonant'>('warm');
  const [activeAccent, setActiveAccent] = useState<'us' | 'uk' | 'au' | 'ie' | 'za' | 'in'>('uk');
  const [soundEnv, setSoundEnv] = useState<'rain' | 'forest' | 'ocean' | 'hearth' | 'crickets' | 'silence'>('silence');
  
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
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speakTimeoutRef = useRef<any>(null);

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

  const getVoiceSettings = (voice: typeof activeVoice) => {
    switch (voice) {
      case 'warm': return { pitch: 0.95, rate: 0.85 };
      case 'deep': return { pitch: 0.78, rate: 0.82 };
      case 'gentle': return { pitch: 1.05, rate: 0.76 };
      case 'resonant': return { pitch: 1.0, rate: 0.88 };
    }
  };

  // Speech synthesizers triggers
  const handleStartReading = (
    textToUse?: string, 
    voiceOverride?: typeof activeVoice, 
    accentOverride?: typeof activeAccent
  ) => {
    const textSrc = textToUse !== undefined ? textToUse : inputText;
    if (!textSrc.trim()) return;

    if (speakTimeoutRef.current) {
      clearTimeout(speakTimeoutRef.current);
    }

    setSpeechError(null);
    setIsPreparing(true);
    setIsReading(false);
    setIsPaused(false);

    if (window.speechSynthesis) {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        window.speechSynthesis.cancel();
      } catch (e) {}
    }

    // Split text into words for boundary highlighting matching
    const words = textSrc.split(/\s+/);
    setWordsList(words);
    setCurrentWordIndex(-1);

    // Give SpeechSynthesis cancel time to settle beautifully
    speakTimeoutRef.current = setTimeout(() => {
      try {
        const currentVoice = voiceOverride || activeVoice;
        const currentAccent = accentOverride || activeAccent;
        const settings = getVoiceSettings(currentVoice);
        const utterance = new SpeechSynthesisUtterance(textSrc);
        utterance.pitch = settings.pitch;
        utterance.rate = settings.rate;

        if (window.speechSynthesis) {
          const voices = window.speechSynthesis.getVoices();
          
          const accentLangMap: Record<string, string> = {
            uk: 'en-gb',
            us: 'en-us',
            au: 'en-au',
            ie: 'en-ie',
            za: 'en-za',
            in: 'en-in'
          };
          
          const targetLangCode = accentLangMap[currentAccent];
          let filteredVoices = voices.filter(v => v.lang.toLowerCase().startsWith(targetLangCode));
          
          if (filteredVoices.length === 0) {
            filteredVoices = voices.filter(v => v.lang.toLowerCase().startsWith('en'));
          }
          if (filteredVoices.length === 0) {
            filteredVoices = voices;
          }

          let voiceMatch: SpeechSynthesisVoice | undefined = undefined;
          
          if (currentVoice === 'deep') {
            const deepIdentifiers = ['david', 'daniel', 'male', 'george', 'mick', 'rishi', 'jamie', 'oliver', 'alex', 'premium male'];
            voiceMatch = filteredVoices.find(v => deepIdentifiers.some(id => v.name.toLowerCase().includes(id)));
          } else if (currentVoice === 'warm') {
            const warmIdentifiers = ['samantha', 'zira', 'karen', 'serena', 'moira', 'tessa', 'rishi', 'veena', 'kate', 'google', 'natural', 'premium'];
            voiceMatch = filteredVoices.find(v => warmIdentifiers.some(id => v.name.toLowerCase().includes(id)));
          } else if (currentVoice === 'gentle') {
            const gentleIdentifiers = ['samantha', 'zira', 'karen', 'moira', 'tessa', 'veena', 'serena', 'kate', 'victoria', 'hazel', 'susan', 'female'];
            voiceMatch = filteredVoices.find(v => gentleIdentifiers.some(id => v.name.toLowerCase().includes(id)));
          } else if (currentVoice === 'resonant') {
            const resonantIdentifiers = ['daniel', 'serena', 'tessa', 'moira', 'veena', 'rishi', 'samantha', 'google', 'natural', 'premium'];
            voiceMatch = filteredVoices.find(v => resonantIdentifiers.some(id => v.name.toLowerCase().includes(id)));
          }
          
          if (!voiceMatch) {
            voiceMatch = filteredVoices[0];
          }
          
          const selectedVoice = voiceMatch || voices[0];
          if (selectedVoice) {
            utterance.voice = selectedVoice;
            console.log(`[Voice Accent Registry] Accent: "${currentAccent}", Tone: "${currentVoice}" -> Configured:`, selectedVoice.name);
          }
        }

        utteranceRef.current = utterance;

        utterance.onstart = () => {
          if (utteranceRef.current === utterance) {
            setIsReading(true);
            setIsPreparing(false);
            setIsPaused(false);
            setSpeechError(null);
            setCurrentWordIndex(0);
          }
        };

        // Bulletproof dynamic real-time word mapping via text slicing
        utterance.onboundary = (event) => {
          if (utteranceRef.current !== utterance) return;
          if (event.name === 'word') {
            const textBefore = textSrc.substring(0, event.charIndex);
            const wordIndex = textBefore.trim() === "" ? 0 : textBefore.trim().split(/\s+/).length;
            setCurrentWordIndex(wordIndex);
          }
        };

        utterance.onend = () => {
          if (utteranceRef.current === utterance) {
            setIsReading(false);
            setIsPreparing(false);
            setIsPaused(false);
            setCurrentWordIndex(-1);
            utteranceRef.current = null;
          }
        };

        utterance.onerror = (e) => {
          if (utteranceRef.current === utterance) {
            setIsReading(false);
            setIsPreparing(false);
            setIsPaused(false);
            setCurrentWordIndex(-1);
            utteranceRef.current = null;
            if (e.error && e.error !== 'interrupted') {
              setSpeechError(e.error);
            }
          }
        };

        if (window.speechSynthesis) {
          window.speechSynthesis.speak(utterance);
        } else {
          setSpeechError('not-supported');
          setIsPreparing(false);
        }
      } catch (err: any) {
        setSpeechError(err.message || 'unknown');
        setIsPreparing(false);
      }
    }, 100);
  };

  const handlePauseToggle = () => {
    if (isReading) {
      if (isPaused) {
        if (window.speechSynthesis) window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        if (window.speechSynthesis) window.speechSynthesis.pause();
        setIsPaused(true);
      }
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
    utteranceRef.current = null;
    
    if (window.speechSynthesis) {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    setIsReading(false);
    setIsPreparing(false);
    setIsPaused(false);
    setCurrentWordIndex(-1);
    
    if (stopAmbient) {
      stopSoundEnvironment();
    }
  };

  const handleVoiceChange = (voice: typeof activeVoice) => {
    setActiveVoice(voice);
    if (isReading) {
      stopReading(false);
      setTimeout(() => {
        handleStartReading(inputText, voice, activeAccent);
      }, 150);
    }
  };

  const handleAccentChange = (accent: typeof activeAccent) => {
    setActiveAccent(accent);
    if (isReading) {
      stopReading(false);
      setTimeout(() => {
        handleStartReading(inputText, activeVoice, accent);
      }, 150);
    }
  };

  const handlePresetSelect = (preset: typeof PRESETS[0]) => {
    stopReading(true);
    setInputText(preset.text);
    setIsEditMode(false);
    
    // Automatically match appropriate ambient weather backdrop for the preset
    let backdrop: typeof soundEnv = 'silence';
    if (preset.id === 'joy') backdrop = 'forest';
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

            {/* Diagnostics Warnings */}
            {speechError && (
              <div className="mt-4 p-2.5 bg-red-950/15 border border-red-500/10 rounded-lg text-[10px] font-mono text-red-300 leading-normal">
                ⚠️ Voice familiarization note: Browser restricted speaking. Click the button below to allow speech audio.
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
          
          {/* Narrator Regional Accent Selection */}
          <div className={`p-4 rounded-xl border flex flex-col justify-between ${styles.innerBg}`}>
            <div className="flex items-center gap-1.5 border-b pb-2 mb-3 border-zinc-200/10" style={{ borderColor: isNight ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
              <Globe className={`w-3.5 h-3.5 ${styles.goldText}`} />
              <span className={`font-mono text-[9px] uppercase tracking-widest ${styles.mutedText}`}>
                Narrator Accent (Apple Style)
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'uk', label: 'UK British', flag: '🇬🇧' },
                { id: 'us', label: 'US American', flag: '🇺🇸' },
                { id: 'au', label: 'AU Australian', flag: '🇦🇺' },
                { id: 'ie', label: 'IE Irish', flag: '🇮🇪' },
                { id: 'za', label: 'ZA S. African', flag: '🇿🇦' },
                { id: 'in', label: 'IN Indian', flag: '🇮🇳' },
              ].map((acc) => {
                const isSelected = activeAccent === acc.id;
                return (
                  <button
                    id={`accent-btn-${acc.id}`}
                    key={acc.id}
                    onClick={() => handleAccentChange(acc.id as any)}
                    className="px-1.5 py-1.5 text-[9.5px] font-mono rounded border transition-all cursor-pointer flex flex-col items-center justify-center gap-1"
                    style={{
                      backgroundColor: isSelected 
                        ? isNight ? 'rgba(234,179,8,0.12)' : 'rgba(217,119,6,0.1)' 
                        : 'transparent',
                      borderColor: isSelected 
                        ? isNight ? '#eab308' : '#d97706' 
                        : isNight ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)',
                      color: isSelected 
                        ? isNight ? '#eab308' : '#d97706' 
                        : isNight ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)',
                    }}
                    title={acc.label}
                  >
                    <span className="text-sm leading-none">{acc.flag}</span>
                    <span className="text-[8px] uppercase tracking-tight">{acc.id}</span>
                  </button>
                );
              })}
            </div>
            <p className="font-sans text-[9.5px] italic text-left opacity-60 mt-2">
              Apple-inspired regional neural system voice targets.
            </p>
          </div>

          {/* Narrator Voice Pitch Registers Selection */}
          <div className={`p-4 rounded-xl border flex flex-col justify-between ${styles.innerBg}`}>
            <div className="flex items-center gap-1.5 border-b pb-2 mb-3 border-zinc-200/10" style={{ borderColor: isNight ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
              <Sliders className={`w-3.5 h-3.5 ${styles.goldText}`} />
              <span className={`font-mono text-[9px] uppercase tracking-widest ${styles.mutedText}`}>
                Narrator Tone Register
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(['warm', 'deep', 'gentle', 'resonant'] as const).map((v) => {
                const isSelected = activeVoice === v;
                return (
                  <button
                    id={`voice-register-btn-${v}`}
                    key={v}
                    onClick={() => handleVoiceChange(v)}
                    className="px-2.5 py-2 text-[10px] font-mono rounded border uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
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
                    <span className={`w-1 h-1 rounded-full ${isSelected ? (isNight ? 'bg-[#eab308]' : 'bg-[#d97706]') : 'bg-transparent'}`} />
                    {v}
                  </button>
                );
              })}
            </div>
            <p className="font-sans text-[9.5px] italic text-left opacity-60 mt-2">
              Changes apply instantly and restart speech narration smoothly.
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
              The somatic narrator engine uses your operating system's native text-to-speech API to narrate contemplative prose. As you listen, our local Web Audio synthesizes real-time natural frequency backdrops, smoothly ducking in volume to keep the voice clean, warm, and comforting.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
