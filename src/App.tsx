import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import SomaticTabView from './components/SomaticTabView';
import MountainBackground from './components/MountainBackground';
import TabSkeleton from './components/TabSkeleton';
import TabErrorBoundary from './components/TabErrorBoundary';
import { WEATHER_STATES } from './data/somatic';
import { WeatherState } from './types';
import { getThemeStyles } from './lib/theme';
import { stopAllAudio } from './lib/stopAllAudio';
import { whereAreWe, type WhereAreWeResult } from './lib/whereAreWe';
import { EntitlementProvider } from './lib/EntitlementContext';
import { Sun, Moon } from 'lucide-react';

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
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(run, { timeout: 4000 });
  } else {
    setTimeout(run, 800);
  }
}

const getThemeForNow = (): 'day' | 'night' => {
  const h = new Date().getHours();
  return h >= 6 && h < 18 ? 'day' : 'night';
};

/** Threshold — home section returned to after backgrounding. */
const THRESHOLD_TAB = 'somatic' as const;
type AppTab = 'somatic' | 'therapy' | 'rhythms' | 'tender';

export default function App() {
  const [currentTheme, setCurrentTheme] = useState<'day' | 'night'>('day');
  const [manualOverride, setManualOverride] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>(THRESHOLD_TAB);
  const [activeWeather, setActiveWeather] = useState<WeatherState>(WEATHER_STATES[5]);
  const [activeCoordinates, setActiveCoordinates] = useState<[number, number][]>([]);
  const [motionReady, setMotionReady] = useState(false);
  const [place, setPlace] = useState<WhereAreWeResult | null>(null);

  const refreshPlace = useCallback(() => {
    void whereAreWe().then(setPlace);
  }, []);

  const transitionToTab = useCallback((id: AppTab) => {
    stopAllAudio();
    setActiveTab(id);
  }, []);

  useEffect(() => {
    setMotionReady(true);
  }, []);

  useEffect(() => {
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
        <header className={`w-full py-8 md:py-10 flex items-center justify-between border-b ${themeStyles.border}`} id="app-header">
          <div className="flex flex-col text-left max-w-md">
            <span className="hw-eyebrow tracking-[0.25em] opacity-40 mb-3">human weather</span>
            <h1 className="font-serif text-4xl md:text-5xl font-medium tracking-tight leading-[1.1]">
              Human <span className="italic text-accent">Weather</span>
            </h1>
            <p className="font-sans text-lg md:text-xl italic opacity-70 mt-4 leading-relaxed">
              What is your weather right now?
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className={`hidden sm:flex flex-col items-end px-3 border-r ${themeStyles.border}`}>
              <span className="font-mono text-xs font-medium tracking-wider leading-none">{timeString}</span>
              <span className="hw-meta opacity-45 leading-none mt-1">{dateString}</span>
            </div>
            <motion.button
              id="theme-toggle-btn"
              onClick={toggleTheme}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-sans font-medium tracking-wide transition-all cursor-pointer ${themeStyles.border} ${themeStyles.cardBg}`}
            >
              {isNight ? (
                <span className="flex items-center gap-1.5 text-accent">
                  <Moon className="w-3.5 h-3.5 text-accent fill-current" /> Night
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-accent">
                  <Sun className="w-3.5 h-3.5 text-accent" /> Day
                </span>
              )}
            </motion.button>
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
              <motion.button
                key={id}
                id={`tab-${id}-btn`}
                onClick={() => {
                  if (id === 'tender') void import('./components/TheTender');
                  else if (id !== activeTab && id !== 'somatic') prefetchTabWhenIdle(id);
                  transitionToTab(id);
                }}
                whileTap={{ scale: 0.98 }}
                layout
                className={`flex-1 min-w-[calc(50%-4px)] sm:min-w-0 px-5 py-3.5 rounded-xl text-sm font-sans font-medium tracking-wide border transition-colors cursor-pointer ${
                  activeTab === id ? themeStyles.tabActive : themeStyles.tabInactive
                }`}
              >
                {label}
              </motion.button>
            ))}
          </div>
        </nav>

        {/* Main views */}
        <main className="flex-1 w-full py-10 md:py-12" id="app-main-view">
          <AnimatePresence mode="wait">

            {activeTab === 'somatic' && (
              <SomaticTabView
                key="somatic-view"
                currentTheme={currentTheme}
                motionReady={motionReady}
                activeWeather={activeWeather}
                themeStyles={themeStyles}
                isNight={isNight}
                place={place}
                onStateChange={handleStateChange}
                onNavigateTab={transitionToTab}
              />
            )}

            {activeTab === 'therapy' && (
              <motion.div
                key="therapy-view"
                initial={motionReady ? { opacity: 0, y: 12 } : false}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="flex flex-col gap-8 md:gap-10"
              >
                <Suspense fallback={<TabSkeleton isNight={isNight} />}>
                  <TabErrorBoundary isNight={isNight}>
                    <FrequencyTherapy currentTheme={currentTheme} />
                    <LightTherapy currentTheme={currentTheme} />
                    <ClassicalMusic currentTheme={currentTheme} />
                  </TabErrorBoundary>
                </Suspense>
              </motion.div>
            )}

            {activeTab === 'rhythms' && (
              <motion.div
                key="rhythms-view"
                initial={motionReady ? { opacity: 0, y: 12 } : false}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="flex flex-col gap-8 md:gap-10"
              >
                <Suspense fallback={<TabSkeleton isNight={isNight} />}>
                  <TabErrorBoundary isNight={isNight}>
                    <SolarRay currentTheme={currentTheme} isActive={activeTab === 'rhythms'} />
                    <ShinrinYoku currentTheme={currentTheme} />
                  </TabErrorBoundary>
                </Suspense>
              </motion.div>
            )}

            {activeTab === 'tender' && (
              <motion.div
                key="tender-view"
                initial={motionReady ? { opacity: 0, y: 12 } : false}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="w-full"
              >
                <Suspense fallback={<TabSkeleton isNight={isNight} />}>
                  <TabErrorBoundary isNight={isNight}>
                    <TheTender currentTheme={currentTheme} />
                  </TabErrorBoundary>
                </Suspense>
              </motion.div>
            )}

          </AnimatePresence>
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
