import React, { useEffect, useRef } from 'react';
import { Square, Play } from 'lucide-react';
import type { WeatherState } from '../types';
import { getConditionCopy } from '../data/conditions';
import { prescriptionTab, routePrescription } from '../lib/prescriptionRouter';
import { setPrescriptionFocus } from '../lib/prescriptionFocus';
import { useSpokenProse } from '../hooks/useSpokenProse';
import { useEntitlement } from '../lib/EntitlementContext';
import { useStationJourneyOptional } from '../lib/StationJourneyContext';
import PurchaseOffer from './PurchaseOffer';

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
  const journey = useStationJourneyOptional();
  const viewedRef = useRef(false);

  useEffect(() => {
    if (viewedRef.current) return;
    viewedRef.current = true;
    journey?.markConditionsEngaged();
  }, [journey]);
  const { can } = useEntitlement();
  const { speak, stop, status } = useSpokenProse();
  const isSpeaking = status === 'speaking';
  const register = getConditionCopy(activeWeather.id);
  const prescription = routePrescription(activeWeather.id);
  const showPrescription = can('prescriptions');

  const conditionsText =
    register?.spoken ?? `${activeWeather.title}. ${activeWeather.description}`;

  const handleListen = () => {
    if (isSpeaking) {
      stop();
      return;
    }
    void speak(conditionsText);
  };

  const handlePrescription = () => {
    if (prescription.target === 'clear') return;
    journey?.markPrescriptionTaken();
    if (prescription.focus) setPrescriptionFocus(prescription.focus);
    const tab = prescriptionTab(prescription.target);
    if (tab) onNavigateTab(tab);
  };

  return (
    <div
      className={`p-6 sm:p-8 md:p-10 rounded-2xl border ${themeStyles.border} ${themeStyles.cardBg}`}
      id="conditions-card"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <span className="font-mono text-sm uppercase tracking-widest opacity-60">
          Current conditions: {activeWeather.title}
        </span>
        <button
          type="button"
          onClick={handleListen}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-mono uppercase tracking-wide transition-colors cursor-pointer shrink-0 ${
            isNight
              ? 'border-white/15 text-white/70 hover:border-accent/40 hover:text-accent'
              : 'border-stone-300 text-stone-600 hover:border-accent/50 hover:text-[#8a6f2e]'
          }`}
          aria-label={isSpeaking ? 'Stop reading conditions' : 'Play current conditions'}
          aria-pressed={isSpeaking}
        >
          {isSpeaking ? (
            <>
              <Square className="w-4 h-4 fill-current" /> Stop
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" /> Play
            </>
          )}
          {status === 'error' && (
            <span className="text-xs normal-case tracking-normal opacity-80">voice unavailable</span>
          )}
        </button>
      </div>

      <h2
        className={`font-serif text-3xl md:text-4xl font-medium tracking-tight leading-snug mb-7 ${isNight ? 'text-accent' : 'text-[#2c2824]'}`}
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
              <span className="font-mono text-xs uppercase tracking-[0.2em] opacity-55 block mb-2">
                {label}
              </span>
              <p className="font-sans text-lg md:text-xl leading-[1.7] opacity-90">{line}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="font-sans text-lg md:text-xl leading-[1.75] mb-8 max-w-prose">
          {activeWeather.description}
        </p>
      )}

      <div
        className={`p-5 md:p-7 rounded-xl border font-serif text-xl md:text-2xl italic mb-8 leading-[1.65] ${
          isNight
            ? 'border-[#d4b05a]/20 bg-white/[0.05] text-[#f5f0e8]'
            : 'border-accent/15 bg-accent/[0.03] text-[#2c2824]'
        }`}
      >
        <span
          className={`font-mono text-sm uppercase tracking-widest not-italic block mb-3 ${
            isNight ? 'text-[#d4b85a]' : 'opacity-60'
          }`}
        >
          Somatic guidance
        </span>
        &ldquo;{activeWeather.guidanceText}&rdquo;
      </div>

      {showPrescription ? (
        <div className="border-t border-accent/10 pt-6">
          <span className="font-mono text-sm uppercase tracking-widest opacity-55 block mb-3">
            Prescription
          </span>
          {prescription.target === 'clear' ? (
            <p className="font-serif text-xl md:text-2xl leading-relaxed italic opacity-85">{prescription.clearMessage}</p>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <p className="hw-instruction text-lg leading-relaxed opacity-90 mb-3">{prescription.reason}</p>
                <p className="font-mono text-base uppercase tracking-wide opacity-90 mb-3">{prescription.label}</p>
                <p
                  className={`hw-instruction-setup text-base leading-relaxed ${
                    isNight ? 'text-white/55' : 'text-stone-600'
                  }`}
                >
                  {prescription.research}
                </p>
              </div>
              <button
                type="button"
                onClick={handlePrescription}
                className={`px-4 py-3 rounded-xl border text-sm font-mono uppercase tracking-widest cursor-pointer transition-colors ${
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
      ) : (
        <div className="border-t border-accent/10 pt-6">
          <span className="font-mono text-sm uppercase tracking-widest opacity-55 block mb-3">
            Prescription
          </span>
          <p className={`hw-section-intro text-lg leading-relaxed mb-4 ${isNight ? 'text-white/70' : 'text-stone-600'}`}>
            Routed prescriptions unlock with membership.
          </p>
          <PurchaseOffer currentTheme={isNight ? 'night' : 'day'} variant="compact" />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-accent/10 pt-6 mt-8 text-left">
        <div>
          <span className="font-mono text-sm uppercase tracking-widest opacity-55 block mb-2">
            Clinical index
          </span>
          <span className="font-mono text-base leading-relaxed opacity-85">{activeWeather.clinicalIndex}</span>
        </div>
        <div>
          <span className="font-mono text-sm uppercase tracking-widest opacity-55 block mb-2">
            Respiratory ratio
          </span>
          <span className="font-mono text-base leading-relaxed opacity-85">
            {activeWeather.respiratoryRatio} (inhale:exhale)
          </span>
        </div>
      </div>
    </div>
  );
}
