import React from 'react';
import { motion } from 'motion/react';
import SomaticGrid from './SomaticGrid';
import TheFascia from './TheFascia';
import ConditionsCard from './ConditionsCard';
import OfficeSequence from './OfficeSequence';
import TrialFootline from './TrialFootline';
import FormingCaptureOverlay from './FormingCaptureOverlay';
import { FormingProvider, useFormingOptional } from '../lib/forming/FormingContext';
import { useEntitlement } from '../lib/EntitlementContext';
import type { WhereAreWeResult } from '../lib/whereAreWe';
import type { WeatherState } from '../types';
import { Suspense, lazy } from 'react';

const BreathworkOrb = lazy(() => import('./BreathworkOrb'));

type AppTab = 'somatic' | 'therapy' | 'rhythms' | 'tender';

type Props = {
  currentTheme: 'day' | 'night';
  motionReady: boolean;
  activeWeather: WeatherState;
  themeStyles: { border: string; cardBg: string };
  isNight: boolean;
  place: WhereAreWeResult | null;
  onStateChange: (state: WeatherState, coords: [number, number][]) => void;
  onNavigateTab: (tab: AppTab) => void;
};

function SomaticScaleWrap({ children }: { children: React.ReactNode }) {
  const forming = useFormingOptional();
  return (
    <div
      style={{
        transform: forming && forming.scalePunch < 1 ? `scale(${forming.scalePunch})` : undefined,
        transition: forming?.reduceMotion ? 'none' : 'transform 140ms ease-out',
      }}
    >
      {children}
    </div>
  );
}

export default function SomaticTabView({
  currentTheme,
  motionReady,
  activeWeather,
  themeStyles,
  isNight,
  place,
  onStateChange,
  onNavigateTab,
}: Props) {
  const { can } = useEntitlement();
  const nascimentoEnabled = can('nascimento');
  const conditionsSummary = `${activeWeather.clinicalIndex} · HRV ${activeWeather.hrv}%`;

  const inner = (
    <>
      <FormingCaptureOverlay currentTheme={currentTheme} />
      <SomaticScaleWrap>
        <motion.div
          initial={motionReady ? { opacity: 0, y: 12 } : false}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="flex flex-col"
        >
          <TrialFootline currentTheme={currentTheme} />
          <OfficeSequence
            place={place}
            currentTheme={currentTheme}
            onNavigateTab={onNavigateTab}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            <div className="lg:col-span-5 flex flex-col items-center">
              <SomaticGrid onStateChange={onStateChange} currentTheme={currentTheme} />
              <TheFascia currentTheme={currentTheme} />
            </div>

            <div className="lg:col-span-7 flex flex-col gap-10 w-full">
              <ConditionsCard
                activeWeather={activeWeather}
                themeStyles={themeStyles}
                isNight={isNight}
                onNavigateTab={onNavigateTab}
              />

              <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-accent/5" aria-hidden />}>
                <BreathworkOrb weatherState={activeWeather} currentTheme={currentTheme} />
              </Suspense>
            </div>
          </div>
        </motion.div>
      </SomaticScaleWrap>
    </>
  );

  if (!nascimentoEnabled) {
    return inner;
  }

  return (
    <FormingProvider
      weather={activeWeather}
      conditionsSummary={conditionsSummary}
      active
    >
      {inner}
    </FormingProvider>
  );
}
