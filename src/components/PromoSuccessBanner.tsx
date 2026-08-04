import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useEntitlement } from '../lib/EntitlementContext';

type Props = {
  currentTheme: 'day' | 'night';
  message: string;
  onDismiss: () => void;
};

export default function PromoSuccessBanner({ currentTheme, message, onDismiss }: Props) {
  const isNight = currentTheme === 'night';
  const { membershipExpiresLabel } = useEntitlement();

  return (
    <div
      className={`w-full mb-6 px-4 py-4 rounded-xl border flex items-start gap-3 ${
        isNight ? 'border-accent/30 bg-accent/10 text-accent' : 'border-accent/35 bg-accent/[0.06] text-[#8a6f2e]'
      }`}
      id="promo-success-banner"
      role="status"
    >
      <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-serif text-base">{message}</p>
        {membershipExpiresLabel && (
          <p className={`font-sans text-sm mt-1 ${isNight ? 'text-white/65' : 'text-stone-600'}`}>
            {membershipExpiresLabel === 'Lifetime access'
              ? 'Lifetime access — all features unlocked on this device.'
              : `Access through ${membershipExpiresLabel}.`}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className={`font-mono text-[10px] uppercase tracking-widest shrink-0 cursor-pointer ${
          isNight ? 'text-white/50 hover:text-white/80' : 'text-stone-400 hover:text-stone-600'
        }`}
      >
        Dismiss
      </button>
    </div>
  );
}
