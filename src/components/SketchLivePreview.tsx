import React, { useEffect, useRef } from 'react';
import { useFormingOptional } from '../lib/forming/FormingContext';
import { drawSketchMarkToCanvas, parseCoherenceFromSummary } from '../lib/forming/sketchMark';
import { getFormingStatusMessage } from '../lib/forming/formingStatus';
import { FORMING_CYCLE_COUNT } from '../lib/forming/types';
import { ArrowRight } from 'lucide-react';

type Props = {
  currentTheme: 'day' | 'night';
  onContinueToBreath?: () => void;
};

/** Live notebook page — pencil follows grid input in real time. */
export default function SketchLivePreview({ currentTheme, onContinueToBreath }: Props) {
  const forming = useFormingOptional();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const activeStage =
    forming &&
    !forming.todaySaved &&
    forming.displaySeed &&
    forming.dust.count > 0 &&
    ['gathering', 'breathing', 'capturing', 'mounting', 'stillness', 'complete'].includes(forming.stage);

  const statusMessage = forming
    ? getFormingStatusMessage(forming.stage, {
        hasTouch: forming.dust.count > 0,
        todaySaved: forming.todaySaved,
      })
    : '';

  useEffect(() => {
    if (!activeStage || !forming?.displaySeed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
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

      const previewCoalesce =
        forming.stage === 'gathering' ? Math.max(0.42, forming.coalesce) : forming.coalesce;

      drawSketchMarkToCanvas(canvas, seed, {
        coalesce: previewCoalesce,
        coherence: parseCoherenceFromSummary(seed.conditionsSummary),
        breathCycles: Math.min(FORMING_CYCLE_COUNT, breathCycles),
        pathProgress,
        detailBoost: forming.stage === 'gathering' ? 3 : 1.25,
      });
    };

    draw();
    if (typeof ResizeObserver === 'undefined') return;
    const resizeObserver = new ResizeObserver(draw);
    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, [
    activeStage,
    forming?.displaySeed,
    forming?.coalesce,
    forming?.stage,
    forming?.cycleIndex,
    forming?.breathPhase,
    forming?.dust.count,
  ]);

  if (!activeStage && !statusMessage) return null;

  const isNight = currentTheme === 'night';

  return (
    <div className="w-full mt-4" id="sketch-live-preview">
      <p
        className={`font-mono text-[10px] uppercase tracking-widest mb-1.5 ${
          isNight ? 'text-white/35' : 'text-stone-500'
        }`}
      >
        Daymark
      </p>
      {statusMessage && (
        <p
          className={`font-sans text-sm mb-2.5 min-h-[1.25rem] ${
            isNight ? 'text-white/70' : 'text-stone-700'
          }`}
          aria-live="polite"
        >
          {statusMessage}
        </p>
      )}
      {forming?.canForm && forming.stage === 'gathering' && onContinueToBreath && (
        <button
          type="button"
          onClick={onContinueToBreath}
          className={`hw-pressable mb-3 inline-flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left font-sans text-sm font-medium transition-colors ${
            isNight
              ? 'border-accent/35 bg-accent/10 text-accent'
              : 'border-accent/40 bg-accent/[0.08] text-[#6f5727]'
          }`}
        >
          <span>
            Touch recorded. Continue with three breaths to form your Daymark.
          </span>
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
        </button>
      )}
      {activeStage && (
        <div
          className={`w-full rounded-xl border overflow-hidden shadow-sm ${
            isNight ? 'border-white/10 bg-black/20' : 'border-stone-300/80 bg-stone-100/50'
          }`}
          style={{ aspectRatio: '4 / 5', maxHeight: 220 }}
        >
          <canvas ref={canvasRef} className="w-full h-full block" aria-label="Live Daymark forming from your body map" />
        </div>
      )}
    </div>
  );
}
