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
import { WEATHER_STATES } from './data';
import { WeatherState } from './types';
import { Sun, Moon, Compass, Sparkles, Headphones, Eye, BookOpen, AlertCircle, RefreshCw } from 'lucide-react';

const getThemeForNow = (): 'day' | 'night' => {
  const h = new Date().getHours();
  return h >= 6 && h < 18 ? 'day' : 'night';
};

export default function App() {
  const [currentTheme, setCurrentTheme] = useState<'day' | 'night'>('day'); // Default day; client check updates if night
  const [manualOverride, setManualOverride] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null); // null on server to avoid hydration mismatch
  const [activeTab, setActiveTab] = useState<'somatic' | 'therapy' | 'rhythms' | 'tender'>('somatic');
  const [activeWeather, setActiveWeather] = useState<WeatherState>(WEATHER_STATES[5]); // Default: Autonomic Stillness
  const [activeCoordinates, setActiveCoordinates] = useState<[number, number][]>([]);

  // Client-side: sync theme to local time and start live clock
  useEffect(() => {
    setCurrentTheme(getThemeForNow());
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) ?? '--:--';
  const dateString = currentTime?.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) ?? '---';


  // Smooth theme toggle shifts
  const toggleTheme = () => {
    setManualOverride(true);
    setCurrentTheme(prev => prev === 'night' ? 'day' : 'night');
  };

  // Auto follow time of day unless the user has manually toggled
  useEffect(() => {
    if (manualOverride) return;
    setCurrentTheme(getThemeForNow());
    const id = setInterval(() => setCurrentTheme(getThemeForNow()), 60_000);
    return () => clearInterval(id);
  }, [manualOverride]);

  // Handle grid updates
  const handleStateChange = useCallback((state: WeatherState, coords: [number, number][]) => {
    setActiveWeather(state);
    setActiveCoordinates(coords);
  }, []);

  // Theme styling definitions
  const isNight = currentTheme === 'night';
  const themeStyles = {
    bg: isNight 
      ? 'bg-gradient-to-b from-[#050505] via-[#0c0c0e] to-[#020202]' 
      : 'bg-gradient-to-b from-[#7dd3fc] via-[#f0f9ff] to-[#fef08a]/30',
    text: isNight ? 'text-[#f1f5f9]' : 'text-[#0f172a]',
    textMuted: isNight ? 'text-[#94a3b8]' : 'text-[#475569]',
    gold: isNight ? 'text-[#eab308]' : 'text-[#d97706]',
    border: isNight ? 'border-white/[0.08]' : 'border-sky-300/40',
    cardBg: isNight ? 'bg-[#121214]/80 border-white/[0.06] backdrop-blur-md' : 'bg-white/75 border-white/40 backdrop-blur-md shadow-lg shadow-sky-100/30',
    tabActive: isNight ? 'bg-[#eab308] text-black border-[#eab308]' : 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 border-amber-300 shadow-md shadow-amber-500/10 font-medium',
    tabInactive: isNight ? 'bg-black/25 hover:bg-[#eab308]/5 text-gray-400 border-transparent' : 'bg-sky-100/40 hover:bg-white text-sky-950 border-transparent',
  };

  return (
    <div className={`min-h-screen w-full flex flex-col ${themeStyles.bg} ${themeStyles.text} theme-transition relative overflow-x-hidden`} id="app-root-container">
      
      {/* Immersive Atmospheric Ambient Glow backing (Golden sun-colored ambience shining through) */}
      <div 
        className="fixed top-[-50px] right-[10%] w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none z-0 transition-all duration-700"
        style={{
          transform: 'translateZ(0)',
          willChange: 'opacity',
          background: isNight 
            ? 'radial-gradient(circle, rgba(234,179,8,0.04) 0%, rgba(5,5,5,0) 70%)' 
            : 'radial-gradient(circle, rgba(253,224,71,0.6) 0%, rgba(245,158,11,0.3) 40%, rgba(186,230,253,0) 75%)'
        }}
      />
      
      {!isNight && (
        <div 
          className="fixed bottom-[-100px] left-[-50px] w-[450px] h-[450px] rounded-full blur-[130px] pointer-events-none z-0 animate-pulse"
          style={{
            transform: 'translateZ(0)',
            willChange: 'opacity',
            background: 'radial-gradient(circle, rgba(253,224,71,0.35) 0%, rgba(251,191,36,0.1) 50%, rgba(186,230,253,0) 80%)',
            animationDuration: '10s'
          }}
        />
      )}

      {/* LUXURY HEADER PANEL */}
      <header className={`w-full max-w-7xl mx-auto px-6 py-6 md:py-8 flex items-center justify-between border-b ${themeStyles.border} z-10`} id="app-header">
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[9px] tracking-[0.3em] uppercase opacity-45">human weather</span>
            <span className="text-[9px] font-bold text-gold opacity-80">™</span>
          </div>
          <h1 className="font-serif text-2xl md:text-3.5xl font-semibold tracking-tight uppercase leading-none mt-1">
            HUMAN <span className="font-light italic text-gold">WEATHER</span>
          </h1>
          <p className="font-serif text-xs italic opacity-75 mt-1.5">
            What is your weather right now?
          </p>
        </div>

        {/* Day / Night visual shift toggle */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-widest opacity-40 hidden sm:inline">Visual Shift</span>
          <div className={`hidden sm:flex flex-col items-end px-2 border-r ${themeStyles.border}`}>
            <span className="font-mono text-xs font-medium tracking-wider leading-none">{timeString}</span>
            <span className="font-mono text-[9px] uppercase tracking-widest opacity-50 leading-none mt-0.5">{dateString}</span>
          </div>
          <motion.button
            id="theme-toggle-btn"
            onClick={toggleTheme}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-mono tracking-wider transition-all cursor-pointer ${themeStyles.border} ${themeStyles.cardBg}`}
          >
            <span>/</span>
            {isNight ? (
              <span className="flex items-center gap-1.5 text-[#eab308]">
                <Moon className="w-3 h-3 text-[#eab308] fill-current" /> NIGHT
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[#d97706]">
                <Sun className="w-3 h-3 text-[#d97706]" /> DAY
              </span>
            )}
          </motion.button>
        </div>
      </header>

      {/* COMPACT NAVIGATION TABS */}
      <nav className="w-full max-w-4xl mx-auto px-6 mt-6 md:mt-8 z-10" id="app-navigation-bar">
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 rounded-2xl border ${themeStyles.border} bg-black/5`}>
          
          {/* Tab 1: Somatic & Breath */}
          <button
            id="tab-somatic-btn"
            onClick={() => setActiveTab('somatic')}
            className={`px-3 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider border transition-all cursor-pointer ${
              activeTab === 'somatic' ? themeStyles.tabActive : themeStyles.tabInactive
            }`}
          >
            Somatic Map
          </button>

          {/* Tab 2: Audio & Light */}
          <button
            id="tab-therapy-btn"
            onClick={() => setActiveTab('therapy')}
            className={`px-3 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider border transition-all cursor-pointer ${
              activeTab === 'therapy' ? themeStyles.tabActive : themeStyles.tabInactive
            }`}
          >
            Aura & Tones
          </button>

          {/* Tab 3: Nature & Sun */}
          <button
            id="tab-rhythms-btn"
            onClick={() => setActiveTab('rhythms')}
            className={`px-3 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider border transition-all cursor-pointer ${
              activeTab === 'rhythms' ? themeStyles.tabActive : themeStyles.tabInactive
            }`}
          >
            Circadian
          </button>

          {/* Tab 4: The Tender Voice */}
          <button
            id="tab-tender-btn"
            onClick={() => setActiveTab('tender')}
            className={`px-3 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider border transition-all cursor-pointer ${
              activeTab === 'tender' ? themeStyles.tabActive : themeStyles.tabInactive
            }`}
          >
            The Tender
          </button>

        </div>
      </nav>

      {/* PRIMARY VIEWS SWITCHER WITH TRANSITIONS */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 md:py-12 z-10 relative" id="app-main-view">
        <AnimatePresence mode="wait">
          
          {/* VIEW A: SOMATIC MAPPING & BREATHING */}
          {activeTab === 'somatic' && (
            <motion.div
              key="somatic-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              {/* Col Left (Somatic mapping grid) */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <SomaticGrid onStateChange={handleStateChange} currentTheme={currentTheme} />
              </div>

              {/* Col Right (Spatial climate analysis & Breathwork orb) */}
              <div className="lg:col-span-7 flex flex-col gap-6 w-full">
                {/* Real-time spatial pattern analysis Card */}
                <div className={`p-6 rounded-2xl border ${themeStyles.border} ${themeStyles.cardBg} backdrop-blur-md relative`}
                     id="weather-reading-card">
                  
                  <span className="font-mono text-[9px] uppercase tracking-widest opacity-50 block mb-1">
                    02 — Real-time somatic reading
                  </span>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <h2 className="font-serif text-2xl font-semibold text-gold tracking-tight">
                      {activeWeather.title}
                    </h2>
                    
                    {/* HRV Score indicator */}
                    <div className="flex items-center gap-1.5 font-mono text-[10px]">
                      <span className="opacity-60 uppercase">HRV Coherence:</span>
                      <strong className="text-gold">{activeWeather.hrv}%</strong>
                    </div>
                  </div>

                  {/* Subtitle */}
                  <h4 className="font-serif text-xs italic opacity-90 mb-3 border-b pb-2" style={{ borderColor: 'rgba(196,168,74,0.1)' }}>
                    {activeWeather.subtitle}
                  </h4>

                  {/* Description / Clinical Index */}
                  <p className="font-serif text-sm leading-relaxed mb-4">
                    {activeWeather.description}
                  </p>

                  <div className="p-3.5 rounded-lg border border-gold/10 bg-black/30 font-serif text-xs italic text-gold/80 mb-5 leading-relaxed">
                    <span className="font-mono text-[9px] uppercase tracking-widest not-italic font-bold text-gold block mb-1">
                      Physical Guidance text:
                    </span>
                    "{activeWeather.guidanceText}"
                  </div>

                  {/* Metadata Indicators bar */}
                  <div className="grid grid-cols-2 gap-4 border-t pt-4 text-left" style={{ borderColor: 'rgba(196,168,74,0.1)' }}>
                    <div>
                      <span className="font-mono text-[9px] uppercase tracking-widest opacity-40 block">Clinical Index</span>
                      <span className="font-mono text-[10px] text-white/80">{activeWeather.clinicalIndex}</span>
                    </div>
                    <div>
                      <span className="font-mono text-[9px] uppercase tracking-widest opacity-40 block">Respiratory Ratio</span>
                      <span className="font-mono text-[10px] text-white/80">{activeWeather.respiratoryRatio} (Inhale:Exhale)</span>
                    </div>
                  </div>

                </div>

                {/* Respiration Breathing orb */}
                <BreathworkOrb weatherState={activeWeather} currentTheme={currentTheme} />
              </div>
            </motion.div>
          )}

          {/* VIEW B: SOUNDS, LIGHTS, CLASSICAL CHORDS */}
          {activeTab === 'therapy' && (
            <motion.div
              key="therapy-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col gap-8"
            >
              {/* Frequency therapy panel */}
              <FrequencyTherapy currentTheme={currentTheme} />
              
              {/* Light therapy panel */}
              <LightTherapy currentTheme={currentTheme} />

              {/* Classical pieces immersion */}
              <ClassicalMusic currentTheme={currentTheme} />
            </motion.div>
          )}

          {/* VIEW C: CIRCADIAN SOLAR RAY & SHINRIN YOKU DOSAGES */}
          {activeTab === 'rhythms' && (
            <motion.div
              key="rhythms-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col gap-8"
            >
              {/* Solar Ray location tracker */}
              <SolarRay currentTheme={currentTheme} />

              {/* Shinrin yoku forest bathing prescription engine */}
              <ShinrinYoku currentTheme={currentTheme} />
            </motion.div>
          )}

          {/* VIEW D: THE TENDER PORTAL */}
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

      {/* LUXURY FOOTER BRANDING */}
      <footer className={`w-full max-w-7xl mx-auto px-6 py-8 border-t ${themeStyles.border} mt-12 flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono tracking-widest uppercase ${themeStyles.textMuted} z-10`} id="app-footer">
        <div className="flex flex-col items-center sm:items-start">
          <span>HUMAN WEATHER © 2026 · WEATHERGRAM™ STUDIO</span>
          <span className="opacity-50 mt-1">PEER-REVIEWED CLINICAL SOMATICS SYSTEM</span>
        </div>
        <div className="flex gap-4 mt-4 sm:mt-0 opacity-80">
          <a href="https://humanweather.app" className="hover:text-gold transition-colors">humanweather.app</a>
          <span>·</span>
          <span>@PBWYWORLDWIDE</span>
        </div>
      </footer>
    </div>
  );
}
