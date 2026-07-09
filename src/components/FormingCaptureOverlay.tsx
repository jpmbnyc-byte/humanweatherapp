import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useFormingOptional } from '../lib/forming/FormingContext';

type Props = {
  currentTheme: 'day' | 'night';
};

export default function FormingCaptureOverlay({ currentTheme }: Props) {
  const forming = useFormingOptional();
  if (!forming) return null;

  const active =
    forming.mounting ||
    forming.stillness ||
    forming.stage === 'capturing' ||
    forming.warmthBloom > 0;

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          aria-hidden
        >
          <motion.div
            animate={{ scale: forming.scalePunch }}
            transition={{ duration: forming.reduceMotion ? 0.05 : 0.14, ease: 'easeOut' }}
            className="relative"
          >
            {forming.warmthBloom > 0 && !forming.reduceMotion && (
              <div
                className="absolute inset-0 rounded-full blur-2xl"
                style={{
                  background: 'rgba(196, 160, 68, 0.35)',
                  animation: 'pulse 90ms ease-out 1',
                }}
              />
            )}
            {forming.showFrame && forming.displaySeed && (
              <div
                className={`relative w-32 h-40 border ${
                  currentTheme === 'night' ? 'border-white/30' : 'border-stone-400'
                }`}
                style={{
                  boxShadow: forming.mounting ? '0 8px 32px rgba(0,0,0,0.25)' : 'none',
                  transform: forming.mounting ? 'scale(0.35) translateY(120px)' : 'scale(1)',
                  transition: forming.reduceMotion ? 'transform 0.8s ease' : 'transform 2s ease',
                  opacity: forming.stillness ? 0 : 1,
                }}
              />
            )}
          </motion.div>
          {forming.caption && forming.mounting && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              className="absolute bottom-1/3 font-mono text-[11px] tracking-wide uppercase text-center px-6"
              style={{ color: currentTheme === 'night' ? 'rgba(255,255,255,0.5)' : 'rgba(44,40,36,0.55)' }}
            >
              {forming.caption}
            </motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
