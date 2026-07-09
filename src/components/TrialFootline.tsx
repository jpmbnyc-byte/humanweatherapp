import React from 'react';
import { useEntitlement } from '../lib/EntitlementContext';

type Props = {
  currentTheme: 'day' | 'night';
};

export default function TrialFootline({ currentTheme }: Props) {
  const { footline, effective } = useEntitlement();
  const isNight = currentTheme === 'night';

  if (!footline || effective !== 'trial') return null;

  return (
    <p
      className={`w-full mb-6 px-4 py-3 rounded-xl border text-center font-mono text-[11px] uppercase tracking-wide ${
        isNight
          ? 'border-accent/25 text-accent/80 bg-accent/5'
          : 'border-accent/30 text-[#8a6f2e] bg-accent/[0.04]'
      }`}
      id="trial-footline"
    >
      {footline}
    </p>
  );
}
