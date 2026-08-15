import React, { useEffect, useState } from 'react';
import type { WhereAreWeResult } from '../lib/whereAreWe';
import type { Office } from '../lib/officeObserved';
import { JOURNEY_STEPS, useStationJourney, type JourneyStep } from '../lib/StationJourneyContext';
import { companionStatus, getCompanionPrefs, setCompanionPrefs } from '../lib/harness/companion';
import { routePrescription } from '../lib/prescriptionRouter';
import type { WeatherState } from '../types';

type Props = {
  place: WhereAreWeResult | null;
  activeWeather: WeatherState;
  currentTheme: 'day' | 'night';
};

const OFFICE_COPY: Record<
  Office,
  { designation: string; wash: string; line: string }
> = {
  vault: {
    designation: 'OBS/01 · THE VAULT',
    wash: 'hw-wash-dawn',
    line: 'Morning threshold — map, name, breathe, file before noon.',
  },
  meridian: {
    designation: 'OBS/02 · THE MERIDIAN',
    wash: 'hw-wash-noon',
    line: 'Solar hinge — one line, one breath, one moment with the light.',
  },
  marrow: {
    designation: 'OBS/03 · THE MARROW',
    wash: 'hw-wash-dusk',
    line: 'Evening descent — compare the day, wind down, keep a stone if you wish.',
  },
};

function stepIndex(step: JourneyStep): number {
  return JOURNEY_STEPS.findIndex(s => s.id === step);
}

export default function StationGuide({ place, activeWeather, currentTheme }: Props) {
  const {
    activeStep,
    mapped,
    conditionsEngaged,
    breathComplete,
    scrollToStep,
  } = useStationJourney();
  const [companionOn, setCompanionOn] = useState(false);
  const [companionLine, setCompanionLine] = useState<string | null>(null);
  const isNight = currentTheme === 'night';
  const prescription = routePrescription(activeWeather.id);
  const office = place?.activeOffice;
  const officeMeta = office ? OFFICE_COPY[office] : null;

  useEffect(() => {
    void (async () => {
      const prefs = await getCompanionPrefs();
      setCompanionOn(prefs.enabled);
      const status = await companionStatus();
      setCompanionLine(status.line?.text ?? null);
    })();
  }, []);

  const toggleCompanion = async () => {
    const next = !companionOn;
    setCompanionOn(next);
    await setCompanionPrefs({ enabled: next });
    const status = await companionStatus();
    setCompanionLine(status.line?.text ?? null);
  };

  const activeIdx = stepIndex(activeStep);

  return (
    <section
      id="station-guide"
      className={`hw-station-chamber mb-8 ${officeMeta?.wash ?? 'hw-wash-neutral'} ${
        isNight ? 'hw-station-chamber-night' : 'hw-station-chamber-day'
      }`}
    >
      <div className="hw-station-brackets" aria-hidden />

      <div className="relative z-[1] px-5 py-6 md:px-8 md:py-7">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <p className="hw-eyebrow text-accent/70 mb-1">The Field Station</p>
            <h2 className="font-serif text-2xl md:text-3xl text-accent leading-tight">
              What is your weather right now?
            </h2>
            {officeMeta && place?.officeState === 'available' && (
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent/60 mt-3">
                {officeMeta.designation} · door open
              </p>
            )}
            {officeMeta && (
              <p className={`hw-caption mt-2 max-w-prose ${isNight ? 'text-white/55' : 'text-stone-600'}`}>
                {officeMeta.line}
              </p>
            )}
            {!officeMeta && (
              <p className={`hw-caption mt-2 max-w-prose ${isNight ? 'text-white/55' : 'text-stone-600'}`}>
                One instrument, one loop — map the body, name the Conditions, breathe, then follow what the sky prescribes.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => void toggleCompanion()}
            className={`shrink-0 font-mono text-[10px] uppercase tracking-widest px-3 py-2 rounded-lg border transition-colors ${
              companionOn
                ? 'border-accent/40 text-accent bg-accent/5'
                : isNight
                  ? 'border-white/10 text-white/45 hover:text-white/70'
                  : 'border-stone-200 text-stone-500 hover:text-stone-700'
            }`}
          >
            Companion {companionOn ? 'on' : 'off'}
          </button>
        </div>

        {companionOn && companionLine && (
          <p className={`font-serif text-sm italic mb-6 pl-3 border-l-2 border-accent/30 ${isNight ? 'text-white/50' : 'text-stone-600'}`}>
            {companionLine}
          </p>
        )}

        <nav aria-label="Field station journey" className="hw-journey-rail mb-4">
          <ol className="flex flex-wrap gap-2 md:gap-0 md:flex-nowrap md:justify-between">
            {JOURNEY_STEPS.map((step, idx) => {
              const done =
                (step.id === 'map' && mapped) ||
                (step.id === 'name' && conditionsEngaged) ||
                (step.id === 'breathe' && breathComplete) ||
                (step.id === 'prescribe' && breathComplete);
              const current = idx === activeIdx;
              return (
                <li key={step.id} className="flex items-center md:flex-1">
                  <button
                    type="button"
                    onClick={() => scrollToStep(step.id)}
                    className={`hw-journey-step ${current ? 'hw-journey-step-active' : ''} ${done ? 'hw-journey-step-done' : ''}`}
                    aria-current={current ? 'step' : undefined}
                  >
                    <span className="hw-journey-step-num">{idx + 1}</span>
                    <span className="hw-journey-step-label">{step.label}</span>
                  </button>
                  {idx < JOURNEY_STEPS.length - 1 && (
                    <span className="hidden md:block hw-journey-connector" aria-hidden />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        <p className={`font-sans text-sm leading-relaxed ${isNight ? 'text-white/50' : 'text-stone-600'}`}>
          <span className="font-mono text-[10px] uppercase tracking-widest text-accent/70 mr-2">Now</span>
          {JOURNEY_STEPS[activeIdx]?.hint}
          {activeStep === 'prescribe' && prescription.clearMessage && (
            <span className="block mt-1 font-serif italic text-accent/80">{prescription.clearMessage}</span>
          )}
        </p>
      </div>
    </section>
  );
}
