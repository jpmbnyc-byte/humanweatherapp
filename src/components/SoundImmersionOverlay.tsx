import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

type Props = {
  open: boolean;
  title: string;
  subtitle?: string;
  detail?: string;
  pulseSec?: number;
  accentColor?: string;
  onClose: () => void;
};

export default function SoundImmersionOverlay({
  open,
  title,
  subtitle,
  detail,
  pulseSec = 5,
  accentColor = '#c9a96a',
  onClose,
}: Props) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="fixed inset-0 z-[60] flex flex-col overflow-hidden select-none"
          style={{ background: '#0a0908' }}
          id="sound-immersion-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} immersion`}
        >
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{ opacity: [0.35, 0.65, 0.35], scale: [1, 1.06, 1] }}
            transition={{ duration: pulseSec, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              background: `radial-gradient(circle at 50% 42%, ${accentColor}33 0%, transparent 62%)`,
            }}
          />

          <div className="hw-ambient-particles absolute inset-0 pointer-events-none opacity-40" aria-hidden />

          <div className="relative z-10 flex items-center justify-between px-6 pt-6 max-w-5xl mx-auto w-full">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
                Aura &amp; Tones · immersion
              </span>
              <h2 className="font-serif text-xl md:text-2xl text-white/95 mt-1">{title}</h2>
              {subtitle && (
                <p className="font-serif text-sm italic text-white/55 mt-1">{subtitle}</p>
              )}
            </div>
            <button
              type="button"
              ref={closeButtonRef}
              onClick={onClose}
              className="w-11 h-11 rounded-full border border-white/15 bg-white/5 text-white/80 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Exit immersion"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
            <motion.div
              animate={{ scale: [1, 1.75, 1] }}
              transition={{ duration: pulseSec, repeat: Infinity, ease: 'easeInOut' }}
              className="relative w-28 h-28 md:w-36 md:h-36 rounded-full border border-white/20 flex items-center justify-center mb-10"
              style={{
                boxShadow: `0 0 80px ${accentColor}22`,
                background: 'rgba(255,255,255,0.03)',
              }}
            >
              <motion.div
                animate={{ scale: [1, 2.2, 1], opacity: [0.35, 0, 0.35] }}
                transition={{ duration: pulseSec, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full border border-white/10"
              />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/70">
                Breathe
              </span>
            </motion.div>

            <div className="flex items-end justify-center gap-[3px] h-8 mb-8 opacity-70">
              {[0.35, 0.7, 0.5, 0.9, 0.45, 0.75, 0.55, 0.65].map((h, i) => (
                <motion.span
                  key={i}
                  className="w-[3px] rounded-full"
                  style={{ backgroundColor: accentColor }}
                  animate={{
                    height: [`${Math.round(h * 28)}px`, `${Math.round((1 - h) * 18 + 6)}px`, `${Math.round(h * 28)}px`],
                  }}
                  transition={{ duration: 0.5 + i * 0.07, repeat: Infinity, ease: 'easeInOut' }}
                />
              ))}
            </div>

            {detail && (
              <p className="font-serif text-sm md:text-base text-white/60 text-center max-w-md leading-relaxed italic">
                {detail}
              </p>
            )}
          </div>

          <div className="relative z-10 px-6 pb-6 text-center font-mono text-[9px] uppercase tracking-[0.14em] text-white/30">
            Let the tone arrive — no effort required
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
