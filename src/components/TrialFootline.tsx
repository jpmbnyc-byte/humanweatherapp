import React from 'react';
import { useEntitlement } from '../lib/EntitlementContext';
import PurchaseOffer from './PurchaseOffer';

type Props = {
  currentTheme: 'day' | 'night';
};

export default function TrialFootline({ currentTheme }: Props) {
  const { footline, effective, isMember } = useEntitlement();
  const isNight = currentTheme === 'night';

  if (isMember) return null;

  const showEndingSoon = footline && effective === 'trial';
  const showEarlyUpgrade = effective === 'trial' && !footline;

  if (!showEndingSoon && !showEarlyUpgrade && effective !== 'lapsed') return null;

  return (
    <div className="w-full mb-6 flex flex-col gap-4" id="trial-footline">
      {showEndingSoon && (
        <p
          className={`px-4 py-3 rounded-xl border text-center font-mono text-[11px] uppercase tracking-wide ${
            isNight
              ? 'border-accent/25 text-accent/80 bg-accent/5'
              : 'border-accent/30 text-[#8a6f2e] bg-accent/[0.04]'
          }`}
        >
          {footline}
        </p>
      )}

      {effective === 'lapsed' ? (
        <PurchaseOffer currentTheme={currentTheme} variant="card" />
      ) : (
        <div
          className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 rounded-xl border ${
            isNight ? 'border-white/10 bg-black/15' : 'border-stone-200/80 bg-white/50'
          }`}
        >
          <p className={`font-sans text-sm ${isNight ? 'text-white/60' : 'text-stone-600'}`}>
            {showEndingSoon
              ? 'Lock in annual access before the trial closes.'
              : 'Enjoying the full Field Station? Keep it with $60/year — no monthly plan.'}
          </p>
          <PurchaseOffer currentTheme={currentTheme} variant="compact" />
        </div>
      )}
    </div>
  );
}
