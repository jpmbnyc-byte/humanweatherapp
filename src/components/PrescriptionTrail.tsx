import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { routePrescription } from '../lib/prescriptionRouter';
import type { WeatherState } from '../types';

type AppTab = 'somatic' | 'therapy' | 'rhythms' | 'tender';

type Props = {
  activeTab: AppTab;
  activeWeather: WeatherState;
  currentTheme: 'day' | 'night';
  onReturnStation: () => void;
};

const TAB_LABELS: Record<Exclude<AppTab, 'somatic'>, string> = {
  therapy: 'Aura & Tones',
  rhythms: 'Circadian',
  tender: 'The Tender',
};

export default function PrescriptionTrail({
  activeTab,
  activeWeather,
  currentTheme,
  onReturnStation,
}: Props) {
  const [visible, setVisible] = useState(false);
  const isNight = currentTheme === 'night';
  const prescription = routePrescription(activeWeather.id);

  useEffect(() => {
    if (activeTab === 'somatic') {
      setVisible(false);
      return;
    }
    setVisible(true);
  }, [activeTab]);

  if (!visible || activeTab === 'somatic') return null;

  return (
    <div
      className={`hw-view-enter mb-8 rounded-xl border px-4 py-4 md:px-5 ${
        isNight ? 'border-accent/20 bg-accent/[0.04]' : 'border-accent/25 bg-accent/[0.03]'
      }`}
      id="prescription-trail"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent/70 mb-1">
            Prescribed from the Field Station
          </p>
          <p className={`font-serif text-base ${isNight ? 'text-white/80' : 'text-stone-700'}`}>
            {prescription.label}
          </p>
          <p className={`font-sans text-sm mt-1 ${isNight ? 'text-white/45' : 'text-stone-500'}`}>
            {prescription.reason}
          </p>
        </div>
        <button
          type="button"
          onClick={onReturnStation}
          className={`inline-flex items-center gap-2 shrink-0 font-mono text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-lg border transition-colors ${
            isNight
              ? 'border-white/15 text-white/70 hover:border-accent/40 hover:text-accent'
              : 'border-stone-300 text-stone-600 hover:border-accent/50 hover:text-[#8a6f2e]'
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
          Return to station
        </button>
      </div>
      <p className="font-mono text-[9px] uppercase tracking-wide opacity-40 mt-3">
        Chamber · {TAB_LABELS[activeTab]}
      </p>
    </div>
  );
}
