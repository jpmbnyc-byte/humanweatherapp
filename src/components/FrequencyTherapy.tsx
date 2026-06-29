import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { FREQUENCY_TONES } from '../data';
import { FrequencyTone } from '../types';
import { Headphones, Volume2, Play, Square, Info } from 'lucide-react';

interface FrequencyTherapyProps {
  currentTheme: 'day' | 'night';
}

export default function FrequencyTherapy({ currentTheme }: FrequencyTherapyProps) {
  const [activeTone, setActiveTone] = useState<FrequencyTone | null>(null);
  const [volume, setVolume] = useState(0.4); // 0 to 1
  const [isPlaying, setIsPlaying] = useState(false);

  // Web Audio API refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscLeftRef = useRef<OscillatorNode | null>(null);
  const oscRightRef = useRef<OscillatorNode | null>(null);
  const pannerLeftRef = useRef<StereoPannerNode | null>(null);
  const pannerRightRef = useRef<StereoPannerNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Stop current audio generator
  const stopAudio = () => {
    try {
      if (oscLeftRef.current) {
        oscLeftRef.current.stop();
        oscLeftRef.current.disconnect();
        oscLeftRef.current = null;
      }
      if (oscRightRef.current) {
        oscRightRef.current.stop();
        oscRightRef.current.disconnect();
        oscRightRef.current = null;
      }
      if (pannerLeftRef.current) pannerLeftRef.current.disconnect();
      if (pannerRightRef.current) pannerRightRef.current.disconnect();
      if (gainNodeRef.current) gainNodeRef.current.disconnect();
    } catch (e) {
      console.warn('Audio cleanup exception:', e);
    }
    setIsPlaying(false);
  };

  // Start audio generator
  const startAudio = (tone: FrequencyTone) => {
    stopAudio();

    try {
      // Lazy init AudioContext
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Create main gain node
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(volume * 0.5, ctx.currentTime); // Soft volume default
      gainNode.connect(ctx.destination);
      gainNodeRef.current = gainNode;

      if (tone.type === 'binaural') {
        // Binaural setup
        const carrier = 180; // Grounding carrier frequency
        const offset = tone.hz;

        // Left channel oscillator (Carrier)
        const oscL = ctx.createOscillator();
        oscL.type = 'sine';
        oscL.frequency.setValueAtTime(carrier, ctx.currentTime);

        const panL = ctx.createStereoPanner();
        panL.pan.setValueAtTime(-1, ctx.currentTime);

        oscL.connect(panL);
        panL.connect(gainNode);
        oscL.start();
        oscLeftRef.current = oscL;
        pannerLeftRef.current = panL;

        // Right channel oscillator (Carrier + Offset)
        const oscR = ctx.createOscillator();
        oscR.type = 'sine';
        oscR.frequency.setValueAtTime(carrier + offset, ctx.currentTime);

        const panR = ctx.createStereoPanner();
        panR.pan.setValueAtTime(1, ctx.currentTime);

        oscR.connect(panR);
        panR.connect(gainNode);
        oscR.start();
        oscRightRef.current = oscR;
        pannerRightRef.current = panR;

      } else {
        // Solfeggio setup (mono sine wave)
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(tone.hz, ctx.currentTime);
        
        osc.connect(gainNode);
        osc.start();
        oscLeftRef.current = osc; // reuse left ref
      }

      setActiveTone(tone);
      setIsPlaying(true);
    } catch (error) {
      console.error('Failed to initialize Web Audio API generator:', error);
    }
  };

  // Adjust volume dynamically
  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(volume * 0.5, audioCtxRef.current.currentTime);
    }
  }, [volume]);

  // Handle tone selection click
  const handleToneClick = (tone: FrequencyTone) => {
    if (activeTone?.id === tone.id && isPlaying) {
      stopAudio();
      setActiveTone(null);
    } else {
      setActiveTone(tone);
      startAudio(tone);
    }
  };

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      stopAudio();
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return (
    <div className={`flex flex-col w-full max-w-4xl mx-auto p-6 rounded-2xl border backdrop-blur-md ${
      currentTheme === 'night' 
        ? 'bg-[#121214]/80 border-white/[0.08]' 
        : 'bg-white/75 border-sky-300/40 shadow-lg shadow-sky-100/30'
    }`}
         id="frequency-therapy-section">
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <span className="font-mono text-[10px] tracking-widest uppercase opacity-50 block mb-1">05 — NEURAL REGULATION</span>
          <h2 className="font-serif text-2xl text-gold font-medium">Frequency Therapy</h2>
          <p className="font-serif text-xs italic opacity-85 mt-1">
            Restorative sound waves synthesized in real time to gently clear mental static and support neural harmony.
          </p>
        </div>

        {/* Global Volume & Quick Controls */}
        <div className="flex items-center gap-3 bg-black/30 px-4 py-2.5 rounded-full border border-gold/15">
          <Volume2 className="w-4 h-4 text-gold/80" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-24 h-1 bg-gold/15 rounded-lg appearance-none cursor-pointer accent-gold focus:outline-none"
            id="freq-volume-slider"
          />
          {isPlaying && (
            <button
              id="stop-global-freq-btn"
              onClick={() => {
                stopAudio();
                setActiveTone(null);
              }}
              className="ml-2 px-3 py-1 bg-red-500/15 text-red-400 border border-red-500/30 rounded-full font-mono text-[10px] uppercase tracking-wider flex items-center gap-1 hover:bg-red-500/25 transition-all cursor-pointer"
            >
              <Square className="w-2.5 h-2.5 fill-current" /> Stop
            </button>
          )}
        </div>
      </div>

      {/* Headphone Advisory Alert */}
      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-gold/5 border border-gold/10 mb-6 text-xs text-gold/90">
        <Headphones className="w-4 h-4 mt-0.5 shrink-0" />
        <p className="font-serif italic leading-relaxed">
          <strong className="font-mono text-[10px] uppercase tracking-wider not-italic mr-1 text-gold">Note:</strong> 
          Binaural frequencies (Delta, Theta, Alpha, Beta) require stereo headphones. The left and right channels output distinct, slightly separated frequencies, allowing your brain to naturally perceive the differential beat.
        </p>
      </div>

      {/* Grid of Frequency Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {FREQUENCY_TONES.map((tone) => {
          const isActive = activeTone?.id === tone.id && isPlaying;
          return (
            <motion.div
              key={tone.id}
              whileHover={{ scale: 1.02 }}
              className={`relative p-5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all duration-300 ${
                isActive 
                  ? currentTheme === 'night' 
                    ? 'bg-amber-500/10 border-amber-400 shadow-[0_0_20px_rgba(234,179,8,0.15)]' 
                    : 'bg-amber-500/10 border-amber-500 shadow-[0_0_20px_rgba(217,119,6,0.15)]'
                  : currentTheme === 'night'
                    ? 'bg-black/35 border-white/[0.06] hover:bg-white/[0.03]'
                    : 'bg-sky-100/15 border-sky-200/55 hover:bg-sky-100/30'
              }`}
              onClick={() => handleToneClick(tone)}
              id={`freq-card-${tone.id}`}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className={`font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                    tone.type === 'binaural' 
                      ? 'border-purple-500/30 bg-purple-500/5 text-purple-400' 
                      : 'border-amber-500/30 bg-amber-500/5 text-amber-400'
                  }`}>
                    {tone.type}
                  </span>
                  
                  {isActive && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-gold"></span>
                    </span>
                  )}
                </div>

                <h3 className="font-serif text-lg font-medium text-gold leading-tight mb-1">
                  {tone.name}
                </h3>
                <h4 className="font-serif text-xs italic opacity-80 mb-2 leading-snug">
                  {tone.subtitle}
                </h4>
                <p className="font-serif text-[11px] leading-relaxed opacity-60">
                  {tone.description}
                </p>
              </div>

              {/* Waveform Visualization Overlay (for active cards) */}
              <div className="mt-4 pt-4 border-t border-gold/10 flex items-center justify-between">
                <span className="font-mono text-[9px] opacity-40 uppercase">
                  {tone.hz} Hz
                </span>
                
                <button className="text-gold/80 hover:text-gold flex items-center gap-1 text-xs font-mono">
                  {isActive ? (
                    <>
                      <Square className="w-3 h-3 fill-current" /> STOP
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-current" /> PLAY
                    </>
                  )}
                </button>
              </div>

              {/* Animated waveform visual feedback on card when active */}
              {isActive && (
                <div className="absolute inset-x-0 bottom-0 h-1 overflow-hidden rounded-b-xl opacity-60">
                  <svg className="w-full h-full" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <motion.path
                      d="M0 5 Q 25 1, 50 5 T 100 5"
                      fill="transparent"
                      stroke={currentTheme === 'night' ? '#eab308' : '#d97706'}
                      strokeWidth="2"
                      animate={{
                        d: [
                          "M0 5 Q 25 1, 50 5 T 100 5",
                          "M0 5 Q 25 9, 50 5 T 100 5",
                          "M0 5 Q 25 1, 50 5 T 100 5"
                        ]
                      }}
                      transition={{ duration: tone.type === 'binaural' ? 0.3 : 1.2, repeat: Infinity, ease: 'linear' }}
                    />
                  </svg>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
