import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { CLASSICAL_PIECES } from '../data';
import { ClassicalPiece } from '../types';
import { Play, Square, Volume2, Info } from 'lucide-react';
import { registerAudioStop, stopAllAudio } from '../lib/stopAllAudio';
import { fadeInGain, fadeOutGain, getAudioContext } from '../lib/audioEngine';
import SoundImmersionOverlay from './SoundImmersionOverlay';

interface ClassicalMusicProps {
  currentTheme: 'day' | 'night';
}

export default function ClassicalMusic({ currentTheme }: ClassicalMusicProps) {
  const [activePiece, setActivePiece] = useState<ClassicalPiece | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [immersionOpen, setImmersionOpen] = useState(false);

  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const gainNodesRef = useRef<GainNode[]>([]);
  const mainGainRef = useRef<GainNode | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const lfoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const commandRef = useRef(0);
  const teardownRef = useRef<Promise<void> | null>(null);

  const nextCommand = useCallback(() => {
    commandRef.current += 1;
    return commandRef.current;
  }, []);

  const teardownAmbient = useCallback(() => {
    if (teardownRef.current) return teardownRef.current;

    const teardown = (async () => {
      try {
        const ctx = ctxRef.current;
        const gain = mainGainRef.current;
        if (ctx && gain) {
          await fadeOutGain(gain, ctx, 0.6);
        }
        if (lfoIntervalRef.current) {
          clearInterval(lfoIntervalRef.current);
          lfoIntervalRef.current = null;
        }
        oscillatorsRef.current.forEach(osc => {
          try {
            osc.stop();
            osc.disconnect();
          } catch {
            /* already stopped */
          }
        });
        oscillatorsRef.current = [];
        gainNodesRef.current.forEach(gainNode => {
          try {
            gainNode.disconnect();
          } catch {
            /* noop */
          }
        });
        gainNodesRef.current = [];
        mainGainRef.current?.disconnect();
        mainGainRef.current = null;
      } finally {
        if (teardownRef.current === teardown) teardownRef.current = null;
      }
    })();

    teardownRef.current = teardown;
    return teardown;
  }, []);

  const stopAmbient = useCallback(async () => {
    nextCommand();
    setIsPlaying(false);
    setImmersionOpen(false);
    await teardownAmbient();
  }, [nextCommand, teardownAmbient]);

  useEffect(() => registerAudioStop(() => void stopAmbient()), [stopAmbient]);

  const startAmbient = useCallback(
    async (piece: ClassicalPiece) => {
      const command = nextCommand();
      setAudioError(null);

      // Resume Web Audio before yielding to fade-out cleanup. Mobile Safari
      // only permits this while the original tap still has user activation.
      const contextPromise = getAudioContext();

      setIsPlaying(false);
      setImmersionOpen(false);
      await teardownAmbient();
      if (command !== commandRef.current) return;
      stopAllAudio({ skipHandlers: true });

      try {
        const ctx = await contextPromise;
        if (command !== commandRef.current) return;
        ctxRef.current = ctx;

        const mainGain = ctx.createGain();
        mainGain.connect(ctx.destination);
        mainGainRef.current = mainGain;
        fadeInGain(mainGain, ctx, volume * 0.4, 2.2);

        const f0 = piece.ambientFrequency;
        let chordRatios = [1.0, 1.2, 1.5, 2.0];
        if (piece.id === 'moonlight_sonata') {
          chordRatios = [1.0, 1.18, 1.5, 2.0];
        } else if (piece.id === 'gymnopedie_1') {
          chordRatios = [1.0, 1.25, 1.5, 1.87];
        } else if (piece.id === 'spiegel_im_spiegel') {
          chordRatios = [1.0, 1.5, 2.0, 3.0];
        }

        chordRatios.forEach((ratio, index) => {
          const osc = ctx.createOscillator();
          osc.type = index % 2 === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(f0 * ratio, ctx.currentTime);
          const oscGain = ctx.createGain();
          const initialVol = (0.2 - index * 0.04) * (index === 0 ? 1.2 : 0.8);
          oscGain.gain.setValueAtTime(initialVol, ctx.currentTime);
          osc.connect(oscGain);
          oscGain.connect(mainGain);
          osc.start();
          oscillatorsRef.current.push(osc);
          gainNodesRef.current.push(oscGain);
        });

        let tick = 0;
        lfoIntervalRef.current = setInterval(() => {
          if (!mainGainRef.current || !ctxRef.current) return;
          tick += 0.5;
          gainNodesRef.current.forEach((gainNode, index) => {
            const phaseOffset = index * 1.5;
            const targetVolume =
              (0.15 - index * 0.03) * (0.6 + 0.4 * Math.sin(tick * 0.2 + phaseOffset));
            gainNode.gain.setTargetAtTime(targetVolume, ctxRef.current!.currentTime, 1.2);
          });
        }, 500);

        setActivePiece(piece);
        setIsPlaying(true);
        setImmersionOpen(true);
      } catch (error) {
        if (command !== commandRef.current) return;
        console.error('Failed to initialize classical ambient generator:', error);
        setAudioError('Ambient audio could not start. Tap Listen again.');
        setIsPlaying(false);
        setImmersionOpen(false);
      }
    },
    [nextCommand, teardownAmbient, volume],
  );

  useEffect(() => {
    if (mainGainRef.current && ctxRef.current && isPlaying) {
      mainGainRef.current.gain.setTargetAtTime(volume * 0.4, ctxRef.current.currentTime, 0.4);
    }
  }, [volume, isPlaying]);

  const handlePlayClick = (piece: ClassicalPiece) => {
    if (activePiece?.id === piece.id && isPlaying) {
      void stopAmbient();
      setActivePiece(null);
    } else {
      void startAmbient(piece);
    }
  };

  useEffect(() => {
    return () => {
      nextCommand();
      void teardownAmbient();
    };
  }, [nextCommand, teardownAmbient]);

  return (
    <>
      <div
        className={`flex flex-col w-full max-w-4xl mx-auto p-6 rounded-2xl border backdrop-blur-md hw-therapy-panel ${
          currentTheme === 'night'
            ? 'bg-[#1e1c18]/90 border-white/[0.06]'
            : 'bg-white/90 border-stone-200/60 shadow-sm shadow-stone-900/5'
        }`}
        id="classical-music-section"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <span className="hw-eyebrow block mb-1">Contemplative music</span>
            <h2 className="font-serif text-2xl text-accent font-medium">Classical Music Immersion</h2>
            <p className="hw-caption mt-1">
              Harmonic atmospheres synthesized in your browser — drift in, breathe out.
            </p>
          </div>

          <div
            className={`flex items-center gap-3 px-4 py-2.5 rounded-full border ${
              currentTheme === 'night'
                ? 'border-white/10 bg-white/[0.03]'
                : 'border-accent/15 bg-accent/[0.04]'
            }`}
          >
            <Volume2 className="w-4 h-4 text-accent/80" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={e => setVolume(parseFloat(e.target.value))}
              className="w-24 h-1 bg-accent/15 rounded-lg appearance-none cursor-pointer accent-accent focus:outline-none"
              id="classical-volume-slider"
            />
            {isPlaying && (
              <button
                type="button"
                id="stop-classical-btn"
                onClick={() => {
                  void stopAmbient();
                  setActivePiece(null);
                }}
                className="ml-2 px-3 py-1 bg-red-500/15 text-red-400 border border-red-500/30 rounded-full hw-badge flex items-center gap-1 hover:bg-red-500/25 transition-all cursor-pointer"
              >
                Stop
              </button>
            )}
          </div>
        </div>

        {audioError && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-4 text-xs text-red-300/90">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <p>{audioError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CLASSICAL_PIECES.map(piece => {
            const isActive = activePiece?.id === piece.id && isPlaying;
            return (
              <div
                key={piece.id}
                className={`p-5 rounded-xl border flex flex-col justify-between relative overflow-hidden transition-all duration-500 ${
                  isActive
                    ? currentTheme === 'night'
                      ? 'bg-[#d4b05a]/10 border-[#e8cc6a] shadow-[0_0_24px_rgba(196,160,68,0.15)]'
                      : 'bg-[#d4b05a]/10 border-[#b8956b] shadow-[0_0_24px_rgba(184,149,107,0.15)]'
                    : currentTheme === 'night'
                      ? 'bg-transparent border-white/[0.08] hover:border-white/15 hover:bg-white/[0.02]'
                      : 'bg-transparent border-stone-200/60 hover:border-accent/25 hover:bg-accent/[0.02]'
                }`}
                id={`classical-piece-${piece.id}`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col text-left">
                      <span className="hw-meta opacity-40">Composer</span>
                      <span
                        className={`font-serif text-sm font-semibold tracking-wide ${currentTheme === 'night' ? 'text-white' : 'text-slate-800'}`}
                      >
                        {piece.composer}
                      </span>
                    </div>
                    <span className="hw-meta px-2.5 py-0.5 rounded-full bg-accent/5 text-accent/80 border border-accent/10">
                      {piece.weatherState}
                    </span>
                  </div>
                  <h3 className="font-serif text-xl font-medium text-accent mb-1">{piece.title}</h3>
                  <p className="hw-caption mb-3">&ldquo;{piece.description}&rdquo;</p>
                  <div
                    className={`p-3 rounded-lg border font-serif text-sm italic mb-4 leading-relaxed ${
                      currentTheme === 'night'
                        ? 'border-[#d4b05a]/15 bg-white/[0.03] text-white/70'
                        : 'border-accent/15 bg-accent/[0.03] text-stone-700'
                    }`}
                  >
                    <span className="font-mono text-[10px] uppercase tracking-widest not-italic opacity-50 block mb-1">
                      Neurological rationale
                    </span>
                    {piece.explanation}
                  </div>
                </div>

                <div className="flex items-center mt-auto border-t border-accent/10 pt-3">
                  <button
                    type="button"
                    id={`play-classical-ambient-btn-${piece.id}`}
                    onClick={() => handlePlayClick(piece)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono tracking-wider transition-all cursor-pointer ${
                      isActive
                        ? currentTheme === 'night'
                          ? 'bg-[#d4b05a] border-[#d4b05a] text-black hover:bg-[#d4b05a]/90 font-medium'
                          : 'bg-gradient-to-r from-[#b8956b] to-[#d4b05a] border-[#d4b05a] text-slate-900 shadow-md shadow-[#d4b05a]/10 font-medium'
                        : currentTheme === 'night'
                          ? 'bg-transparent border-white/10 text-white/50 hover:text-white/85 hover:border-white/20'
                          : 'bg-transparent border-[#d4b05a]/30 text-[#b8956b] hover:text-[#8a6f2e] hover:border-[#d4b05a]/45'
                    }`}
                  >
                    {isActive ? (
                      <>
                        <Square className="w-3 h-3 fill-current" /> Stop ambient
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-current" /> Listen
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <SoundImmersionOverlay
        open={immersionOpen && isPlaying && !!activePiece}
        title={activePiece?.title ?? 'Classical ambient'}
        subtitle={activePiece?.composer}
        detail={activePiece?.description}
        pulseSec={6}
        accentColor="#a89060"
        onClose={() => {
          void stopAmbient();
          setActivePiece(null);
        }}
      />
    </>
  );
}
