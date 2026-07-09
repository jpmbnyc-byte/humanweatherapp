import React, { useState } from 'react';
import { Volume2, Square } from 'lucide-react';
import type { WeatherState } from '../types';
import { getConditionCopy } from '../data/conditions';
import { prescriptionTab, routePrescription } from '../lib/prescriptionRouter';
import { stationSpeak, stationStop } from '../lib/stationSpeech';
import { useEntitlement } from '../lib/EntitlementContext';

type Props = {
  activeWeather: WeatherState;
  themeStyles: { border: string; cardBg: string };
  isNight: boolean;
  onNavigateTab: (tab: 'somatic' | 'therapy' | 'rhythms' | 'tender') => void;
};

export default function ConditionsCard({
  activeWeather,
  themeStyles,
  isNight,
  onNavigateTab,
}: Props) {
  const { can } = useEntitlement();
  const [speaking, setSpeaking] = useState(false);
  const register = getConditionCopy(activeWeather.id);
  const prescription = routePrescription(activeWeather.id);
  const showPrescription = can('prescriptions');

  const handleListen = async () => {
    if (speaking) {
      stationStop();
      setSpeaking(false);
      return;
    }
    const text = register?.spoken ?? `${activeWeather.title}. ${activeWeather.description}`;
    setSpeaking(true);
    try {
      await stationSpeak(text);
    } finally {
      setSpeaking(false);
    }
  };

  const handlePrescription = () => {
    if (prescription.target === 'clear') return;
    const tab = prescriptionTab(prescription.target);
    if (tab) onNavigateTab(tab);
  };

  return (
    <div
      className={`p-8 md:p-10 rounded-2xl border ${themeStyles.border} ${themeStyles.cardBg}`}
      id="conditions-card"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <span className="font-mono text-xs uppercase tracking-widest opacity-50">
          Current conditions: {activeWeather.title} · coherence {activeWeather.hrv}%
        </span>
        <button
          type="button"
          onClick={() => void handleListen()}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono uppercase tracking-wide transition-colors cursor-pointer shrink-0 ${
            isNight
              ? 'border-white/15 text-white/70 hover:border-accent/40 hover:text-accent'
              : 'border-stone-300 text-stone-600 hover:border-accent/50 hover:text-[#8a6f2e]'
          }`}
          aria-pressed={speaking}
        >
          {speaking ? <Square className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
          {speaking ? 'Stop' : 'Listen'}
        </button>
      </div>

      <h2
        className={`font-serif text-2xl md:text-3xl font-medium tracking-tight leading-snug mb-6 ${isNight ? 'text-accent' : 'text-[#2c2824]'}`}
      >
        {activeWeather.title}
      </h2>

      {register ? (
        <div className="flex flex-col divide-y divide-accent/10 border-y border-accent/10 mb-8">
          {(
            [
              ['Felt', register.felt],
              ['Fact', register.fact],
              ['Faith', register.faith],
            ] as const
          ).map(([label, line]) => (
            <div key={label} className="py-4 first:pt-0 last:pb-0">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-40 block mb-1.5">
                {label}
              </span>
              <p className="font-sans text-base md:text-lg leading-relaxed opacity-90">{line}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="font-sans text-base md:text-lg leading-[1.75] mb-8 max-w-prose">
          {activeWeather.description}
        </p>
      )}

      <div
        className={`p-5 md:p-6 rounded-xl border font-serif text-base md:text-lg italic mb-8 leading-relaxed ${
          isNight
            ? 'border-[#d4b05a]/20 bg-white/[0.05] text-[#f5f0e8]'
            : 'border-accent/15 bg-accent/[0.03] text-[#2c2824]'
        }`}
      >
        <span
          className={`font-mono text-xs uppercase tracking-widest not-italic block mb-2 ${
            isNight ? 'text-[#d4b85a]' : 'opacity-60'
          }`}
        >
          Somatic guidance
        </span>
        &ldquo;{activeWeather.guidanceText}&rdquo;
      </div>

      {showPrescription && (
        <div className="border-t border-accent/10 pt-6">
          <span className="font-mono text-xs uppercase tracking-widest opacity-40 block mb-2">
            Prescription
          </span>
          {prescription.target === 'clear' ? (
            <p className="font-serif text-lg italic opacity-80">{prescription.clearMessage}</p>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <p className="font-sans text-sm opacity-75 mb-1">{prescription.reason}</p>
                <p className="font-mono text-sm uppercase tracking-wide opacity-90">{prescription.label}</p>
              </div>
              <button
                type="button"
                onClick={handlePrescription}
                className={`px-4 py-2 rounded-xl border text-xs font-mono uppercase tracking-widest cursor-pointer transition-colors ${
                  isNight
                    ? 'border-accent/30 text-accent hover:bg-accent/10'
                    : 'border-accent/40 text-[#8a6f2e] hover:bg-accent/5'
                }`}
              >
                Open {prescription.label}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6 border-t border-accent/10 pt-6 mt-8 text-left">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest opacity-40 block mb-1">
            Clinical index
          </span>
          <span className="font-mono text-sm opacity-80">{activeWeather.clinicalIndex}</span>
        </div>
        <div>
          <span className="font-mono text-xs uppercase tracking-widest opacity-40 block mb-1">
            Respiratory ratio
          </span>
          <span className="font-mono text-sm opacity-80">
            {activeWeather.respiratoryRatio} (inhale:exhale)
          </span>
        </div>
      </div>
    </div>
  );
}
