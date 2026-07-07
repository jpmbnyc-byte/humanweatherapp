import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import SomaticGrid from './components/SomaticGrid';
import BreathworkOrb from './components/BreathworkOrb';
import FrequencyTherapy from './components/FrequencyTherapy';
import LightTherapy from './components/LightTherapy';
import ClassicalMusic from './components/ClassicalMusic';
import ShinrinYoku from './components/ShinrinYoku';
import SolarRay from './components/SolarRay';
import TheTender from './components/TheTender';
import MountainBackground from './components/MountainBackground';
import { WEATHER_STATES } from './data';
import { WeatherState } from './types';
import { getThemeStyles } from './lib/theme';
import { Sun, Moon } from 'lucide-react';

const getThemeForNow = (): 'day' | 'night' => {
  const h = new Date().getHours();
  return h >= 6 && h < 18 ? 'day' : 'night';
};

export default function App() {
  const [currentTheme, setCurrentTheme] = useState<'day' | 'night'>('day');
  const [manualOverride, setManualOverride] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'somatic' | 'therapy' | 'rhythms' | 'tender'>('somatic');
  const [activeWeather, setActiveWeather] = useState<WeatherState>(WEATHER_STATES[5]);
  const [activeCoordinates, setActiveCoordinates] = useState<[number, number][]>([]);

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
    <div className={`min-h-screen w-full flex flex-col ${themeStyles.bg} ${themeStyles.text} theme-transition relative overflow-x-hidden`} id="app-root-container">
      <MountainBackground theme={currentTheme} />

      {/* Header */}
      <header className={`w-full max-w-7xl mx-auto px-6 py-6 md:py-8 flex items-center justify-between border-b ${themeStyles.border} z-10`} id="app-header">
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="font-display text-[9px] tracking-[0.3em] uppercase opacity-45">human weather</span>
            <span className="text-[9px] font-bold text-accent opacity-80">™</span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight uppercase leading-none mt-1">
            HUMAN <span className="font-light italic text-accent">WEATHER</span>
          </h1>
          <p className="font-sans text-xs italic opacity-75 mt-1.5">
            What is your weather right now?
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-display text-[9px] uppercase tracking-widest opacity-40 hidden sm:inline">Visual Shift</span>
          <div className={`hidden sm:flex flex-col items-end px-2 border-r ${themeStyles.border}`}>
            <span className="font-mono text-xs font-medium tracking-wider leading-none">{timeString}</span>
            <span className="font-mono text-[9px] uppercase tracking-widest opacity-50 leading-none mt-0.5">{dateString}</span>
          </div>
          <motion.button
            id="theme-toggle-btn"
            onClick={toggleTheme}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-display font-medium tracking-wider transition-all cursor-pointer ${themeStyles.border} ${themeStyles.cardBg}`}
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

      {/* Navigation — pill tabs */}
      <nav className="w-full max-w-4xl mx-auto px-6 mt-6 md:mt-8 z-10" id="app-navigation-bar">
        <div className={`flex flex-wrap gap-1.5 p-1.5 rounded-full border ${themeStyles.border} ${isNight ? 'bg-black/20' : 'bg-white/30'}`}>
          {([
            ['somatic', 'Somatic Map'],
            ['therapy', 'Aura & Tones'],
            ['rhythms', 'Circadian'],
            ['tender', 'The Tender'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              id={`tab-${id}-btn`}
              onClick={() => setActiveTab(id)}
              className={`flex-1 min-w-[calc(50%-6px)] sm:min-w-0 px-4 py-2.5 rounded-full text-xs font-display font-medium uppercase tracking-wider border transition-all cursor-pointer ${
                activeTab === id ? themeStyles.tabActive : themeStyles.tabInactive
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main views */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 md:py-12 z-10 relative" id="app-main-view">
        <AnimatePresence mode="wait">

          {activeTab === 'somatic' && (
            <motion.div
              key="somatic-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              <div className="lg:col-span-5 flex flex-col items-center">
                <SomaticGrid onStateChange={handleStateChange} currentTheme={currentTheme} />
              </div>

              <div className="lg:col-span-7 flex flex-col gap-6 w-full">
                <div className={`p-6 rounded-3xl border ${themeStyles.border} ${themeStyles.cardBg} backdrop-blur-md relative`}
                     id="weather-reading-card">

                  <span className="font-display text-[9px] uppercase tracking-widest opacity-50 block mb-1">
                    02 — Real-time somatic reading
                  </span>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <h2 className="font-display text-2xl font-semibold text-accent tracking-tight">
                      {activeWeather.title}
                    </h2>
                    <div className="flex items-center gap-1.5 font-mono text-[10px]">
                      <span className="opacity-60 uppercase">HRV Coherence:</span>
                      <strong className="text-accent">{activeWeather.hrv}%</strong>
                    </div>
                  </div>

                  <h4 className="font-sans text-xs italic opacity-90 mb-3 border-b border-accent/10 pb-2">
                    {activeWeather.subtitle}
                  </h4>

                  <p className="font-sans text-sm leading-relaxed mb-4">
                    {activeWeather.description}
                  </p>

                  <div className="p-3.5 rounded-2xl border border-accent/10 bg-black/20 font-sans text-xs italic text-accent/80 mb-5 leading-relaxed">
                    <span className="font-display text-[9px] uppercase tracking-widest not-italic font-bold text-accent block mb-1">
                      Physical Guidance text:
                    </span>
                    "{activeWeather.guidanceText}"
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-accent/10 pt-4 text-left">
                    <div>
                      <span className="font-mono text-[9px] uppercase tracking-widest opacity-40 block">Clinical Index</span>
                      <span className="font-mono text-[10px] opacity-80">{activeWeather.clinicalIndex}</span>
                    </div>
                    <div>
                      <span className="font-mono text-[9px] uppercase tracking-widest opacity-40 block">Respiratory Ratio</span>
                      <span className="font-mono text-[10px] opacity-80">{activeWeather.respiratoryRatio} (Inhale:Exhale)</span>
                    </div>
                  </div>
                </div>

                <BreathworkOrb weatherState={activeWeather} currentTheme={currentTheme} />
              </div>
            </motion.div>
          )}

          {activeTab === 'therapy' && (
            <motion.div
              key="therapy-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col gap-8"
            >
              <FrequencyTherapy currentTheme={currentTheme} />
              <LightTherapy currentTheme={currentTheme} />
              <ClassicalMusic currentTheme={currentTheme} />
            </motion.div>
          )}

          {activeTab === 'rhythms' && (
            <motion.div
              key="rhythms-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col gap-8"
            >
              <SolarRay currentTheme={currentTheme} />
              <ShinrinYoku currentTheme={currentTheme} />
            </motion.div>
          )}

          {activeTab === 'tender' && (
            <motion.div
              key="tender-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="w-full"
            >
              <TheTender currentTheme={currentTheme} />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className={`w-full max-w-7xl mx-auto px-6 py-8 border-t ${themeStyles.border} mt-12 flex flex-col sm:flex-row justify-between items-center text-[10px] font-display tracking-widest uppercase ${themeStyles.textMuted} z-10`} id="app-footer">
        <div className="flex flex-col items-center sm:items-start">
          <span>HUMAN WEATHER © 2026 · WEATHERGRAM™ STUDIO</span>
          <span className="opacity-50 mt-1">PEER-REVIEWED CLINICAL SOMATICS SYSTEM</span>
        </div>
        <div className="flex gap-4 mt-4 sm:mt-0 opacity-80">
          <a href="https://humanweather.app" className="hover:text-accent transition-colors">humanweather.app</a>
          <span>·</span>
          <span>@PBWYWORLDWIDE</span>
        </div>
      </footer>
    </div>
  );
}
