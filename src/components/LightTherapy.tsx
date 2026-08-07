import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LIGHT_MODES } from '../data';
import { LightMode } from '../types';
import { Sun, Sparkles, X, Eye, HelpCircle } from 'lucide-react';
import { consumePrescriptionFocus } from '../lib/prescriptionFocus';

interface LightTherapyProps {
  currentTheme: 'day' | 'night';
}

export default function LightTherapy({ currentTheme }: LightTherapyProps) {
  const [activeMode, setActiveMode] = useState<LightMode | null>(null);

  useEffect(() => {
    const focus = consumePrescriptionFocus();
    if (!focus?.lightModeId) return;
    const mode = LIGHT_MODES.find(m => m.id === focus.lightModeId);
    if (mode) setActiveMode(mode);
  }, []);

  return (
    <div className={`flex flex-col w-full max-w-4xl mx-auto p-6 rounded-2xl border backdrop-blur-md ${
      currentTheme === 'night' 
        ? 'bg-[#1e1c18]/90 border-white/[0.06]' 
        : 'bg-white/90 border-stone-200/60 shadow-sm shadow-stone-900/5'
    }`}
         id="light-therapy-section">
      
      {/* Header */}
      <div className="mb-6">
        <span className="hw-eyebrow block mb-1">Light therapy</span>
        <h2 className="font-serif text-2xl text-accent font-medium">Light Therapy</h2>
        <p className="hw-caption mt-1">
          Immerse yourself in gentle, full-screen color washes designed to support your natural circadian rhythms and peace of mind.
        </p>
      </div>

      {/* Grid of Light Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {LIGHT_MODES.map((mode) => (
          <motion.div
            key={mode.id}
            whileHover={{ scale: 1.02 }}
            className={`p-5 rounded-xl border flex flex-col justify-between transition-all duration-300 relative overflow-hidden group cursor-pointer ${
              currentTheme === 'night'
                ? 'bg-black/35 border-white/[0.06] hover:bg-white/[0.03]'
                : 'bg-stone-100/40 border-stone-200/50 hover:bg-stone-100/60 shadow-sm'
            }`}
            onClick={() => setActiveMode(mode)}
            id={`light-card-${mode.id}`}
          >
            {/* Soft decorative background glow representing the light mode */}
            <div 
              className="absolute -right-12 -top-12 w-28 h-28 rounded-full blur-3xl opacity-20 transition-all duration-300 group-hover:opacity-40"
              style={{ backgroundColor: mode.hex }}
            />

            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="hw-meta px-2.5 py-0.5 rounded-full border border-accent/15 bg-accent/5 text-accent">
                  {mode.label}
                </span>
                
                {/* Visual indicator of the color */}
                <div 
                  className="w-4 h-4 rounded-full border border-white/20 shadow-md"
                  style={{ backgroundColor: mode.hex }}
                />
              </div>

              <h3 className="font-serif text-lg font-medium text-accent mb-1">{mode.name}</h3>
              <p className="hw-caption mb-3">{mode.description}</p>
              <p className="hw-body-muted border-t border-accent/10 pt-2.5">
                {mode.benefits}
              </p>
            </div>

            <div className="mt-4 pt-3 flex justify-end">
              <button className="text-accent/80 hover:text-accent flex items-center gap-1 hw-body font-mono tracking-wider">
                <Eye className="w-3.5 h-3.5" /> ENTER IMMERSION
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* FULL-SCREEN IMMERSIVE OVERLAY */}
      <AnimatePresence>
        {activeMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 flex flex-col justify-between p-6 select-none cursor-default overflow-hidden"
            style={{ backgroundColor: '#050505' }}
            id="light-immersion-overlay"
          >
            {/* The Pulsing Light Layer */}
            <motion.div
              animate={{
                opacity: [0.55, 0.95, 0.55],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: activeMode.pulseSpeed,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute inset-0 z-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at center, ${activeMode.hex} 0%, rgba(14,13,10,1) 85%)`,
              }}
            />

            {/* Float Particles drift (for deep spatial experience) */}
            <div className="absolute inset-0 z-1 pointer-events-none opacity-30">
              <div className="absolute w-1 h-1 rounded-full bg-white/40 top-1/4 left-1/3 animate-pulse" />
              <div className="absolute w-1.5 h-1.5 rounded-full bg-white/30 top-1/2 left-2/3 animate-pulse" style={{ animationDelay: '1s' }} />
              <div className="absolute w-0.5 h-0.5 rounded-full bg-white/50 top-3/4 left-1/4 animate-pulse" style={{ animationDelay: '2s' }} />
              <div className="absolute w-2 h-2 rounded-full bg-white/20 top-1/3 left-3/4 animate-pulse" style={{ animationDelay: '1.5s' }} />
            </div>

            {/* IMMERSION TOP BAR */}
            <div className="flex items-center justify-between z-10 w-full max-w-5xl mx-auto">
              <div className="flex flex-col text-left">
                <span className="hw-meta text-white/50">{activeMode.label} mode active</span>
                <span className="font-serif text-xl font-medium text-white tracking-wide">{activeMode.name}</span>
              </div>

              {/* Dismiss button */}
              <button
                id="close-light-immersion-btn"
                onClick={() => setActiveMode(null)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/20 transition-all cursor-pointer"
                title="Exit Immersion"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* IMMERSION CENTER: PULSING RESPIRATORY GUIDE */}
            <div className="flex flex-col items-center justify-center z-10 my-auto text-center">
              <motion.div
                animate={{
                  scale: [1.0, 1.9, 1.0],
                }}
                transition={{
                  duration: activeMode.pulseSpeed,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="w-32 h-32 rounded-full border border-white/30 flex flex-col items-center justify-center relative mb-12 shadow-[0_0_80px_rgba(255,255,255,0.15)]"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                }}
              >
                {/* Secondary expanding ripple */}
                <motion.div
                  animate={{
                    scale: [1.0, 2.5, 1.0],
                    opacity: [0.5, 0, 0.5]
                  }}
                  transition={{
                    duration: activeMode.pulseSpeed,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="absolute inset-0 rounded-full border border-white/10 pointer-events-none"
                />
                
                <span className="hw-badge text-white/80 font-semibold">
                  BREATHE
                </span>
              </motion.div>

              <div className="max-w-md px-6">
                <h4 className="font-serif text-lg italic text-white/95 mb-3">
                  "{activeMode.description}"
                </h4>
                <p className="font-serif text-xs text-white/75 leading-relaxed">
                  Position the screen 12-18 inches from your eyes in a darkened room. Breathe in sync with the expanding rings. Allow the wavelengths to entrain your neural circuits.
                </p>
              </div>
            </div>

            {/* IMMERSION FOOTER */}
            <div className="z-10 w-full max-w-5xl mx-auto text-center border-t border-white/10 pt-4 flex flex-col sm:flex-row justify-between items-center text-white/50 hw-footnote">
              <span>HUMAN WEATHER CHROMATHERAPY ENGINE</span>
              <span className="mt-1 sm:mt-0">{activeMode.pulseSpeed}S CYCLE · BIOLOGICAL RESONANCE</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
