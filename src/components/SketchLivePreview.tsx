import React, { useEffect, useRef } from 'react';
import { useFormingOptional } from '../lib/forming/FormingContext';
import { drawSketchMarkToCanvas, parseCoherenceFromSummary } from '../lib/forming/sketchMark';
import { FORMING_CYCLE_COUNT } from '../lib/forming/types';

type Props = {
  currentTheme: 'day' | 'night';
};

/** Live notebook page — pencil follows grid input in real time. */
export default function SketchLivePreview({ currentTheme }: Props) {
  const forming = useFormingOptional();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const visible =
    forming &&
    !forming.todaySaved &&
    forming.displaySeed &&
    forming.dust.count > 0 &&
    ['gathering', 'breathing', 'capturing', 'complete'].includes(forming.stage);

  useEffect(() => {
    if (!visible || !forming?.displaySeed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let raf = 0;
    const tick = () => {
      const seed = forming.displaySeed!;
      const sortedLen = seed.gesturePoints.length;
      const pathProgress =
        forming.stage === 'gathering'
          ? Math.min(1, sortedLen / 18)
          : Math.min(1, 0.35 + forming.coalesce * 0.65);
      const breathCycles =
        forming.coalesce >= 1
          ? FORMING_CYCLE_COUNT
          : forming.stage === 'breathing'
            ? forming.cycleIndex + (forming.breathPhase === 'Exhale' ? 1 : 0)
            : 0;

      drawSketchMarkToCanvas(canvas, seed, {
        coalesce: forming.coalesce,
        coherence: parseCoherenceFromSummary(seed.conditionsSummary),
        breathCycles: Math.min(FORMING_CYCLE_COUNT, breathCycles),
        pathProgress,
      });
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [
    visible,
    forming?.displaySeed,
    forming?.coalesce,
    forming?.stage,
    forming?.cycleIndex,
    forming?.breathPhase,
    forming?.dust.count,
  ]);

  if (!visible) return null;

  const isNight = currentTheme === 'night';

  return (
    <div className="w-full mt-4" id="sketch-live-preview">
      <p
        className={`font-mono text-[10px] uppercase tracking-widest mb-2 ${
          isNight ? 'text-white/35' : 'text-stone-500'
        }`}
      >
        Field sketch · the field answers your climate
      </p>
      <div
        className={`w-full rounded-xl border overflow-hidden shadow-sm ${
          isNight ? 'border-white/10 bg-black/20' : 'border-stone-300/80 bg-stone-100/50'
        }`}
        style={{ aspectRatio: '4 / 5', maxHeight: 220 }}
      >
        <canvas ref={canvasRef} className="w-full h-full block" aria-label="Live field sketch from grid input" />
      </div>
    </div>
  );
}
