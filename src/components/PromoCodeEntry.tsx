import React, { useState, useEffect } from 'react';
import { Tag } from 'lucide-react';
import { PROMO_MAX_LEN, PROMO_MIN_LEN } from '../lib/promoCodes';
import { useEntitlement } from '../lib/EntitlementContext';

type Props = {
  currentTheme: 'day' | 'night';
  compact?: boolean;
};

export default function PromoCodeEntry({ currentTheme, compact = false }: Props) {
  const { redeemPromo, isMember, pendingPromoCode } = useEntitlement();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const isNight = currentTheme === 'night';

  useEffect(() => {
    if (pendingPromoCode && !code) {
      setCode(pendingPromoCode);
    }
  }, [pendingPromoCode, code]);

  if (isMember) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !code.trim()) return;
    setBusy(true);
    setMessage('');
    setError(false);

    const result = await redeemPromo(code);
    if (result.ok) {
      setMessage(result.message);
      setCode('');
    } else {
      setError(true);
      setMessage(result.message);
    }
    setBusy(false);
  };

  const inputClass = `w-full min-w-0 rounded-lg border px-3 py-2 font-mono text-sm uppercase tracking-wider outline-none transition-colors ${
    isNight
      ? 'border-white/15 bg-black/20 text-white placeholder:text-white/30 focus:border-accent/50'
      : 'border-stone-300 bg-white text-[#2c2824] placeholder:text-stone-400 focus:border-accent/60'
  }`;

  const btnClass = `shrink-0 px-4 py-2 rounded-lg border text-xs font-mono uppercase tracking-widest cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
    isNight
      ? 'border-white/20 text-white/80 hover:bg-white/10'
      : 'border-stone-300 text-stone-700 hover:bg-stone-50'
  }`;

  return (
    <form
      onSubmit={e => void handleSubmit(e)}
      className={compact ? 'flex flex-col gap-2 w-full' : 'mt-5 pt-5 border-t border-accent/15 flex flex-col gap-3'}
      id="promo-code-entry"
    >
      {!compact && (
        <div className="flex items-center gap-2">
          <Tag className={`w-4 h-4 ${isNight ? 'text-white/45' : 'text-stone-500'}`} aria-hidden />
          <span className={`font-mono text-[10px] uppercase tracking-widest ${isNight ? 'text-white/45' : 'text-stone-500'}`}>
            Promo code
          </span>
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, PROMO_MAX_LEN))}
          placeholder={`Code (${PROMO_MIN_LEN}–${PROMO_MAX_LEN} chars)`}
          minLength={PROMO_MIN_LEN}
          maxLength={PROMO_MAX_LEN}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className={inputClass}
          aria-label="Promo code"
        />
        <button type="submit" disabled={busy || code.trim().length < PROMO_MIN_LEN} className={btnClass}>
          {busy ? 'Applying…' : 'Apply'}
        </button>
      </div>
      {message && (
        <p
          className={`font-sans text-sm ${error ? (isNight ? 'text-red-300' : 'text-red-700') : isNight ? 'text-accent/90' : 'text-[#8a6f2e]'}`}
          aria-live="polite"
        >
          {message}
        </p>
      )}
    </form>
  );
}
