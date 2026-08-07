import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SHINRIN_YOKU_PROTOCOLS } from '../data';
import type { ShinrinYokuProtocol } from '../types';
import {
  Trees,
  Check,
  RefreshCw,
  ChevronLeft,
  ChevronDown,
  Footprints,
  Sparkles,
  X,
} from 'lucide-react';

const STORAGE_KEY = 'human_weather_shinrin_yoku';

type Atmosphere = {
  hero: string;
  glow: string;
  invitation: string;
  sensory: string;
  tagline: string;
};

const ATMOSPHERE: Record<string, Atmosphere> = {
  high_stress: {
    hero: 'from-emerald-950/80 via-[#152318] to-[#0c100e]',
    glow: '#4a7c59',
    tagline: 'Slow the sympathetic storm beneath broadleaf canopy.',
    invitation:
      'Walk until your pace matches the forest floor. Inhale the cool green air between oak and birch — let each exhale carry urgency into the soil.',
    sensory: 'Phytoncide-rich air · dappled shade · unhurried footfall',
  },
  high_blood_pressure: {
    hero: 'from-[#0f1a14] via-[#142820] to-[#0a0f0c]',
    glow: '#3d6b5a',
    tagline: 'Let evergreen resin open the vessels.',
    invitation:
      'Stand among conifers. Breathe the resinous air deeply and slowly — ten counts in, twelve counts out — as if the trees are regulating your pulse.',
    sensory: 'Alpha-pinene scent · vertical stillness · deep green shadow',
  },
  sleep_disruption: {
    hero: 'from-[#1a1520] via-[#12181a] to-[#0e1014]',
    glow: '#6b7d8f',
    tagline: 'Late light through leaves, without stealing the night.',
    invitation:
      'In late afternoon, find komorebi — sunlight sieved through leaves. Walk gently as the day softens; let your eyes rest on moving gold without striving.',
    sensory: 'Filtered amber light · descending birdsong · cooling air',
  },
  immune_support: {
    hero: 'from-[#0f1810] via-[#1a2418] to-[#0a0e08]',
    glow: '#5a7a4a',
    tagline: 'Camp where cedar holds the long exhale.',
    invitation:
      'Give yourself to a multi-day rhythm: wake with mist, move slowly, sleep when the forest darkens. Cedar’s aromatic profile works on immune memory over time.',
    sensory: 'Cedar wood · campfire cool-down · sustained quiet',
  },
  low_mood: {
    hero: 'from-[#141810] via-[#1c2218] to-[#10140e]',
    glow: '#7a8f5a',
    tagline: 'Twenty minutes where soil meets skin.',
    invitation:
      'Sit where earth is visible. Touch soil if you can. Let fractal branches fill your periphery — no goal, only contact with living ground.',
    sensory: 'Soil microbe scent · overhead fractals · unforced stillness',
  },
  blood_sugar: {
    hero: 'from-[#121a14] via-[#182218] to-[#0c100e]',
    glow: '#5f8a62',
    tagline: 'Steady walking where mixed groves meet.',
    invitation:
      'Walk at an even, conversational pace through mixed evergreen and deciduous paths. Let the body metabolize under forest light — no rush, no metrics on the trail.',
    sensory: 'Even foot tempo · mixed canopy · filtered midday light',
  },
};

function loadShinrinSessions(): Record<string, boolean[]> {
  if (typeof window === 'undefined') return {};
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved) as Record<string, boolean[]>;
    } catch {
      /* fall through */
    }
  }
  const initial: Record<string, boolean[]> = {};
  SHINRIN_YOKU_PROTOCOLS.forEach(p => {
    initial[p.id] = Array(4).fill(false);
  });
  return initial;
}

function sessionLabel(index: number): string {
  return ['First visit', 'Second visit', 'Third visit', 'Fourth visit'][index] ?? `Visit ${index + 1}`;
}

interface ShinrinYokuProps {
  currentTheme: 'day' | 'night';
}

