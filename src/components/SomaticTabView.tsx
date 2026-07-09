import React from 'react';
import { motion } from 'motion/react';
import SomaticGrid from './SomaticGrid';
import TheFascia from './TheFascia';
import FormingCaptureOverlay from './FormingCaptureOverlay';
import { FormingProvider, useFormingOptional } from '../lib/forming/FormingContext';
import type { WeatherState } from '../types';
import { Suspense, lazy } from 'react';

const BreathworkOrb = lazy(() => import('./BreathworkOrb'));

type Props = {
  currentTheme: 'day' | 'night';
  motionReady: boolean;
  activeWeather: WeatherState;
  themeStyles: { border: string; cardBg: string };
  isNight: boolean;
  onStateChange: (state: WeatherState, coords: [number, number][]) => void;
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
  onStateChange,
}: Props) {
  const conditionsSummary = `${activeWeather.clinicalIndex} · HRV ${activeWeather.hrv}%`;

  return (
    <FormingProvider
      weather={activeWeather}
      conditionsSummary={conditionsSummary}
      active
    >
      <FormingCaptureOverlay currentTheme={currentTheme} />
      <SomaticScaleWrap>
        <motion.div
          initial={motionReady ? { opacity: 0, y: 12 } : false}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start"
        >
          <div className="lg:col-span-5 flex flex-col items-center">
            <SomaticGrid onStateChange={onStateChange} currentTheme={currentTheme} />
            <TheFascia currentTheme={currentTheme} />
          </div>

          <div className="lg:col-span-7 flex flex-col gap-10 w-full">
            <div
              className={`p-8 md:p-10 rounded-2xl border ${themeStyles.border} ${themeStyles.cardBg}`}
              id="weather-reading-card"
            >
              <span className="font-mono text-xs uppercase tracking-widest opacity-40 block mb-4">
                Real-time somatic reading
              </span>

              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <h2
                  className={`font-serif text-2xl md:text-3xl font-medium tracking-tight leading-snug ${isNight ? 'text-accent' : 'text-[#2c2824]'}`}
                >
                  {activeWeather.title}
                </h2>
                <div className="flex items-center gap-1.5 font-mono text-xs shrink-0">
                  <span className="opacity-60 uppercase">HRV Coherence:</span>
                  <strong className={isNight ? 'text-accent' : 'text-[#2c2824]'}>{activeWeather.hrv}%</strong>
                </div>
              </div>

              <h4 className="font-sans text-base md:text-lg italic opacity-80 mb-5 border-b border-accent/10 pb-4 leading-relaxed">
                {activeWeather.subtitle}
              </h4>

              <p className="font-sans text-base md:text-lg leading-[1.75] mb-8 max-w-prose">
                {activeWeather.description}
              </p>

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
                  Physical guidance
                </span>
                &ldquo;{activeWeather.guidanceText}&rdquo;
              </div>

              <div className="grid grid-cols-2 gap-6 border-t border-accent/10 pt-6 text-left">
                <div>
                  <span className="font-mono text-xs uppercase tracking-widest opacity-40 block mb-1">Clinical Index</span>
                  <span className="font-mono text-sm opacity-80">{activeWeather.clinicalIndex}</span>
                </div>
                <div>
                  <span className="font-mono text-xs uppercase tracking-widest opacity-40 block mb-1">Respiratory Ratio</span>
                  <span className="font-mono text-sm opacity-80">{activeWeather.respiratoryRatio} (Inhale:Exhale)</span>
                </div>
              </div>
            </div>

            <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-accent/5" aria-hidden />}>
              <BreathworkOrb weatherState={activeWeather} currentTheme={currentTheme} />
            </Suspense>
          </div>
        </motion.div>
      </SomaticScaleWrap>
    </FormingProvider>
  );
}
