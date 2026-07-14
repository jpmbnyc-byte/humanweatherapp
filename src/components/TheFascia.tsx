import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useFormingOptional } from '../lib/forming/FormingContext';
import { drawSketchMarkToCanvas, parseCoherenceFromSummary } from '../lib/forming/sketchMark';
import { formatMarkDateLabel } from '../lib/forming/markDates';
import { getConditionCopy } from '../data/conditions';
import { useEntitlement } from '../lib/EntitlementContext';
import PurchaseOffer from './PurchaseOffer';

type Props = {
  currentTheme: 'day' | 'night';
};

export default function TheFascia({ currentTheme }: Props) {
  const forming = useFormingOptional();
  const { can } = useEntitlement();
  const fasciaEnabled = can('fascia');
  const [open, setOpen] = useState(false);
  const isNight = currentTheme === 'night';

  if (!fasciaEnabled) {
    return (
      <div className="w-full mt-8 pt-6 border-t border-accent/10 flex flex-col gap-4" id="marked-days">
        <div>
          <span className="hw-eyebrow block mb-1">Marked days</span>
          <p className={`font-sans text-sm ${isNight ? 'text-white/50' : 'text-stone-600'}`}>
            Daily internal climate marks open with membership.
          </p>
        </div>
        <PurchaseOffer currentTheme={currentTheme} variant="compact" />
      </div>
    );
  }

  const marks = forming?.mementos ?? [];
  const count = marks.length;

  if (!forming || count === 0) {
    return (
      <div className="w-full mt-8 pt-6 border-t border-accent/10" id="marked-days">
        <span className="hw-eyebrow block mb-1">Marked days</span>
        <p className={`font-sans text-sm italic ${isNight ? 'text-white/45' : 'text-stone-500'}`}>
          Unmarked days leave no trace.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full mt-8 pt-6 border-t border-accent/10" id="marked-days">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start justify-between gap-3 text-left cursor-pointer group"
        aria-expanded={open}
      >
        <div>
          <span className="hw-eyebrow block mb-1">Marked days</span>
          <p className={`font-sans text-sm ${isNight ? 'text-white/55' : 'text-stone-600'}`}>
            {count} mark{count === 1 ? '' : 's'} kept on this device
            {!open && count > 0 ? ' · tap to open' : ''}
          </p>
          {open && (
            <p className={`font-sans text-xs mt-1 ${isNight ? 'text-white/40' : 'text-stone-500'}`}>
              Daily internal climate — last {Math.min(30, count)} shown
            </p>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 shrink-0 mt-1 transition-transform opacity-50 group-hover:opacity-80 ${
            open ? 'rotate-180' : ''
          } ${isNight ? 'text-white/60' : 'text-stone-500'}`}
        />
      </button>

      {open && (
        <ul className="flex flex-col gap-5 mt-5 pl-3 border-l border-accent/25" role="list">
          {marks.map(m => (
            <li key={m.id}>
              <MarkTile memento={m} isNight={isNight} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MarkTile({
  memento,
  isNight,
}: {
  memento: import('../lib/forming/types').Memento;
  isNight: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faith =
    getConditionCopy(memento.formSeed.weatherId)?.faith ??
    'Stillness is not absence. It is the threshold before the first true mark.';
  const coherence = parseCoherenceFromSummary(memento.formSeed.conditionsSummary);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawSketchMarkToCanvas(canvas, memento.formSeed, {
      coalesce: 1,
      coherence,
      breathCycles: 3,
      pathProgress: 1,
    });
  }, [memento, coherence]);

  return (
    <article className="flex flex-col sm:flex-row gap-3 sm:gap-4">
      <div
        className={`shrink-0 rounded-lg border overflow-hidden shadow-sm ${
          isNight ? 'border-white/12 bg-black/30' : 'border-stone-300/90 bg-stone-100/80'
        }`}
        style={{ width: 88, height: 110 }}
      >
        <canvas ref={canvasRef} className="w-full h-full block" width={88} height={110} aria-hidden />
      </div>
      <div className="flex flex-col gap-1 min-w-0">
        <span className={`font-serif text-base ${isNight ? 'text-white/85' : 'text-[#2c2824]'}`}>
          {formatMarkDateLabel(memento.date)}
        </span>
        <span className={`font-sans text-sm ${isNight ? 'text-white/60' : 'text-stone-600'}`}>
          {memento.weatherName} · {coherence}% coherence
        </span>
        <p className={`font-serif text-sm italic leading-relaxed mt-1 ${isNight ? 'text-white/55' : 'text-stone-600'}`}>
          {faith}
        </p>
      </div>
    </article>
  );
}
