import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useFormingOptional } from '../lib/forming/FormingContext';
import { drawSketchMarkToCanvas, parseCoherenceFromSummary, markRenderSeed } from '../lib/forming/sketchMark';
import { resolveSceneAnswer } from '../lib/forming/sketchScenes';
import { formatMarkDateLabel } from '../lib/forming/markDates';
import { localDateKey } from '../lib/dailyMarks';
import { useEntitlement } from '../lib/EntitlementContext';
import PurchaseOffer from './PurchaseOffer';
import type { Memento } from '../lib/forming/types';

type Props = {
  currentTheme: 'day' | 'night';
};

export default function TheFascia({ currentTheme }: Props) {
  const forming = useFormingOptional();
  const { can } = useEntitlement();
  const fasciaEnabled = can('fascia');
  const [open, setOpen] = useState(false);
  const prevCountRef = useRef(0);
  const isNight = currentTheme === 'night';

  const marks = forming?.mementos ?? [];
  const count = marks.length;
  const todayKey = localDateKey();
  const todayMark = marks.find(m => m.date === todayKey) ?? marks[0] ?? null;
  const historyMarks = todayMark ? marks.filter(m => m.id !== todayMark.id) : marks;

  useEffect(() => {
    if (count > prevCountRef.current) {
      setOpen(true);
    }
    prevCountRef.current = count;
  }, [count]);

  useEffect(() => {
    if (forming?.todaySaved) {
      setOpen(true);
    }
  }, [forming?.todaySaved]);

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
      <div
        className={`rounded-xl border p-4 ${
          isNight ? 'border-white/12 bg-white/[0.03]' : 'border-stone-300/70 bg-stone-50/80'
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-start justify-between gap-3 text-left cursor-pointer group"
          aria-expanded={open}
        >
          <div className="min-w-0 flex-1">
            <span className="hw-eyebrow block mb-1">Marked days</span>
            <p className={`font-serif text-lg leading-snug ${isNight ? 'text-white/90' : 'text-[#2c2824]'}`}>
              {count} mark{count === 1 ? '' : 's'} on this device
            </p>
            <p className={`font-sans text-sm mt-1 ${isNight ? 'text-white/55' : 'text-stone-600'}`}>
              Your internal climate, kept as notebook sketches
              {!open && historyMarks.length > 0 ? ' · tap for earlier marks' : ''}
            </p>
          </div>
          <ChevronDown
            className={`w-5 h-5 shrink-0 mt-1 transition-transform opacity-60 group-hover:opacity-90 ${
              open ? 'rotate-180' : ''
            } ${isNight ? 'text-white/70' : 'text-stone-500'}`}
          />
        </button>

        {todayMark && (
          <div className={`mt-4 pt-4 border-t ${isNight ? 'border-white/10' : 'border-stone-300/60'}`}>
            <p
              className={`font-mono text-[10px] uppercase tracking-widest mb-3 ${
                isNight ? 'text-white/35' : 'text-stone-500'
              }`}
            >
              {todayMark.date === todayKey ? 'Today\u2019s mark' : 'Latest mark'}
            </p>
            <MarkTile memento={todayMark} isNight={isNight} highlight />
          </div>
        )}

        {open && historyMarks.length > 0 && (
          <div className={`mt-5 pt-4 border-t ${isNight ? 'border-white/10' : 'border-stone-300/60'}`}>
            <p className={`font-sans text-xs mb-4 ${isNight ? 'text-white/45' : 'text-stone-500'}`}>
              Earlier marks — last {Math.min(30, count)} on this device
            </p>
            <ul className="flex flex-col gap-5 pl-3 border-l border-accent/25" role="list">
              {historyMarks.map(m => (
                <li key={m.id}>
                  <MarkTile memento={m} isNight={isNight} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function MarkTile({
  memento,
  isNight,
  highlight = false,
}: {
  memento: Memento;
  isNight: boolean;
  highlight?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resolved = resolveSceneAnswer(memento.formSeed.weatherId, markRenderSeed(memento.formSeed));
  const coherence = parseCoherenceFromSummary(memento.formSeed.conditionsSummary);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
      drawSketchMarkToCanvas(canvas, memento.formSeed, {
        coalesce: 1,
        coherence,
        breathCycles: 3,
        pathProgress: 1,
      });
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [memento, coherence]);

  const thumbSize = highlight ? { w: 104, h: 130 } : { w: 88, h: 110 };

  return (
    <article className="flex flex-col sm:flex-row gap-3 sm:gap-4">
      <div
        className={`shrink-0 rounded-lg border overflow-hidden shadow-sm ${
          highlight
            ? isNight
              ? 'border-accent/35 ring-1 ring-accent/20'
              : 'border-accent/40 ring-1 ring-accent/15'
            : isNight
              ? 'border-white/12 bg-black/30'
              : 'border-stone-300/90 bg-stone-100/80'
        }`}
        style={{ width: thumbSize.w, height: thumbSize.h }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          width={thumbSize.w}
          height={thumbSize.h}
          aria-hidden
        />
      </div>
      <div className="flex flex-col gap-1 min-w-0">
        <span className={`font-serif text-base ${isNight ? 'text-white/85' : 'text-[#2c2824]'}`}>
          {formatMarkDateLabel(memento.date)}
        </span>
        <span className={`font-sans text-sm ${isNight ? 'text-white/60' : 'text-stone-600'}`}>
          {resolved.caption} · {memento.weatherName} · {coherence}%
        </span>
        <p
          className={`font-serif text-sm italic leading-relaxed mt-1.5 ${
            isNight ? 'text-accent/80' : 'text-[#8a6f2e]'
          }`}
        >
          {resolved.prose}
        </p>
      </div>
    </article>
  );
}
