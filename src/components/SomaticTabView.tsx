import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import SomaticGrid from './SomaticGrid';
import ConditionsCard from './ConditionsCard';
import TrialFootline from './TrialFootline';
import OfficeSequence from './OfficeSequence';
import StationGuide from './StationGuide';
import PurchaseSuccessBanner from './PurchaseSuccessBanner';
import PromoSuccessBanner from './PromoSuccessBanner';
import PurchaseVerifyErrorBanner from './PurchaseVerifyErrorBanner';
import { useFormingOptional } from '../lib/forming/FormingContext';
import { useEntitlement } from '../lib/EntitlementContext';
import { StationJourneyProvider, useStationJourney } from '../lib/StationJourneyContext';
import PatternViewPanel from './harness/PatternViewPanel';
import { appendReading } from '../lib/harness/readings';
import { noteWeatherObservation } from '../lib/harness/vocabulary';
import { runWhenIdle } from '../lib/deferredWork';
import type { WhereAreWeResult } from '../lib/whereAreWe';
import type { WeatherState } from '../types';

const BreathworkOrb = lazy(() => import('./BreathworkOrb'));
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

function SomaticTabBody({
  currentTheme,
  activeWeather,
  themeStyles,
  isNight,
  place,
  onStateChange,
  onNavigateTab,
}: Props) {
  const {
    can,
    purchaseJustCompleted,
    dismissPurchaseSuccess,
    purchaseVerifyError,
    dismissPurchaseVerifyError,
    promoMessage,
    dismissPromoMessage,
  } = useEntitlement();
  const { markMapped, markBreathComplete } = useStationJourney();
  const nascimentoEnabled = can('nascimento');
  const conditionsSummary = `${activeWeather.clinicalIndex} · HRV ${activeWeather.hrv}%`;
  const [formingReady, setFormingReady] = useState(false);

  useEffect(() => {
    if (!nascimentoEnabled) return;
    runWhenIdle(() => setFormingReady(true), 1500);
  }, [nascimentoEnabled]);

  const handleStateChange = useCallback(
    (state: WeatherState, coords: [number, number][]) => {
      if (coords.length > 0) markMapped();
      void appendReading({ weatherId: state.id, source: 'field_station' });
      void noteWeatherObservation(state.id);
      onStateChange(state, coords);
    },
    [markMapped, onStateChange],
  );

  const handleBreathComplete = useCallback(() => {
    markBreathComplete();
  }, [markBreathComplete]);

  const inner = (
    <>
      {formingReady && (
        <Suspense fallback={null}>
          <FormingCaptureOverlay currentTheme={currentTheme} />
        </Suspense>
      )}
      <SomaticScaleWrap>
        <div className="hw-view-enter flex flex-col overflow-x-hidden w-full min-w-0">
          <TrialFootline currentTheme={currentTheme} />
          {purchaseJustCompleted && (
            <PurchaseSuccessBanner
              currentTheme={currentTheme}
              onDismiss={dismissPurchaseSuccess}
            />
          )}
          {promoMessage && (
            <PromoSuccessBanner
              currentTheme={currentTheme}
              message={promoMessage}
              onDismiss={dismissPromoMessage}
            />
          )}
          {purchaseVerifyError && (
            <PurchaseVerifyErrorBanner
              currentTheme={currentTheme}
              message={purchaseVerifyError}
              onDismiss={dismissPurchaseVerifyError}
            />
          )}

          <StationGuide
            place={place}
            activeWeather={activeWeather}
            currentTheme={currentTheme}
          />

          {place?.activeOffice && place.officeState === 'available' && (
            <div className="hw-station-linked mb-8">
              <OfficeSequence
                place={place}
                currentTheme={currentTheme}
                onNavigateTab={onNavigateTab}
              />
            </div>
          )}

          <div className="flex flex-col gap-10 lg:gap-12 w-full min-w-0">
            <section aria-label="Somatic field mapping" className="hw-station-linked">
              <SomaticGrid onStateChange={handleStateChange} currentTheme={currentTheme} />
            </section>

            <section aria-label="Current conditions" className="hw-station-linked">
              <ConditionsCard
                activeWeather={activeWeather}
                themeStyles={themeStyles}
                isNight={isNight}
                onNavigateTab={onNavigateTab}
              />
            </section>

            <section aria-label="Calibrated breathwork" className="hw-station-linked">
              <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-accent/5" aria-hidden />}>
                <BreathworkOrb
                  weatherState={activeWeather}
                  currentTheme={currentTheme}
                  onCyclesComplete={handleBreathComplete}
                />
              </Suspense>
            </section>

            <section aria-label="The Fascia record" className="hw-station-linked">
              <Suspense fallback={<div className="h-32 w-full animate-pulse rounded-xl bg-accent/5" aria-hidden />}>
                <TheFascia currentTheme={currentTheme} />
              </Suspense>
              <PatternViewPanel currentTheme={currentTheme} />
            </section>
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

export default function SomaticTabView(props: Props) {
  return (
    <StationJourneyProvider>
      <SomaticTabBody {...props} />
    </StationJourneyProvider>
  );
}
