import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import MountainBackground from './components/MountainBackground';
import TabSkeleton from './components/TabSkeleton';
import TabErrorBoundary from './components/TabErrorBoundary';
import { DEFAULT_WEATHER } from './data/defaultWeather';
import { WeatherState } from './types';
import { getThemeStyles } from './lib/theme';
import { stopAllAudio } from './lib/stopAllAudio';
import type { WhereAreWeResult } from './lib/whereAreWe';
import { runWhenIdle } from './lib/deferredWork';
import { primeSpeechEngine, warmSpeechVoicesFromGesture } from './lib/stationSpeech';
import { EntitlementProvider } from './lib/EntitlementContext';
import BootSplashFallback, { dismissBootSplash } from './components/BootSplashFallback';
import MembershipButton from './components/MembershipButton';

const SunIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-accent" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-accent fill-current" aria-hidden>
    <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z" />
  </svg>
);

const SomaticTabView = lazy(() => import('./components/SomaticTabView'));
const FrequencyTherapy = lazy(() => import('./components/FrequencyTherapy'));
const LightTherapy = lazy(() => import('./components/LightTherapy'));
const ClassicalMusic = lazy(() => import('./components/ClassicalMusic'));
const SolarRay = lazy(() => import('./components/SolarRay'));
const ShinrinYoku = lazy(() => import('./components/ShinrinYoku'));
const TheTender = lazy(() => import('./components/TheTender'));

/** Prefetch tab chunks after navigation — never on initial paint. */
function prefetchTabWhenIdle(tab: 'therapy' | 'rhythms' | 'tender') {
  const run = () => {
    if (tab === 'therapy') {
      void import('./components/FrequencyTherapy');
      void import('./components/LightTherapy');
      void import('./components/ClassicalMusic');
    } else if (tab === 'rhythms') {
      void import('./components/SolarRay');
      void import('./components/ShinrinYoku');
    } else {
      void import('./components/TheTender');
    }
  };
  runWhenIdle(run, 4000);
}

const getThemeForNow = (): 'day' | 'night' => {
  const h = new Date().getHours();
  return h >= 6 && h < 18 ? 'day' : 'night';
};

/** Threshold — home section returned to after backgrounding. */
const THRESHOLD_TAB = 'somatic' as const;
type AppTab = 'somatic' | 'therapy' | 'rhythms' | 'tender';

async function resolvePlace(): Promise<WhereAreWeResult> {
  const { whereAreWe } = await import('./lib/whereAreWe');
  return whereAreWe();
}

