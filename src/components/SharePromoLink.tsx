import React, { useState } from 'react';
import { Gift, Link2 } from 'lucide-react';
import { shareAnnualPromoLink } from '../lib/promoShare';

type Props = {
  currentTheme: 'day' | 'night';
  variant?: 'header' | 'inline';
  themeStyles?: { border: string; cardBg: string };
};

export default function SharePromoLink({ currentTheme, variant = 'inline', themeStyles }: Props) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const isNight = currentTheme === 'night';

  const handleShare = async () => {
    const result = await shareAnnualPromoLink();
    const message =
      result === 'shared'
        ? 'Share sheet opened.'
        : result === 'copied'
          ? 'Gift link copied — paste anywhere.'
          : 'Could not share. Try again.';
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 4000);
  };

  if (variant === 'header' && themeStyles) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => void handleShare()}
          className={`hw-pressable hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-full border text-[10px] font-mono uppercase tracking-widest cursor-pointer transition-colors ${themeStyles.border} ${themeStyles.cardBg} ${
            isNight ? 'text-accent hover:bg-accent/10' : 'text-[#8a6f2e] hover:bg-accent/5'
          }`}
          id="gift-year-share-btn"
          title="Share complimentary 1-year access (HUMAN11)"
        >
          <Gift className="w-3 h-3" />
          Gift year
        </button>
        {feedback && (
          <span
            className={`absolute right-0 top-full mt-2 whitespace-nowrap rounded-lg border px-2 py-1 font-mono text-[10px] z-20 ${
              isNight ? 'border-white/15 bg-black/80 text-white/80' : 'border-stone-200 bg-white text-stone-600 shadow-sm'
            }`}
            role="status"
          >
            {feedback}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={() => void handleShare()}
        className={`inline-flex items-center gap-1.5 self-start font-mono text-[10px] uppercase tracking-widest cursor-pointer transition-opacity hover:opacity-80 ${
          isNight ? 'text-white/45 hover:text-accent/90' : 'text-stone-500 hover:text-[#8a6f2e]'
        }`}
        id="gift-year-share-inline"
      >
        <Link2 className="w-3 h-3" aria-hidden />
        Share 1-year gift link
      </button>
      {feedback && (
        <p
          className={`font-sans text-xs ${isNight ? 'text-accent/85' : 'text-[#8a6f2e]'}`}
          aria-live="polite"
        >
          {feedback}
        </p>
      )}
    </div>
  );
}
