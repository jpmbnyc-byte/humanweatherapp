import React, { useEffect, useState } from 'react';
import {
  companionStatus,
  getCompanionPrefs,
  setCompanionPrefs,
} from '../../lib/harness/companion';

type Props = {
  currentTheme: 'day' | 'night';
};

export default function CompanionPanel({ currentTheme }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [line, setLine] = useState<string | null>(null);
  const isNight = currentTheme === 'night';

  useEffect(() => {
    void (async () => {
      const prefs = await getCompanionPrefs();
      setEnabled(prefs.enabled);
      const status = await companionStatus();
      setLine(status.line?.text ?? null);
    })();
  }, [enabled]);

  const toggle = async () => {
    const next = !enabled;
    setEnabled(next);
    await setCompanionPrefs({ enabled: next });
    const status = await companionStatus();
    setLine(status.line?.text ?? null);
  };

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 rounded-xl border mb-4 ${
        isNight ? 'border-white/10 bg-black/10' : 'border-stone-200/80 bg-white/40'
      }`}
    >
      <button
        type="button"
        onClick={() => void toggle()}
        className={`font-mono text-[10px] uppercase tracking-widest shrink-0 ${
          enabled ? 'text-accent' : 'text-stone-500'
        }`}
      >
        Companion {enabled ? 'on' : 'off'}
      </button>
      {enabled && line && (
        <p className={`font-serif text-sm italic ${isNight ? 'text-white/55' : 'text-stone-600'}`}>
          {line}
        </p>
      )}
    </div>
  );
}
