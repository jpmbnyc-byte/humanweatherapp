import React from 'react';
import { Sparkles } from 'lucide-react';
import { useEntitlement } from '../lib/EntitlementContext';
import { getPurchasePriceDisplay } from '../lib/purchaseConfig';

type Props = {
  isNight: boolean;
  themeStyles: { border: string; cardBg: string };
};

export default function MembershipButton({ isNight, themeStyles }: Props) {
  const { isMember, startPurchase, effective } = useEntitlement();
  const price = getPurchasePriceDisplay();

  if (isMember) return null;

  const label = effective === 'lapsed' ? 'Restore access' : 'Get access';

  return (
    <button
      type="button"
      onClick={startPurchase}
      className={`hw-pressable hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-full border text-[10px] font-mono uppercase tracking-widest cursor-pointer transition-colors ${themeStyles.border} ${themeStyles.cardBg} ${
        isNight ? 'text-accent hover:bg-accent/10' : 'text-[#8a6f2e] hover:bg-accent/5'
      }`}
      id="membership-header-btn"
    >
      <Sparkles className="w-3 h-3" />
      {label}
      {price ? ` · ${price}` : ''}
    </button>
  );
}