export default function ShinrinYoku({ currentTheme }: ShinrinYokuProps) {
  const isNight = currentTheme === 'night';
  const [completedSessions, setCompletedSessions] = useState<Record<string, boolean[]>>(loadShinrinSessions);
  const [activeProtocol, setActiveProtocol] = useState<ShinrinYokuProtocol | null>(null);
  const [activeAlert, setActiveAlert] = useState(false);
  const [showResearch, setShowResearch] = useState(false);

  const saveSessions = (updated: Record<string, boolean[]>) => {
    setCompletedSessions(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleDayToggle = (protocolId: string, index: number) => {
    const current = completedSessions[protocolId] ? [...completedSessions[protocolId]] : Array(4).fill(false);
    const newVal = !current[index];
    current[index] = newVal;

    saveSessions({ ...completedSessions, [protocolId]: current });

    if (newVal) {
      setActiveAlert(true);
      window.setTimeout(() => setActiveAlert(false), 3500);
    }
  };

  const handleResetProtocol = (protocolId: string) => {
    saveSessions({ ...completedSessions, [protocolId]: Array(4).fill(false) });
  };

  const totalVisits = Object.values(completedSessions).reduce(
    (sum, slots) => sum + slots.filter(Boolean).length,
    0,
  );

  const openProtocol = (protocol: ShinrinYokuProtocol) => {
    setShowResearch(false);
    setActiveProtocol(protocol);
  };

  const atmosphere = activeProtocol ? ATMOSPHERE[activeProtocol.id] : null;
  const activeProgress = activeProtocol
    ? completedSessions[activeProtocol.id] || Array(4).fill(false)
    : [];
  const activeCompleted = activeProgress.filter(Boolean).length;

  return (
    <div
      className={`flex flex-col w-full max-w-4xl mx-auto rounded-2xl border backdrop-blur-md relative overflow-hidden ${
        isNight
          ? 'bg-[#1e1c18]/90 border-white/[0.06]'
          : 'bg-white/90 border-stone-200/60 shadow-sm shadow-stone-900/5'
      }`}
      id="shinrin-yoku-section"
    >
      {/* Forest atmosphere — hero layer */}
      <div className="relative px-6 pt-8 pb-6 overflow-hidden">
        <div
          className={`absolute inset-0 bg-gradient-to-b ${
            isNight ? 'from-emerald-950/40 via-transparent to-transparent' : 'from-emerald-100/50 via-transparent to-transparent'
          }`}
          aria-hidden
        />
        <motion.div
          className="absolute -top-8 left-1/4 w-48 h-48 rounded-full blur-3xl opacity-30"
          style={{ background: isNight ? '#2d5a3d' : '#8fbc8f' }}
          animate={{ opacity: [0.2, 0.35, 0.2], scale: [1, 1.08, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden
        />
        <motion.div
          className="absolute top-4 right-0 w-32 h-32 rounded-full blur-2xl opacity-25"
          style={{ background: isNight ? '#c4a044' : '#d4b85a' }}
          animate={{ opacity: [0.15, 0.3, 0.15], x: [0, 12, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden
        />

        <div className="relative z-10">
          <span className="hw-eyebrow block mb-1">Forest bathing</span>
          <h2 className="font-serif text-2xl md:text-3xl text-accent font-medium leading-tight">
            Shinrin-Yoku
          </h2>
          <p className={`font-serif text-base italic mt-2 max-w-prose leading-relaxed ${isNight ? 'text-white/60' : 'text-stone-600'}`}>
            Step off the data grid. Choose a clearing, walk it slowly, and let the forest do its quiet work.
          </p>

          {totalVisits > 0 && (
            <div
              className={`inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full border text-xs font-mono uppercase tracking-widest ${
                isNight ? 'border-accent/25 text-accent/80 bg-accent/5' : 'border-accent/30 text-[#8a6f2e] bg-accent/[0.06]'
              }`}
            >
              <Footprints className="w-3.5 h-3.5" aria-hidden />
              {totalVisits} forest visit{totalVisits === 1 ? '' : 's'} logged
            </div>
          )}
        </div>
      </div>

      {/* Trail markers — scannable, not clinical */}
      <div className="px-6 pb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SHINRIN_YOKU_PROTOCOLS.map(protocol => {
          const progress = completedSessions[protocol.id] || Array(4).fill(false);
          const completedCount = progress.filter(Boolean).length;
          const mood = ATMOSPHERE[protocol.id];

          return (
            <motion.button
              key={protocol.id}
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => openProtocol(protocol)}
              className={`group text-left p-5 rounded-2xl border transition-colors cursor-pointer relative overflow-hidden ${
                isNight
                  ? 'bg-black/30 border-white/[0.06] hover:border-accent/20 hover:bg-white/[0.03]'
                  : 'bg-stone-50/80 border-stone-200/60 hover:border-accent/25 hover:bg-white shadow-sm'
              }`}
              id={`shinrin-card-${protocol.id}`}
            >
              <div
                className="absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-35 transition-opacity"
                style={{ background: mood?.glow ?? '#4a7c59' }}
                aria-hidden
              />

              <div className="relative">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="hw-meta opacity-45">{protocol.number}</span>
                  <span
                    className={`hw-meta px-2 py-0.5 rounded-full shrink-0 ${
                      isNight ? 'bg-white/5 text-white/50' : 'bg-stone-200/60 text-stone-600'
                    }`}
                  >
                    {protocol.dose}
                  </span>
                </div>

                <h3 className="font-serif text-lg text-accent font-medium mb-1.5">{protocol.title}</h3>
                <p className={`font-sans text-sm leading-relaxed mb-4 ${isNight ? 'text-white/55' : 'text-stone-600'}`}>
                  {mood?.tagline ?? protocol.description}
                </p>

                {/* Mini path progress */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {progress.map((done, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          done
                            ? 'bg-accent shadow-[0_0_6px_rgba(196,160,68,0.5)]'
                            : isNight
                              ? 'bg-white/15'
                              : 'bg-stone-300/80'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="hw-meta text-accent/70 group-hover:text-accent transition-colors flex items-center gap-1">
                    Enter clearing
                    <Sparkles className="w-3 h-3 opacity-60" />
                  </span>
                </div>

                {completedCount === 4 && (
                  <p className="hw-meta text-accent/60 mt-2">Protocol integrated</p>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Immersion overlay */}
      <AnimatePresence>
        {activeProtocol && atmosphere && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            className="fixed inset-0 z-50 flex flex-col overflow-y-auto"
            style={{ background: '#080a08' }}
            id="shinrin-immersion-overlay"
          >
            <div className={`absolute inset-0 bg-gradient-to-b ${atmosphere.hero}`} aria-hidden />
            <motion.div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage: `radial-gradient(ellipse 80% 50% at 50% 0%, ${atmosphere.glow}55, transparent 70%)`,
              }}
              animate={{ opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              aria-hidden
            />

            {/* Komorebi light shafts */}
            {[20, 50, 75].map(left => (
              <motion.div
                key={left}
                className="absolute top-0 w-px h-full origin-top opacity-[0.07]"
                style={{
                  left: `${left}%`,
                  background: `linear-gradient(to bottom, ${atmosphere.glow}, transparent 65%)`,
                }}
                animate={{ opacity: [0.04, 0.1, 0.04] }}
                transition={{ duration: 5 + left / 20, repeat: Infinity, ease: 'easeInOut' }}
                aria-hidden
              />
            ))}

            <div className="relative z-10 flex flex-col min-h-full p-6 max-w-lg mx-auto w-full">
              <div className="flex items-center justify-between mb-8">
                <button
                  type="button"
                  onClick={() => setActiveProtocol(null)}
                  className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-white/50 hover:text-accent transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back to grove
                </button>
                <button
                  type="button"
                  onClick={() => setActiveProtocol(null)}
                  className="p-2 rounded-full text-white/40 hover:text-white/70 cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <Trees className="w-8 h-8 text-accent/80 mb-4" aria-hidden />
              <span className="hw-eyebrow text-white/40 mb-1">{activeProtocol.number}</span>
              <h3 className="font-serif text-3xl text-accent leading-tight mb-2">{activeProtocol.title}</h3>
              <p className="font-mono text-[10px] uppercase tracking-widest text-white/40 mb-6">
                {activeProtocol.dose}
              </p>

              <div className="rounded-2xl border border-white/10 bg-black/25 backdrop-blur-sm p-5 mb-6">
                <p className="font-serif text-lg italic text-white/85 leading-relaxed">{atmosphere.invitation}</p>
                <p className="hw-meta text-accent/70 mt-4">{atmosphere.sensory}</p>
              </div>

              {/* Forest path — session tracker */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="hw-eyebrow text-white/45">Your path</span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-accent/80">
                    {activeCompleted === 4 ? 'Complete' : `${activeCompleted} of 4 visits`}
                  </span>
                </div>

                <div className="relative pl-2">
                  <div className="absolute left-[1.15rem] top-3 bottom-3 w-px bg-accent/20" aria-hidden />
                  {activeProgress.map((checked, index) => (
                    <div key={index} className="flex items-start gap-4 mb-4 last:mb-0">
                      <motion.button
                        type="button"
                        id={`day-checkbox-${activeProtocol.id}-${index}`}
                        onClick={() => handleDayToggle(activeProtocol.id, index)}
                        whileTap={{ scale: 0.92 }}
                        className={`relative z-10 w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                          checked
                            ? 'bg-accent border-accent text-[#1a1814]'
                            : 'bg-black/40 border-accent/35 text-accent hover:border-accent/60'
                        }`}
                        title={sessionLabel(index)}
                      >
                        {checked ? <Check className="w-4 h-4 stroke-[3]" /> : <span className="text-xs font-mono">{index + 1}</span>}
                      </motion.button>
                      <button
                        type="button"
                        onClick={() => handleDayToggle(activeProtocol.id, index)}
                        className="text-left pt-1.5 cursor-pointer group"
                      >
                        <span className={`block font-sans text-sm ${checked ? 'text-accent' : 'text-white/70 group-hover:text-white/90'}`}>
                          {sessionLabel(index)}
                        </span>
                        <span className="hw-meta text-white/35">
                          {checked ? 'Visit recorded' : 'Tap when you return from the forest'}
                        </span>
                      </button>
                    </div>
                  ))}
                </div>

                {activeCompleted > 0 && (
                  <button
                    type="button"
                    id={`reset-shinrin-btn-${activeProtocol.id}`}
                    onClick={() => handleResetProtocol(activeProtocol.id)}
                    className="mt-3 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-white/30 hover:text-accent/70 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reset path
                  </button>
                )}
              </div>

              {/* Research footprint — collapsed clinical data */}
              <div className="mt-auto border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={() => setShowResearch(v => !v)}
                  className="w-full flex items-center justify-between py-2 text-left cursor-pointer group"
                  aria-expanded={showResearch}
                >
                  <span className="hw-eyebrow text-white/40 group-hover:text-white/55 transition-colors">
                    Research footprint
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-white/30 transition-transform ${showResearch ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence>
                  {showResearch && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="font-sans text-sm text-white/55 leading-relaxed mt-2 mb-3">
                        {activeProtocol.description}
                      </p>
                      <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-2 mb-6">
                        <p className="hw-badge text-accent font-medium">{activeProtocol.stats}</p>
                        <p className="font-mono text-xs text-white/45 leading-relaxed">{activeProtocol.biomarkers}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Celebration overlay */}
      <AnimatePresence>
        {activeAlert && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 pointer-events-none"
          >
            <div className="p-8 rounded-3xl bg-[#1e1c18] border border-[#d4b05a]/40 shadow-[0_0_50px_rgba(196,160,68,0.2)] text-center max-w-sm">
              <Trees className="w-10 h-10 text-accent mx-auto mb-4 animate-bounce" />
              <p className="font-serif text-2xl font-semibold text-accent tracking-wide italic leading-normal">
                the forest is working.
              </p>
              <p className="hw-meta text-white/50 mt-2">Visit recorded on your path</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
