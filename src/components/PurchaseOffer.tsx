import React from 'react';
import { Sparkles } from 'lucide-react';
import {
  MEMBERSHIP_FEATURES,
  getPurchasePriceDisplay,
  getPurchasePriceLabel,
  isPurchaseConfigured,
} from '../lib/purchaseConfig';
import { useEntitlement } from '../lib/EntitlementContext';
import PromoCodeEntry from './PromoCodeEntry';

type Props = {
  currentTheme: 'day' | 'night';
  /** compact = single row; card = full offer panel */
  variant?: 'compact' | 'card';
  className?: string;
};

export default function PurchaseOffer({ currentTheme, variant = 'card', className = '' }: Props) {
  const { effective, startPurchase, isMember } = useEntitlement();
  const isNight = currentTheme === 'night';
  const price = getPurchasePriceDisplay();
  const priceLabel = getPurchasePriceLabel();
  const configured = isPurchaseConfigured();

  if (isMember) return null;

  const ctaLabel = effective === 'lapsed' ? 'Renew annual access' : 'Get annual access';

  if (variant === 'compact') {
    return (
      <div className={`flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3 w-full ${className}`}>
        <button
          type="button"
          onClick={startPurchase}
          disabled={!configured}
          className={`flex w-full sm:w-auto sm:inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-xl border text-[11px] sm:text-xs font-mono uppercase tracking-widest cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            isNight
              ? 'border-accent/40 text-accent hover:bg-accent/10'
              : 'border-accent/50 text-[#8a6f2e] hover:bg-accent/5'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {ctaLabel}
            {price ? ` · ${price}` : ''}
          </span>
        </button>
        {!configured && (
          <span className={`font-mono text-[10px] opacity-45 ${isNight ? 'text-white/50' : 'text-stone-500'}`}>
            Set VITE_PURCHASE_URL to your checkout link
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border p-6 md:p-7 ${
        isNight ? 'border-accent/25 bg-accent/[0.06]' : 'border-accent/30 bg-accent/[0.04]'
      } ${className}`}
      id="purchase-offer"
    >
      <div className="flex items-start gap-3 mb-4">
        <Sparkles className={`w-5 h-5 shrink-0 mt-0.5 ${isNight ? 'text-accent' : 'text-[#8a6f2e]'}`} />
        <div>
          <span className="hw-eyebrow block mb-1">Membership</span>
          <h3 className={`font-serif text-xl leading-snug ${isNight ? 'text-white/90' : 'text-[#2c2824]'}`}>
            Keep the full Field Station
          </h3>
          <p className={`font-sans text-sm mt-2 leading-relaxed ${isNight ? 'text-white/60' : 'text-stone-600'}`}>
            {effective === 'lapsed'
              ? 'This month\'s trial has ended. A fresh trial opens on the 1st — or unlock now with annual access or a promo code.'
              : '$60 unlocks one full year. No monthly plan — renew manually when your year ends.'}
          </p>
        </div>
      </div>

      <ul className={`space-y-2 mb-5 font-sans text-sm ${isNight ? 'text-white/70' : 'text-stone-700'}`}>
        {MEMBERSHIP_FEATURES.map(line => (
          <li key={line} className="flex gap-2">
            <span className="text-accent opacity-80">·</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <button
          type="button"
          onClick={startPurchase}
          disabled={!configured}
          className={`px-5 py-3 rounded-xl border text-xs font-mono uppercase tracking-[0.15em] cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            isNight
              ? 'border-accent bg-accent/15 text-accent hover:bg-accent/25'
              : 'border-accent/50 bg-white text-[#8a6f2e] hover:bg-accent/5 shadow-sm'
          }`}
        >
          {ctaLabel}
        </button>
        <div className={`font-mono text-[11px] uppercase tracking-wide ${isNight ? 'text-white/45' : 'text-stone-500'}`}>
          {price ? <span className="block text-base font-medium opacity-90 mb-0.5">{price}</span> : null}
          {priceLabel}
        </div>
      </div>

      {!configured && (
        <p className={`mt-4 font-mono text-[10px] leading-relaxed ${isNight ? 'text-white/40' : 'text-stone-400'}`}>
          Add env vars from <code className="opacity-80">docs/STRIPE_SETUP.md</code> — Payment Link redirect must include{' '}
          <code className="opacity-80">session_id={'{CHECKOUT_SESSION_ID}'}</code>.
        </p>
      )}

      <PromoCodeEntry currentTheme={currentTheme} />
    </div>
  );
}
