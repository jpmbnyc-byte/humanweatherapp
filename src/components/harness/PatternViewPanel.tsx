import React, { useEffect, useState } from 'react';
import { buildPatternSummary, applyAdaptiveOfficeOffsets, type PatternSummary } from '../../lib/harness/patternView';

type Props = {
  currentTheme: 'day' | 'night';
};

export default function PatternViewPanel({ currentTheme }: Props) {
  const [summary, setSummary] = useState<PatternSummary | null>(null);
  const isNight = currentTheme === 'night';

  useEffect(() => {
    void buildPatternSummary().then(setSummary);
  }, []);

  if (!summary || summary.total === 0) return null;

  return (
    <div
      className={`mt-4 px-4 py-3 rounded-xl border ${
        isNight ? 'border-white/10 bg-black/10' : 'border-stone-200/80 bg-white/40'
      }`}
    >
      <p className="font-mono text-[10px] uppercase tracking-widest text-accent/70 mb-2">
        Pattern view · {summary.total} observations
      </p>
      <ul className="space-y-1">
        {summary.buckets.slice(0, 4).map(b => (
          <li key={b.weatherId} className="font-sans text-xs opacity-70">
            {b.weatherId.replace(/_/g, ' ')} · {b.count}
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="mt-3 font-mono text-[10px] uppercase tracking-wide text-accent/60 hover:text-accent"
        onClick={() => void applyAdaptiveOfficeOffsets().then(() => buildPatternSummary().then(setSummary))}
      >
        Adapt office offsets from pattern
      </button>
    </div>
  );
}
