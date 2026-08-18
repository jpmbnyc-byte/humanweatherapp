import React, { useCallback, useEffect, useState } from 'react';
import {
  READING_QUESTION,
  READING_BUDGET_MS,
  advanceReadingStep,
  createReadingFlowState,
  readingConditionsLines,
  readingWithinBudget,
  completeReadingFlow,
  type ReadingFlowState,
} from '../../lib/harness/readingFlow';
import { emitChannelSignal } from '../../lib/harness/channels';
import type { WeatherState } from '../../types';

type Props = {
  activeWeather: WeatherState;
  currentTheme: 'day' | 'night';
  onComplete?: () => void;
};

export default function ReadingFlowPanel({ activeWeather, currentTheme, onComplete }: Props) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ReadingFlowState>(() => createReadingFlowState());
  const isNight = currentTheme === 'night';

  useEffect(() => {
    if (!open) return;
    setState(createReadingFlowState());
  }, [open]);

  const advance = useCallback(async () => {
    setState(prev => {
      const withWeather = { ...prev, weatherId: prev.weatherId ?? activeWeather.id };
      const next = advanceReadingStep(withWeather);
      if (next.complete && withWeather.weatherId) {
        void completeReadingFlow(withWeather.weatherId);
        void emitChannelSignal({ kind: 'settle' });
        onComplete?.();
      } else if (!next.complete) {
        void emitChannelSignal({ kind: 'pulse' });
      }
      return next;
    });
  }, [activeWeather.id, onComplete]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`mb-4 w-full text-left px-4 py-3 rounded-xl border font-serif text-sm ${
          isNight ? 'border-white/10 text-white/70 hover:bg-white/5' : 'border-stone-200 text-stone-600 hover:bg-stone-50'
        }`}
      >
        Open the three-step reading
      </button>
    );
  }

  const lines = readingConditionsLines(activeWeather.id);
  const elapsed = Date.now() - state.startedAt;
  const withinBudget = readingWithinBudget(state);

  return (
    <div
      className={`mb-6 rounded-xl border p-5 ${
        isNight ? 'border-accent/20 bg-black/20' : 'border-accent/25 bg-white/60'
      }`}
      id="reading-flow"
    >
      <div className="flex justify-between items-start gap-4 mb-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent/70">
          The Reading · three steps · under twenty seconds
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="font-mono text-[10px] uppercase tracking-wide opacity-50 hover:opacity-100"
        >
          Close
        </button>
      </div>

      {state.step === 'question' && (
        <div>
          <h2 className="font-serif text-2xl md:text-3xl text-accent mb-4">{READING_QUESTION}</h2>
          <button type="button" onClick={advance} className="hw-btn-ghost">
            Enter the field
          </button>
        </div>
      )}

      {state.step === 'touch' && (
        <div>
          <p className="font-serif text-lg text-accent/90 mb-2">Touch the grid once.</p>
          <p className="font-sans text-sm opacity-60 mb-4">Mark sensation on the somatic field at left.</p>
          <button type="button" onClick={advance} className="hw-btn-ghost">
            Conditions ready
          </button>
        </div>
      )}

      {state.step === 'conditions' && !state.complete && (
        <div className="space-y-3 max-w-measure">
          <p className="font-mono text-[11px] uppercase tracking-wide text-accent/80">
            Current Conditions
          </p>
          <p className="font-serif text-base">{lines.felt}</p>
          <p className="font-serif text-base opacity-80">{lines.fact}</p>
          <p className="font-serif text-base opacity-80">{lines.faith}</p>
          <button type="button" onClick={advance} className="hw-btn-ghost mt-2">
            Release
          </button>
        </div>
      )}

      {state.complete && (
        <p className="font-serif text-accent/80">Observation filed. The field is open.</p>
      )}

      <p className="font-mono text-[9px] uppercase tracking-wide mt-4 opacity-40">
        {withinBudget ? `${Math.round((READING_BUDGET_MS - elapsed) / 1000)}s remaining` : 'Take your time'}
      </p>
    </div>
  );
}
