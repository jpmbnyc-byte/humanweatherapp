import React, { useEffect, useRef } from 'react';
import { useFormingOptional, drawFormToCanvas } from '../lib/forming/FormingContext';
import { useEntitlement } from '../lib/EntitlementContext';
import PurchaseOffer from './PurchaseOffer';

type Props = {
  currentTheme: 'day' | 'night';
};

export default function TheFascia({ currentTheme }: Props) {
  const forming = useFormingOptional();
  const { can } = useEntitlement();
  const fasciaEnabled = can('fascia');

  if (!fasciaEnabled) {
    return (
      <div className="w-full mt-8 pt-6 border-t border-accent/10 flex flex-col gap-4" id="the-fascia">
        <div>
          <span className="hw-eyebrow block mb-1">The Fascia</span>
          <p className={`font-mono text-[11px] ${currentTheme === 'night' ? 'text-white/35' : 'text-stone-500'}`}>
            Full Fascia — your observation log and Il Nascimento mementos — opens with membership.
          </p>
        </div>
        <PurchaseOffer currentTheme={currentTheme} variant="compact" />
      </div>
    );
  }

  if (!forming || forming.mementos.length === 0) {
    return (
      <div className="w-full mt-8 pt-6 border-t border-accent/10" id="the-fascia">
        <span className="hw-eyebrow block mb-1">The Fascia</span>
        <p className={`font-mono text-[11px] ${currentTheme === 'night' ? 'text-white/35' : 'text-stone-500'}`}>
          A quiet sequence. Unfilled days leave no mark.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full mt-8 pt-6 border-t border-accent/10" id="the-fascia">
      <span className="hw-eyebrow block mb-3">The Fascia</span>
      <ul className="flex flex-col gap-4" role="list">
        {forming.mementos.map(m => (
          <li key={m.id} className="flex flex-col gap-1.5">
            <MementoTile memento={m} currentTheme={currentTheme} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function MementoTile({
  memento,
  currentTheme,
}: {
  memento: import('../lib/forming/types').Memento;
  currentTheme: 'day' | 'night';
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawFormToCanvas(canvas, memento.formSeed, 1, 'Hold Out', 0.1);
  }, [memento]);

  return (
    <div
      className={`flex items-center gap-3 p-2 rounded-lg border ${
        currentTheme === 'night' ? 'border-white/8 bg-black/20' : 'border-stone-200/80 bg-white/50'
      }`}
    >
      <div
        className={`shrink-0 rounded border ${
          currentTheme === 'night' ? 'border-white/15' : 'border-stone-300'
        }`}
        style={{ width: 56, height: 56 }}
      >
        <canvas ref={canvasRef} className="w-full h-full" width={56} height={56} aria-hidden />
      </div>
      <span
        className={`font-mono text-[10px] tracking-wide uppercase ${
          currentTheme === 'night' ? 'text-white/45' : 'text-stone-500'
        }`}
      >
        NASCIMENTO/{memento.index} · MEMENTO · {memento.weatherName}
      </span>
    </div>
  );
}
