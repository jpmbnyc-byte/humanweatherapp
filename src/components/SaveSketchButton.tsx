import React, { useState } from 'react';
import { Download } from 'lucide-react';
import type { FormSeed } from '../lib/forming/types';
import { saveSketchMarkToDevice } from '../lib/forming/exportSketchMark';

type Props = {
  seed: FormSeed;
  isNight: boolean;
  compact?: boolean;
};

export default function SaveSketchButton({ seed, isNight, compact = false }: Props) {
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleSave = async () => {
    if (busy) return;
    setBusy(true);
    setFeedback('');

    try {
      const result = await saveSketchMarkToDevice(seed);
      if (result === 'shared') {
        setFeedback('Shared — save to Photos or Files from the sheet');
      } else if (result === 'downloaded') {
        setFeedback('Saved to your device');
      } else if (result === 'opened') {
        setFeedback('Opened — long-press the image to save');
      } else {
        setFeedback('Could not save sketch — try again');
      }
    } catch {
      setFeedback('Could not save sketch — try again');
    } finally {
      setBusy(false);
      window.setTimeout(() => setFeedback(''), 5000);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1.5 mt-2">
      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={busy}
        className={`hw-pressable inline-flex items-center gap-1.5 rounded-full border font-sans transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'
        } ${
          isNight
            ? 'border-white/15 bg-white/5 text-white/75 hover:bg-white/10 hover:text-white'
            : 'border-stone-300/80 bg-white text-stone-700 hover:border-accent/40 hover:text-[#2c2824]'
        }`}
        aria-label="Save field sketch to device as PNG"
      >
        <Download className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} aria-hidden />
        {busy ? 'Saving…' : 'Save field sketch'}
      </button>
      {feedback && (
        <p
          className={`font-sans text-xs ${isNight ? 'text-white/55' : 'text-stone-600'}`}
          aria-live="polite"
        >
          {feedback}
        </p>
      )}
    </div>
  );
}
