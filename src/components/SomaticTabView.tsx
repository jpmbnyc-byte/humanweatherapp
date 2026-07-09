import React, { Suspense, lazy, useEffect, useState } from 'react';
import SomaticGrid from './SomaticGrid';
import ConditionsCard from './ConditionsCard';
import TrialFootline from './TrialFootline';
import PurchaseSuccessBanner from './PurchaseSuccessBanner';
import { useFormingOptional } from '../lib/forming/formingContextLite';
import { useEntitlement } from '../lib/EntitlementContext';
import { runWhenIdle } from '../lib/deferredWork';
import type { WhereAreWeResult } from '../lib/whereAreWe';
import type { WeatherState } from '../types';

const BreathworkOrb = lazy(() => import('./BreathworkOrb'));
const OfficeSequence = lazy(() => import('./OfficeSequence'));
const TheFascia = lazy(() => import('./TheFascia'));
const FormingCaptureOverlay = lazy(() => import('./FormingCaptureOverlay'));
const FormingProvider = lazy(() =>
  import('../lib/forming/FormingContext').then(m => ({ default: m.FormingProvider })),
);

type AppTab = 'somatic' | 'therapy' | 'rhythms' | 'tender';

type Props = {
  currentTheme: 'day' | 'night';
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
  activeWeather,
  themeStyles,
  isNight,
  place,
  onStateChange,
  onNavigateTab,
}: Props) {
  const { can, purchaseJustCompleted, dismissPurchaseSuccess } = useEntitlement();
  const nascimentoEnabled = can('nascimento');
  const conditionsSummary = `${activeWeather.clinicalIndex} · HRV ${activeWeather.hrv}%`;
  const [formingReady, setFormingReady] = useState(false);

  useEffect(() => {
    if (!nascimentoEnabled) return;
    runWhenIdle(() => setFormingReady(true), 5000);
  }, [nascimentoEnabled]);

  const inner = (
    <>
      {formingReady && (
        <Suspense fallback={null}>
          <FormingCaptureOverlay currentTheme={currentTheme} />
        </Suspense>
      )}
      <SomaticScaleWrap>
        <div className="hw-view-enter flex flex-col">
          <TrialFootline currentTheme={currentTheme} />
          {purchaseJustCompleted && (
            <PurchaseSuccessBanner
              currentTheme={currentTheme}
              onDismiss={dismissPurchaseSuccess}
            />
          )}
          <Suspense fallback={<div className="h-24 animate-pulse rounded-xl bg-accent/5 mb-6" aria-hidden />}>
            <OfficeSequence
              place={place}
              currentTheme={currentTheme}
              onNavigateTab={onNavigateTab}
            />
          </Suspense>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            <div className="lg:col-span-5 flex flex-col items-center">
              <SomaticGrid onStateChange={onStateChange} currentTheme={currentTheme} />
              <Suspense fallback={<div className="h-32 w-full mt-8 animate-pulse rounded-xl bg-accent/5" aria-hidden />}>
                <TheFascia currentTheme={currentTheme} />
              </Suspense>
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
        </div>
      </SomaticScaleWrap>
    </>
  );

  if (!nascimentoEnabled || !formingReady) {
    return inner;
  }

  return (
    <Suspense fallback={inner}>
      <FormingProvider
        weather={activeWeather}
        conditionsSummary={conditionsSummary}
        active
      >
        {inner}
      </FormingProvider>
    </Suspense>
  );
}