export default function App() {
  const [currentTheme, setCurrentTheme] = useState<'day' | 'night'>('day');
  const [manualOverride, setManualOverride] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>(THRESHOLD_TAB);
  const [activeWeather, setActiveWeather] = useState<WeatherState>(DEFAULT_WEATHER);
  const [activeCoordinates, setActiveCoordinates] = useState<[number, number][]>([]);
  const [place, setPlace] = useState<WhereAreWeResult | null>(null);

  const refreshPlace = useCallback(() => {
    void resolvePlace().then(setPlace);
  }, []);

  const transitionToTab = useCallback((id: AppTab) => {
    stopAllAudio();
    setActiveTab(id);
  }, []);

  useEffect(() => {
    dismissBootSplash();
  }, []);

  useEffect(() => {
    const prime = () => {
      warmSpeechVoicesFromGesture();
      primeSpeechEngine();
    };
    window.addEventListener('pointerdown', prime, { once: true, passive: true });
    window.addEventListener('touchstart', prime, { once: true, passive: true });
    return () => {
      window.removeEventListener('pointerdown', prime);
      window.removeEventListener('touchstart', prime);
    };
  }, []);

  useEffect(() => {
    runWhenIdle(refreshPlace, 3500);
  }, [refreshPlace]);

  useEffect(() => {
    if (activeTab === THRESHOLD_TAB) return;
    refreshPlace();
  }, [activeTab, refreshPlace]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        stopAllAudio();
        return;
      }
      refreshPlace();
      setActiveTab(THRESHOLD_TAB);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [refreshPlace]);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) ?? '--:--';
  const dateString = currentTime?.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) ?? '---';

  const toggleTheme = () => {
    setManualOverride(true);
    setCurrentTheme(prev => prev === 'night' ? 'day' : 'night');
  };

  useEffect(() => {
    if (manualOverride) return;
    setCurrentTheme(getThemeForNow());
    const id = setInterval(() => setCurrentTheme(getThemeForNow()), 60_000);
    return () => clearInterval(id);
  }, [manualOverride]);

  const handleStateChange = useCallback((state: WeatherState, coords: [number, number][]) => {
    setActiveWeather(state);
    setActiveCoordinates(coords);
  }, []);

  const isNight = currentTheme === 'night';
  const themeStyles = getThemeStyles(currentTheme);

  return (
    <EntitlementProvider>
    <div
      className={`min-h-screen w-full flex flex-col ${themeStyles.bg} ${themeStyles.text} theme-transition relative overflow-x-hidden`}
      id="app-root-container"
      data-active-office={place?.activeOffice ?? 'none'}
      data-office-state={place?.officeState ?? 'none'}
    >
      <MountainBackground theme={currentTheme} />

      <div className="relative z-10 flex flex-col flex-1 w-full max-w-5xl mx-auto px-6 md:px-10 lg:px-12">

        {/* Header */}
        <header className={`w-full py-8 md:py-10 flex items-start sm:items-center justify-between gap-4 border-b ${themeStyles.border}`} id="app-header">
          <div className="flex flex-col text-left max-w-md min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3 w-full mb-3">
              <span className="hw-eyebrow tracking-[0.25em] opacity-40">human weather</span>
              <div className={`flex sm:hidden flex-col items-end shrink-0 ${themeStyles.textMuted}`}>
                <span className="font-mono text-[10px] font-medium tracking-wider leading-none">{timeString}</span>
                <span className="font-mono text-[10px] opacity-45 leading-none mt-1">{dateString}</span>
              </div>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-medium tracking-tight leading-[1.1]">
              Human <span className="italic text-accent">Weather</span>
            </h1>
            <p className="font-sans text-lg md:text-xl italic opacity-70 mt-4 leading-relaxed">
              What is your weather right now?
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <MembershipButton isNight={isNight} themeStyles={themeStyles} currentTheme={currentTheme} />
            <div className={`hidden sm:flex flex-col items-end px-3 border-r ${themeStyles.border}`}>
              <span className="font-mono text-xs font-medium tracking-wider leading-none">{timeString}</span>
              <span className="hw-meta opacity-45 leading-none mt-1">{dateString}</span>
            </div>
            <button
              type="button"
              id="theme-toggle-btn"
              onClick={toggleTheme}
              className={`hw-pressable flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-sans font-medium tracking-wide transition-all cursor-pointer ${themeStyles.border} ${themeStyles.cardBg}`}
            >
              {isNight ? (
                <span className="flex items-center gap-1.5 text-accent">
                  <MoonIcon /> Night
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-accent">
                  <SunIcon /> Day
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Navigation */}
        <nav className="w-full mt-8 md:mt-10" id="app-navigation-bar">
          <div className={`flex flex-wrap gap-1 p-1 rounded-2xl border ${themeStyles.border} ${isNight ? 'bg-black/15' : 'bg-white/50'}`}>
            {([
              ['somatic', 'Field Station'],
              ['therapy', 'Aura & Tones'],
              ['rhythms', 'Circadian'],
              ['tender', 'The Tender'],
            ] as const).map(([id, label]) => (
              <button
                type="button"
                key={id}
                id={`tab-${id}-btn`}
                onClick={() => {
                  if (id === 'tender') void import('./components/TheTender');
                  else if (id !== activeTab && id !== 'somatic') prefetchTabWhenIdle(id);
                  transitionToTab(id);
                }}
                className={`hw-pressable flex-1 min-w-[calc(50%-4px)] sm:min-w-0 px-5 py-3.5 rounded-xl text-sm font-sans font-medium tracking-wide border transition-colors cursor-pointer ${
                  activeTab === id ? themeStyles.tabActive : themeStyles.tabInactive
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* Main views */}
        <main className="flex-1 w-full py-10 md:py-12 min-w-0" id="app-main-view">
            {activeTab === 'somatic' && (
              <Suspense fallback={<BootSplashFallback />}>
                <SomaticTabView
                  currentTheme={currentTheme}
                  activeWeather={activeWeather}
                  themeStyles={themeStyles}
                  isNight={isNight}
                  place={place}
                  onStateChange={handleStateChange}
                  onNavigateTab={transitionToTab}
                />
              </Suspense>
            )}

            {activeTab === 'therapy' && (
              <div
                key="therapy-view"
                className="hw-view-enter flex flex-col gap-8 md:gap-10"
              >
                <Suspense fallback={<TabSkeleton isNight={isNight} />}>
                  <TabErrorBoundary isNight={isNight}>
                    <FrequencyTherapy currentTheme={currentTheme} />
                    <LightTherapy currentTheme={currentTheme} />
                    <ClassicalMusic currentTheme={currentTheme} />
                  </TabErrorBoundary>
                </Suspense>
              </div>
            )}

            {activeTab === 'rhythms' && (
              <div
                key="rhythms-view"
                className="hw-view-enter flex flex-col gap-8 md:gap-10"
              >
                <Suspense fallback={<TabSkeleton isNight={isNight} />}>
                  <TabErrorBoundary isNight={isNight}>
                    <SolarRay currentTheme={currentTheme} isActive={activeTab === 'rhythms'} />
                    <ShinrinYoku currentTheme={currentTheme} />
                  </TabErrorBoundary>
                </Suspense>
              </div>
            )}

            {activeTab === 'tender' && (
              <div
                key="tender-view"
                className="hw-view-enter w-full"
              >
                <Suspense fallback={<TabSkeleton isNight={isNight} />}>
                  <TabErrorBoundary isNight={isNight}>
                    <TheTender currentTheme={currentTheme} />
                  </TabErrorBoundary>
                </Suspense>
              </div>
            )}
        </main>

        {/* Footer */}
        <footer className={`w-full py-10 md:py-12 border-t ${themeStyles.border} mt-6`} id="app-footer">
          <div className="max-w-sm mx-auto text-center mb-8 px-4">
            <p className="font-serif text-base italic opacity-50 mb-1">With gratitude</p>
            <p className="font-serif text-lg md:text-xl italic leading-snug opacity-75">
              Listen to your body's weather with curiosity and care.
            </p>
          </div>

          <div className={`flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-mono tracking-widest uppercase ${themeStyles.textMuted}`}>
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
              <span>Human Weather © 2026 · Weathergram™ Studio</span>
              <span className="opacity-50 mt-1.5 normal-case tracking-normal font-sans text-sm italic">Peer-reviewed clinical somatics system</span>
            </div>
            <div className="flex gap-4 opacity-80">
              <a href="https://humanweather.app" className="hover:text-accent transition-colors">humanweather.app</a>
              <span>·</span>
              <span>@PBWYWORLDWIDE</span>
            </div>
          </div>
        </footer>

      </div>
    </div>
    </EntitlementProvider>
  );
}
