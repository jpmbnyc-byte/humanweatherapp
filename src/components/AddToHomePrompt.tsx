import React from 'react';
import { Smartphone, X } from 'lucide-react';
import { addToHomeInstructions, detectInstallPlatform, type InstallPlatform } from '../lib/addToHome';

type Props = {
  currentTheme: 'day' | 'night';
  themeStyles: { border: string; cardBg: string; textMuted: string };
  onDismiss: () => void;
};

export default function AddToHomePrompt({ currentTheme, themeStyles, onDismiss }: Props) {
  const isNight = currentTheme === 'night';
  const platform = detectInstallPlatform() as InstallPlatform | null;
  if (!platform) return null;

  const steps = addToHomeInstructions(platform);
  const platformLabel = platform === 'ios' ? 'iPhone / iPad' : 'Android';

  return (
    <div
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-4 sm:p-6"
      id="add-to-home-prompt"
      role="dialog"
      aria-labelledby="add-to-home-title"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] cursor-pointer"
        aria-label="Dismiss add to Home Screen instructions"
        onClick={onDismiss}
      />
      <div
        className={`relative w-full max-w-md rounded-2xl border p-5 sm:p-6 shadow-xl ${
          isNight ? 'border-white/15 bg-[#1a1814]/95 text-white' : 'border-stone-200/90 bg-[#faf8f5]/98 text-[#2c2824]'
        }`}
      >
        <button
          type="button"
          onClick={onDismiss}
          className={`absolute top-3 right-3 p-1.5 rounded-full cursor-pointer transition-opacity hover:opacity-70 ${
            isNight ? 'text-white/50' : 'text-stone-400'
          }`}
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3 pr-8">
          <div
            className={`shrink-0 p-2.5 rounded-xl border ${
              isNight ? 'border-accent/30 bg-accent/10 text-accent' : 'border-accent/35 bg-accent/[0.08] text-[#8a6f2e]'
            }`}
          >
            <Smartphone className="w-5 h-5" aria-hidden />
          </div>
          <div>
            <span className="hw-eyebrow block mb-1">Install</span>
            <h2 id="add-to-home-title" className="font-serif text-xl leading-snug">
              Add Human Weather to your Home Screen
            </h2>
            <p className={`hw-section-intro mt-2 ${themeStyles.textMuted}`}>
              Open the field station like an app — one tap, full screen, no browser chrome.
              <span className="block mt-2 font-mono text-xs uppercase tracking-widest opacity-70">
                {platformLabel}
              </span>
            </p>
          </div>
        </div>

        <ol className={`mt-5 space-y-4 hw-instruction-steps list-none ${isNight ? 'text-white/85' : 'text-stone-700'}`}>
          {steps.map((step, index) => (
            <li key={step} className="flex gap-3">
              <span
                className={`shrink-0 w-7 h-7 rounded-full border flex items-center justify-center font-mono text-sm ${
                  isNight ? 'border-accent/35 text-accent' : 'border-accent/40 text-[#8a6f2e]'
                }`}
              >
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        <button
          type="button"
          onClick={onDismiss}
          className={`hw-pressable mt-6 w-full py-3.5 rounded-xl border hw-instruction-action cursor-pointer transition-colors ${themeStyles.border} ${themeStyles.cardBg} ${
            isNight ? 'text-accent hover:bg-accent/10' : 'text-[#8a6f2e] hover:bg-accent/5'
          }`}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
