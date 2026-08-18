import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { FREQUENCY_TONES } from '../data';
import { FrequencyTone } from '../types';
import { Headphones, Volume2, Play, Square, Info } from 'lucide-react';
import { registerAudioStop, stopAllAudio } from '../lib/stopAllAudio';
import { consumePrescriptionFocus } from '../lib/prescriptionFocus';
import { fadeOutGain } from '../lib/audioEngine';
import { createTimedToneMedia, disposeTimedToneMedia, TimedToneMedia } from '../lib/mediaTone';
import SoundImmersionOverlay, { ImmersionSession } from './SoundImmersionOverlay';
import PracticeSessionSetup, { ClassSessionConfig, DEFAULT_CLASS_SESSION, PracticeMode } from './PracticeSessionSetup';

interface FrequencyTherapyProps {
  currentTheme: 'day' | 'night';
}

export default function FrequencyTherapy({ currentTheme }: FrequencyTherapyProps) {
  const [activeTone, setActiveTone] = useState<FrequencyTone | null>(null);
  const [volume, setVolume] = useState(0.4);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [immersionOpen, setImmersionOpen] = useState(false);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('personal');
  const [classConfig, setClassConfig] = useState<ClassSessionConfig>(DEFAULT_CLASS_SESSION);
  const [session, setSession] = useState<ImmersionSession | undefined>();
  const [isPaused, setIsPaused] = useState(false);

  const oscLeftRef = useRef<OscillatorNode | null>(null);
  const oscRightRef = useRef<OscillatorNode | null>(null);
  const pannerLeftRef = useRef<StereoPannerNode | null>(null);
  const pannerRightRef = useRef<StereoPannerNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const commandRef = useRef(0);
  const teardownRef = useRef<Promise<void> | null>(null);
  const mediaRef = useRef<TimedToneMedia | null>(null);

  const nextCommand = useCallback(() => {
    commandRef.current += 1;
    return commandRef.current;
  }, []);

  const teardownAudio = useCallback(() => {
    if (teardownRef.current) return teardownRef.current;

    const teardown = (async () => {
      try {
        disposeTimedToneMedia(mediaRef.current);
        mediaRef.current = null;
        const ctx = ctxRef.current;
        const gain = gainNodeRef.current;
        if (ctx && gain) {
          await fadeOutGain(gain, ctx, 0.5);
        }
        if (oscLeftRef.current) {
          try {
            oscLeftRef.current.stop();
            oscLeftRef.current.disconnect();
          } catch {
            /* already stopped */
          }
          oscLeftRef.current = null;
        }
        if (oscRightRef.current) {
          try {
            oscRightRef.current.stop();
            oscRightRef.current.disconnect();
          } catch {
            /* already stopped */
          }
          oscRightRef.current = null;
        }
        pannerLeftRef.current?.disconnect();
        pannerRightRef.current?.disconnect();
        gainNodeRef.current?.disconnect();
        pannerLeftRef.current = null;
        pannerRightRef.current = null;
        gainNodeRef.current = null;
      } catch (e) {
        console.warn('Audio cleanup exception:', e);
      }
    })().finally(() => {
      if (teardownRef.current === teardown) teardownRef.current = null;
    });

    teardownRef.current = teardown;
    return teardown;
  }, []);

  const stopAudio = useCallback(async () => {
    nextCommand();
    setIsPlaying(false);
    setImmersionOpen(false);
    await teardownAudio();
  }, [nextCommand, teardownAudio]);

  useEffect(() => registerAudioStop(() => void stopAudio()), [stopAudio]);

  const startAudio = useCallback(
    async (tone: FrequencyTone, durationSeconds = 30, keepImmersion = false) => {
      const command = nextCommand();
      setAudioError(null);
      setIsPlaying(false);
      setIsPaused(false);
      if (!keepImmersion) setImmersionOpen(false);

      // HTML media is the audible source on iOS. play() is invoked before any
      // await so Safari associates it directly with this button tap.
      stopAllAudio({ skipHandlers: true });
      disposeTimedToneMedia(mediaRef.current);
      mediaRef.current = null;

      const sessionPlan: ImmersionSession = practiceMode === 'room'
        ? {
            id: Date.now(),
            mode: 'room',
            arrivalSeconds: classConfig.arrivalSeconds,
            practiceSeconds: classConfig.practiceMinutes * 60,
            closingSeconds: classConfig.closingSeconds,
          }
        : {
            id: Date.now(),
            mode: 'personal',
            arrivalSeconds: 0,
            practiceSeconds: durationSeconds,
            closingSeconds: 0,
          };
      const sessionDuration = sessionPlan.arrivalSeconds + sessionPlan.practiceSeconds + sessionPlan.closingSeconds;
      const audioDuration = Math.min(4200, sessionDuration + (sessionPlan.mode === 'room' ? 600 : 0));
      const carrier = 180;
      const media =
        tone.type === 'binaural'
          ? createTimedToneMedia([carrier], [carrier + tone.hz], volume * 0.9, audioDuration)
          : createTimedToneMedia([tone.hz], [tone.hz], volume * 0.9, durationSeconds);
      mediaRef.current = media;
      media.audio.addEventListener('ended', () => {
        if (mediaRef.current !== media) return;
        disposeTimedToneMedia(media);
        mediaRef.current = null;
        setIsPlaying(false);
        setImmersionOpen(true);
      }, { once: true });

      try {
        await media.audio.play();
        if (command !== commandRef.current) {
          disposeTimedToneMedia(media);
          if (mediaRef.current === media) mediaRef.current = null;
          return;
        }
        setActiveTone(tone);
        setSession(sessionPlan);
        setIsPlaying(true);
        setImmersionOpen(true);
      } catch (error) {
        if (mediaRef.current === media) mediaRef.current = null;
        disposeTimedToneMedia(media);
        if (command !== commandRef.current) return;
        console.error('Failed to start frequency media audio:', error);
        setAudioError('Audio could not start. Tap Play again and confirm media sound is allowed.');
        setIsPlaying(false);
        setImmersionOpen(false);
      }
    },
    [nextCommand, volume, practiceMode, classConfig],
  );

  useEffect(() => {
    if (mediaRef.current && isPlaying) {
      mediaRef.current.audio.volume = Math.max(0, Math.min(1, volume));
    }
  }, [volume, isPlaying]);

  const handleToneClick = (tone: FrequencyTone) => {
    if (activeTone?.id === tone.id && isPlaying) {
      void stopAudio();
      setActiveTone(null);
    } else {
      const duration = practiceMode === 'room'
        ? classConfig.arrivalSeconds + classConfig.practiceMinutes * 60 + classConfig.closingSeconds
        : 120;
      void startAudio(tone, duration);
    }
  };

  useEffect(() => {
    const focus = consumePrescriptionFocus();
    if (!focus?.frequencyId) return;
    const tone = FREQUENCY_TONES.find(t => t.id === focus.frequencyId);
    if (!tone) return;
    void startAudio(tone);
    window.requestAnimationFrame(() => {
      document.getElementById(`freq-card-${tone.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [startAudio]);

  useEffect(() => {
    return () => {
      nextCommand();
      void teardownAudio();
    };
  }, [nextCommand, teardownAudio]);

  const handleExitImmersion = () => {
    void stopAudio();
    setActiveTone(null);
  };

  return (
    <>
      <div
        className={`flex flex-col w-full max-w-4xl mx-auto p-6 rounded-2xl border backdrop-blur-md hw-therapy-panel ${
          currentTheme === 'night'
            ? 'bg-[#1e1c18]/90 border-white/[0.06]'
            : 'bg-white/90 border-stone-200/60 shadow-sm shadow-stone-900/5'
        }`}
        id="frequency-therapy-section"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <span className="hw-eyebrow block mb-1">Sound therapy</span>
            <h2 className="font-serif text-2xl text-accent font-medium">Frequency Therapy</h2>
            <p className="hw-caption mt-1">
              Restorative tones synthesized in real time — fade in gently, breathe with the wash.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-black/30 px-4 py-2.5 rounded-full border border-accent/15">
            <Volume2 className="w-4 h-4 text-accent/80" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={e => setVolume(parseFloat(e.target.value))}
              className="w-24 h-1 bg-accent/15 rounded-lg appearance-none cursor-pointer accent-accent focus:outline-none"
              id="freq-volume-slider"
              aria-label="Sound therapy volume"
            />
            {isPlaying && (
              <button
                type="button"
                id="stop-global-freq-btn"
                onClick={() => {
                  void stopAudio();
                  setActiveTone(null);
                }}
                className="ml-2 px-3 py-1 bg-red-500/15 text-red-400 border border-red-500/30 rounded-full hw-badge flex items-center gap-1 hover:bg-red-500/25 transition-all cursor-pointer"
              >
                <Square className="w-2.5 h-2.5 fill-current" /> Stop
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

        <PracticeSessionSetup
          mode={practiceMode}
          onModeChange={setPracticeMode}
          config={classConfig}
          onConfigChange={setClassConfig}
        />

        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-accent/5 border border-accent/10 mb-6 text-xs text-accent/90">
          <Headphones className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="font-serif italic leading-relaxed">
            <strong className="hw-badge not-italic mr-1 text-accent">Note:</strong>
            Binaural beats work best with stereo headphones. Tap any tone to enter immersion — audio starts from your tap.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {FREQUENCY_TONES.map(tone => {
            const isActive = activeTone?.id === tone.id && isPlaying;
            return (
              <motion.button
                type="button"
                key={tone.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative p-5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all duration-500 ${
                  isActive
                    ? currentTheme === 'night'
                      ? 'bg-[#d4b05a]/10 border-[#e8cc6a] shadow-[0_0_24px_rgba(196,160,68,0.18)]'
                      : 'bg-[#d4b05a]/10 border-[#b8956b] shadow-[0_0_24px_rgba(184,149,107,0.18)]'
                    : currentTheme === 'night'
                      ? 'bg-black/35 border-white/[0.06] hover:bg-white/[0.03]'
                      : 'bg-stone-100/40 border-stone-200/50 hover:bg-stone-100/60'
                }`}
                onClick={() => handleToneClick(tone)}
                id={`freq-card-${tone.id}`}
                aria-pressed={isActive}
                aria-label={`${isActive ? 'Stop' : 'Play'} ${tone.name}, ${tone.hz} hertz`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span
                      className={`hw-meta px-2 py-0.5 rounded-full border ${
                        tone.type === 'binaural'
                          ? 'border-accent/30 bg-accent/5 text-accent'
                          : 'border-[#d4b05a]/30 bg-[#d4b05a]/5 text-[#e8cc6a]'
                      }`}
                    >
                      {tone.type}
                    </span>
                    {isActive && (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif text-lg font-medium text-accent leading-tight mb-1">{tone.name}</h3>
                  <h4 className="hw-caption mb-2 leading-snug">{tone.subtitle}</h4>
                  <p className="hw-body-muted">{tone.description}</p>
                </div>

                <div className="mt-4 pt-4 border-t border-accent/10 flex items-center justify-between">
                  <span className="hw-meta opacity-40 uppercase">{tone.hz} Hz</span>
                  <span className="text-accent/80 flex items-center gap-1 text-xs font-mono">
                    {isActive ? (
                      <>
                        <Square className="w-3 h-3 fill-current" /> STOP
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-current" /> PLAY
                      </>
                    )}
                  </span>
                </div>

                {isActive && (
                  <div className="absolute inset-x-0 bottom-0 h-4 flex items-end justify-center gap-[2px] px-4 pb-1.5 opacity-80">
                    {[0.4, 0.95, 0.55, 0.8, 0.35, 0.7, 0.5].map((h, i) => (
                      <motion.span
                        key={i}
                        className="w-[2px] rounded-full bg-accent"
                        animate={{
                          height: [
                            `${Math.round(h * 12)}px`,
                            `${Math.round((1 - h) * 10 + 4)}px`,
                            `${Math.round(h * 12)}px`,
                          ],
                        }}
                        transition={{ duration: 0.45 + i * 0.08, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    ))}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <SoundImmersionOverlay
        open={immersionOpen && !!activeTone}
        title={activeTone?.name ?? 'Frequency'}
        subtitle={activeTone?.subtitle}
        detail={activeTone?.description}
        pulseSec={5}
        accentColor="#c9a96a"
        playing={isPlaying}
        paused={isPaused}
        session={session}
        onPauseToggle={() => {
          const audio = mediaRef.current?.audio;
          if (!audio) return;
          if (isPaused) {
            void audio.play();
          } else {
            audio.pause();
          }
          setIsPaused(value => !value);
        }}
        onSessionComplete={() => {
          disposeTimedToneMedia(mediaRef.current);
          mediaRef.current = null;
          setIsPlaying(false);
          setIsPaused(false);
        }}
        onContinue={seconds => {
          if (activeTone) void startAudio(activeTone, seconds, true);
        }}
        onClose={handleExitImmersion}
      />
    </>
  );
}
