import React from 'react';
import { AlertCircle } from 'lucide-react';

type Props = {
  currentTheme: 'day' | 'night';
  message: string;
  onDismiss: () => void;
};

export default function PurchaseVerifyErrorBanner({ currentTheme, message, onDismiss }: Props) {
  const isNight = currentTheme === 'night';

  return (
    <div
      className={`w-full mb-6 px-4 py-4 rounded-xl border flex items-start gap-3 ${
        isNight ? 'border-red-400/30 bg-red-500/10 text-red-200' : 'border-red-300/60 bg-red-50 text-red-900'
      }`}
      role="alert"
    >
      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-serif text-base">Payment not verified</p>
        <p className={`font-sans text-sm mt-1 ${isNight ? 'text-white/70' : 'text-red-800/80'}`}>{message}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className={`font-mono text-[10px] uppercase tracking-widest shrink-0 cursor-pointer ${
          isNight ? 'text-white/50 hover:text-white/80' : 'text-red-500 hover:text-red-700'
        }`}
      >
        Dismiss
      </button>
    </div>
  );
}
