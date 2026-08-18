import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { CLASSICAL_PIECES } from '../data';
import { ClassicalPiece } from '../types';
import { Play, Square, Volume2, Info } from 'lucide-react';
import { registerAudioStop, stopAllAudio } from '../lib/stopAllAudio';
import { fadeOutGain } from '../lib/audioEngine';
import { createTimedToneMedia, disposeTimedToneMedia, TimedToneMedia } from '../lib/mediaTone';
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
  const mediaRef = useRef<TimedToneMedia | null>(null);

  const nextCommand = useCallback(() => {
    commandRef.current += 1;
    return commandRef.current;
  }, []);

  const teardownAmbient = useCallback(() => {
    if (teardownRef.current) return teardownRef.current;

    const teardown = (async () => {
      try {
        disposeTimedToneMedia(mediaRef.current);
        mediaRef.current = null;
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
      } catch (error) {
        console.warn('Ambient audio cleanup exception:', error);
      }
    })().finally(() => {
      if (teardownRef.current === teardown) teardownRef.current = null;
    });

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
    async (piece: ClassicalPiece, durationSeconds = 30, keepImmersion = false) => {
      const command = nextCommand();
      setAudioError(null);
      setIsPlaying(false);
      if (!keepImmersion) setImmersionOpen(false);

      stopAllAudio({ skipHandlers: true });
      disposeTimedToneMedia(mediaRef.current);
      mediaRef.current = null;

      const f0 = piece.ambientFrequency;
      let chordRatios = [1.0, 1.2, 1.5, 2.0];
      if (piece.id === 'moonlight_sonata') {
        chordRatios = [1.0, 1.18, 1.5, 2.0];
      } else if (piece.id === 'gymnopedie_1') {
        chordRatios = [1.0, 1.25, 1.5, 1.87];
      } else if (piece.id === 'spiegel_im_spiegel') {
        chordRatios = [1.0, 1.5, 2.0, 3.0];
      }

      const frequencies = chordRatios.map(ratio => f0 * ratio);
      const media = createTimedToneMedia(frequencies, frequencies, volume * 0.85, durationSeconds);
      mediaRef.current = media;
      media.audio.addEventListener('ended', () => {
        if (mediaRef.current !== media) return;
        disposeTimedToneMedia(media);
        mediaRef.current = null;
        setIsPlaying(false);
        setImmersionOpen(true);
      }, { once: true });

      try {
        // Keep play() in the original gesture task for Safari and installed PWAs.
        await media.audio.play();
        if (command !== commandRef.current) {
          disposeTimedToneMedia(media);
          if (mediaRef.current === media) mediaRef.current = null;
          return;
        }
        setActivePiece(piece);
        setIsPlaying(true);
        setImmersionOpen(true);
      } catch (error) {
        if (mediaRef.current === media) mediaRef.current = null;
        disposeTimedToneMedia(media);
        if (command !== commandRef.current) return;
        console.error('Failed to start classical media audio:', error);
        setAudioError('Ambient audio could not start. Tap Listen again and confirm media sound is allowed.');
        setIsPlaying(false);
        setImmersionOpen(false);
      }
    },
    [nextCommand, volume],
  );

  useEffect(() => {
    if (mediaRef.current && isPlaying) {
      mediaRef.current.audio.volume = Math.max(0, Math.min(1, volume));
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
        open={immersionOpen && !!activePiece}
        title={activePiece?.title ?? 'Classical ambient'}
        subtitle={activePiece?.composer}
        detail={activePiece?.description}
        pulseSec={6}
        accentColor="#a89060"
        playing={isPlaying}
        onContinue={seconds => {
          if (activePiece) void startAmbient(activePiece, seconds, true);
        }}
        onClose={() => {
          void stopAmbient();
          setActivePiece(null);
        }}
      />
    </>
  );
}
