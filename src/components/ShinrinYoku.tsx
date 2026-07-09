import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SHINRIN_YOKU_PROTOCOLS } from '../data';
import { ShinrinYokuProtocol } from '../types';
import { Trees, Check, RefreshCw, Sparkles, Heart } from 'lucide-react';

interface ShinrinYokuProps {
  currentTheme: 'day' | 'night';
}

export default function ShinrinYoku({ currentTheme }: ShinrinYokuProps) {
  // Track completed sessions as a map of protocolId -> boolean array [day1, day2, day3, day4]
  const [completedSessions, setCompletedSessions] = useState<Record<string, boolean[]>>({});
  const [activeAlert, setActiveAlert] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('human_weather_shinrin_yoku');
    if (saved) {
      try {
        setCompletedSessions(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing shinrin-yoku sessions:', e);
      }
    } else {
      // Initialize with 4 progress slots for each protocol
      const initial: Record<string, boolean[]> = {};
      SHINRIN_YOKU_PROTOCOLS.forEach(p => {
        initial[p.id] = Array(4).fill(false);
      });
      setCompletedSessions(initial);
    }
  }, []);

  const saveSessions = (updated: Record<string, boolean[]>) => {
    setCompletedSessions(updated);
    localStorage.setItem('human_weather_shinrin_yoku', JSON.stringify(updated));
  };

  const handleDayToggle = (protocolId: string, index: number) => {
    const current = completedSessions[protocolId] ? [...completedSessions[protocolId]] : Array(4).fill(false);
    const newVal = !current[index];
    current[index] = newVal;
    
    const updated = {
      ...completedSessions,
      [protocolId]: current
    };
    saveSessions(updated);

    if (newVal) {
      // Trigger "the forest is working." alert
      setActiveAlert(true);
      setTimeout(() => {
        setActiveAlert(false);
      }, 3500);
    }
  };

  const handleResetProtocol = (protocolId: string) => {
    const updated = {
      ...completedSessions,
      [protocolId]: Array(4).fill(false)
    };
    saveSessions(updated);
  };

  return (
    <div className={`flex flex-col w-full max-w-4xl mx-auto p-6 rounded-2xl border backdrop-blur-md relative ${
      currentTheme === 'night' 
        ? 'bg-[#1e1c18]/90 border-white/[0.06]' 
        : 'bg-white/90 border-stone-200/60 shadow-sm shadow-stone-900/5'
    }`}
         id="shinrin-yoku-section">
      
      {/* "the forest is working" Alert Overlay */}
      <AnimatePresence>
        {activeAlert && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 pointer-events-none"
          >
            <div className="p-8 rounded-3xl bg-[#1e1c18] border border-[#d4b05a]/40 shadow-[0_0_50px_rgba(196,160,68,0.2)] text-center max-w-sm">
              <Trees className="w-10 h-10 text-accent mx-auto mb-4 animate-bounce" />
              <p className="font-serif text-2xl font-semibold text-accent tracking-wide italic leading-normal">
                "the forest is working."
              </p>
              <p className="hw-meta text-white/50 mt-2">
                Protocol slot recorded
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-6">
        <span className="hw-eyebrow block mb-1">Forest bathing</span>
        <h2 className="font-serif text-2xl text-accent font-medium">Shinrin-Yoku Forest Bathing</h2>
        <p className="hw-caption mt-1">
          Gentle forest bathing rituals designed to slow your pace, ground your attention, and welcome the restorative energy of nature.
        </p>
      </div>

      {/* Protocols Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {SHINRIN_YOKU_PROTOCOLS.map((protocol) => {
          const progress = completedSessions[protocol.id] || Array(4).fill(false);
          const completedCount = progress.filter(Boolean).length;
          
          return (
            <div
              key={protocol.id}
              className={`p-5 rounded-xl border flex flex-col justify-between transition-all duration-300 relative ${
                currentTheme === 'night' 
                  ? 'bg-black/35 border-white/[0.06] hover:bg-white/[0.03]' 
                  : 'bg-stone-100/40 border-stone-200/50 hover:bg-stone-100/60 shadow-sm'
              }`}
              id={`shinrin-card-${protocol.id}`}
            >
              {/* Card Body */}
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col text-left">
                    <span className="hw-meta opacity-40">{protocol.number}</span>
                    <span className="font-serif text-lg font-bold text-accent tracking-wide">{protocol.title}</span>
                  </div>
                  
                  <span className={`hw-meta px-2.5 py-1 rounded ${
                    currentTheme === 'night'
                      ? 'bg-green-950/20 text-green-400 border border-green-500/10'
                      : 'bg-emerald-100/70 text-emerald-800 border border-emerald-300/60 font-semibold'
                  }`}>
                    {protocol.dose}
                  </span>
                </div>

                {/* Statistics Box */}
                <div className="flex items-center gap-2 mb-3 px-3 py-1.5 rounded bg-accent/5 border border-accent/5">
                  <Heart className="w-3.5 h-3.5 text-accent shrink-0 animate-pulse" />
                  <span className="hw-badge text-accent/90 font-medium tracking-tight">
                    {protocol.stats}
                  </span>
                </div>

                <p className={`hw-body mb-4 ${currentTheme === 'night' ? 'text-slate-300' : 'text-slate-700'}`}>
                  {protocol.description}
                </p>

                {/* Biomarker Citation */}
                <div className={`p-3 rounded border hw-body font-mono mb-5 ${
                  currentTheme === 'night' 
                    ? 'border-white/5 bg-black/40 text-slate-400' 
                    : 'border-[#f3efe8] bg-[#f3efe8]/30 text-[#8a6f2e]'
                }`}>
                  <span className="text-accent font-bold block mb-0.5 hw-stat-label">Measurable Biomarkers:</span>
                  {protocol.biomarkers}
                </div>
              </div>

              {/* Progress & Session Tracker Row */}
              <div className="border-t border-accent/10 pt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex flex-col items-start">
                  <span className="hw-meta opacity-40">Session checklist</span>
                  <span className="hw-body-muted text-accent">
                    {completedCount === 4 ? 'Protocol fully integrated' : `${completedCount} of 4 sessions logged`}
                  </span>
                </div>

                {/* Day Slots */}
                <div className="flex items-center gap-1.5">
                  {progress.map((checked, index) => (
                    <motion.button
                      id={`day-checkbox-${protocol.id}-${index}`}
                      key={index}
                      onClick={() => handleDayToggle(protocol.id, index)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                        checked 
                          ? currentTheme === 'night' ? 'bg-[#d4b05a] border-[#d4b05a] text-black shadow-md shadow-[#d4b05a]/10' : 'bg-[#b8956b] border-[#b8956b] text-white shadow-md shadow-[#d4b05a]/10'
                          : currentTheme === 'night' ? 'bg-transparent border-[#d4b05a]/30 text-[#d4b05a]' : 'bg-transparent border-[#d4b05a]/35 text-[#b8956b] hover:border-[#d4b05a]/50'
                      }`}
                      title={`Mark session ${index + 1} completed`}
                    >
                      {checked ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <span className="hw-badge font-medium">{index + 1}</span>
                      )}
                    </motion.button>
                  ))}

                  {completedCount > 0 && (
                    <button
                      id={`reset-shinrin-btn-${protocol.id}`}
                      onClick={() => handleResetProtocol(protocol.id)}
                      className="p-1 text-accent/40 hover:text-accent transition-colors ml-1 cursor-pointer"
                      title="Reset protocol progress"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
