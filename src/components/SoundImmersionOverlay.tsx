import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pause, Play, Plus, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { PracticeMode } from './PracticeSessionSetup';

export type ImmersionSession = {
  id: number;
  mode: PracticeMode;
  arrivalSeconds: number;
  practiceSeconds: number;
  closingSeconds: number;
};

type Props = {
  open: boolean;
  title: string;
  subtitle?: string;
  detail?: string;
  pulseSec?: number;
  accentColor?: string;
  playing?: boolean;
  paused?: boolean;
  session?: ImmersionSession;
  onPauseToggle?: () => void;
  onSessionComplete?: () => void;
  onContinue?: (seconds: number) => void;
  onClose: () => void;
};

const PERSONAL_OPTIONS = [
  { label: '1 min', seconds: 60 },
  { label: '2 min', seconds: 120 },
  { label: '5 min', seconds: 300 },
  { label: '10 min', seconds: 600 },
  { label: '15 min', seconds: 900 },
  { label: '20 min', seconds: 1200 },
];

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
};

export default function SoundImmersionOverlay({
  open,
  title,
  subtitle,
  detail,
  pulseSec = 5,
  accentColor = '#c9a96a',
  playing = true,
  paused = false,
  session,
  onPauseToggle,
  onSessionComplete,
  onContinue,
  onClose,
}: Props) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const onCompleteRef = useRef(onSessionComplete);
  const [remaining, setRemaining] = useState(0);
  const [addedSeconds, setAddedSeconds] = useState(0);
  const [complete, setComplete] = useState(false);
  onCloseRef.current = onClose;
  onCompleteRef.current = onSessionComplete;

  const baseTotal = session
    ? session.arrivalSeconds + session.practiceSeconds + session.closingSeconds
    : 0;
  const total = baseTotal + addedSeconds;
  const elapsed = Math.max(0, total - remaining);

  let phase = session?.mode === 'room' ? 'Practice' : 'Your practice';
  let phaseRemaining = remaining;
  if (session?.mode === 'room') {
    if (elapsed < session.arrivalSeconds) {
      phase = 'Arrival';
      phaseRemaining = session.arrivalSeconds - elapsed;
    } else if (elapsed < session.arrivalSeconds + session.practiceSeconds + addedSeconds) {
      phase = 'Practice';
      phaseRemaining = session.arrivalSeconds + session.practiceSeconds + addedSeconds - elapsed;
    } else {
      phase = 'Closing';
      phaseRemaining = remaining;
    }
  }

  useEffect(() => {
    if (!open || !session) return;
    const duration = session.arrivalSeconds + session.practiceSeconds + session.closingSeconds;
    setRemaining(duration);
    setAddedSeconds(0);
    setComplete(false);
  }, [open, session?.id]);

  useEffect(() => {
    if (!open || !session || !playing || paused || complete) return;
    const timer = window.setInterval(() => {
      setRemaining(value => {
        if (value > 1) return value - 1;
        window.clearInterval(timer);
        setComplete(true);
        onCompleteRef.current?.();
        return 0;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [open, session?.id, playing, paused, complete]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const addTime = (seconds: number) => {
    setAddedSeconds(value => {
      const next = Math.min(600, value + seconds);
      const delta = next - value;
      if (delta > 0) setRemaining(current => current + delta);
      return next;
    });
  };

  const overlay = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="fixed inset-0 z-[60] flex flex-col overflow-hidden select-none"
          style={{
            position: 'fixed',
            inset: 0,
            width: '100vw',
            height: '100dvh',
            minHeight: '-webkit-fill-available',
            zIndex: 2147483647,
            color: '#ffffff',
            background: '#0a0908',
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
          id="sound-immersion-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} immersion`}
        >
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{ opacity: [0.35, 0.65, 0.35], scale: [1, 1.06, 1] }}
            transition={{ duration: pulseSec, repeat: Infinity, ease: 'easeInOut' }}
            style={{ background: `radial-gradient(circle at 50% 42%, ${accentColor}33 0%, transparent 62%)` }}
          />
          <div className="hw-ambient-particles absolute inset-0 pointer-events-none opacity-40" aria-hidden />

          <div className="relative z-10 flex items-center justify-between px-6 pt-6 max-w-5xl mx-auto w-full">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
                {session?.mode === 'room' ? 'Guiding a room' : 'For myself'} · immersion
              </span>
              <h2 className="font-serif text-xl md:text-2xl text-white/95 mt-1">{title}</h2>
              {subtitle ? <p className="font-serif text-sm italic text-white/55 mt-1">{subtitle}</p> : null}
            </div>
            <button
              type="button"
              ref={closeButtonRef}
              onClick={onClose}
              className="w-11 h-11 rounded-full border border-white/15 bg-white/5 text-white/80 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
              aria-label={session?.mode === 'room' ? 'End class' : 'Exit immersion'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
            <motion.div
              animate={{ scale: paused || complete ? 1 : [1, 1.75, 1] }}
              transition={{ duration: pulseSec, repeat: paused || complete ? 0 : Infinity, ease: 'easeInOut' }}
              className="relative w-40 h-40 md:w-52 md:h-52 rounded-full border border-white/20 flex flex-col items-center justify-center mb-8"
              style={{ boxShadow: `0 0 80px ${accentColor}22`, background: 'rgba(255,255,255,0.03)' }}
            >
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/45">{complete ? 'Complete' : phase}</span>
              <span className="font-serif text-3xl md:text-4xl text-white/90 tabular-nums mt-1">
                {complete ? '—' : formatTime(phaseRemaining)}
              </span>
              {!complete ? (
                <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/35 mt-2">
                  {paused ? 'Paused' : 'Breathe naturally'}
                </span>
              ) : null}
            </motion.div>

            <AnimatePresence mode="wait">
              {complete ? (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center text-center max-w-lg"
                >
                  <h3 className="font-serif text-xl text-white/90">
                    {session?.mode === 'room' ? 'The room can remain here.' : 'Stay a little longer?'}
                  </h3>
                  <p className="font-serif text-sm italic text-white/50 mt-2 mb-5">
                    {session?.mode === 'room'
                      ? 'The closing field remains until you choose to end.'
                      : 'Choose only what feels supportive.'}
                  </p>
                  {session?.mode === 'personal' && onContinue ? (
                    <div className="flex flex-wrap justify-center gap-2">
                      {PERSONAL_OPTIONS.map(option => (
                        <motion.button
                          key={option.seconds}
                          type="button"
                          whileTap={{ scale: 0.96 }}
                          onClick={() => onContinue(option.seconds)}
                          className="px-4 py-2.5 rounded-full border border-white/20 bg-white/[0.06] text-white/85 font-mono text-[10px] uppercase tracking-[0.12em] cursor-pointer"
                        >
                          {option.label}
                        </motion.button>
                      ))}
                    </div>
                  ) : null}
                </motion.div>
              ) : (
                <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
                  {detail ? (
                    <p className="font-serif text-sm md:text-base text-white/60 text-center max-w-md leading-relaxed italic mb-5">
                      {detail}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap justify-center gap-2">
                    {onPauseToggle ? (
                      <button
                        type="button"
                        onClick={onPauseToggle}
                        className="min-h-11 px-4 rounded-full border border-white/15 bg-white/5 text-white/75 flex items-center gap-2 text-xs cursor-pointer"
                      >
                        {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                        {paused ? 'Resume' : 'Pause'}
                      </button>
                    ) : null}
                    {session?.mode === 'room' ? (
                      <>
                        <button type="button" onClick={() => addTime(300)} className="min-h-11 px-4 rounded-full border border-white/15 bg-white/5 text-white/75 flex items-center gap-1.5 text-xs cursor-pointer">
                          <Plus className="w-4 h-4" /> 5 min
                        </button>
                        <button type="button" onClick={() => addTime(600)} className="min-h-11 px-4 rounded-full border border-white/15 bg-white/5 text-white/75 flex items-center gap-1.5 text-xs cursor-pointer">
                          <Plus className="w-4 h-4" /> 10 min
                        </button>
                      </>
                    ) : null}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative z-10 px-6 pb-6 text-center font-mono text-[9px] uppercase tracking-[0.14em] text-white/30">
            {complete ? 'Close when ready' : `${formatTime(remaining)} total remaining`}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(overlay, document.body);
}
