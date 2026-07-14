import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useFormingOptional } from '../lib/forming/FormingContext';
import { drawSketchMarkToCanvas, parseCoherenceFromSummary } from '../lib/forming/sketchMark';
import { FORMING_CYCLE_COUNT } from '../lib/forming/types';

type Props = {
  currentTheme: 'day' | 'night';
};

export default function FormingCaptureOverlay({ currentTheme }: Props) {
  const forming = useFormingOptional();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const active = Boolean(
    forming &&
      (forming.mounting ||
        forming.stillness ||
        forming.stage === 'capturing' ||
        forming.warmthBloom > 0),
  );

  const seed = forming?.displaySeed ?? forming?.formSeed ?? null;
  const showFrame = forming?.showFrame ?? false;
  const coalesce = forming?.coalesce ?? 1;

  useEffect(() => {
    if (!active || !seed || !showFrame) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let raf = 0;
    const tick = () => {
      drawSketchMarkToCanvas(canvas, seed, {
        coalesce,
        coherence: parseCoherenceFromSummary(seed.conditionsSummary),
        breathCycles: FORMING_CYCLE_COUNT,
        pathProgress: 1,
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, seed, showFrame, coalesce]);

  if (!forming) return null;

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none"
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
            {showFrame && seed && (
              <div
                className={`relative overflow-hidden rounded-sm border shadow-2xl ${
                  currentTheme === 'night' ? 'border-white/25' : 'border-stone-400/80'
                }`}
                style={{
                  width: 160,
                  height: 200,
                  boxShadow: forming.mounting ? '0 12px 40px rgba(0,0,0,0.35)' : '0 8px 24px rgba(0,0,0,0.2)',
                  transform: forming.mounting ? 'scale(0.35) translateY(120px)' : 'scale(1)',
                  transition: forming.reduceMotion ? 'transform 0.8s ease' : 'transform 2s ease',
                  opacity: forming.stillness ? 0 : 1,
                }}
              >
                <canvas ref={canvasRef} className="w-full h-full block" width={160} height={200} />
              </div>
            )}
          </motion.div>
          {forming.caption && forming.mounting && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.75 }}
              className={`absolute bottom-1/3 font-sans text-sm text-center px-6 ${
                currentTheme === 'night' ? 'text-white/70' : 'text-stone-700'
              }`}
            >
              {forming.caption}
            </motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
