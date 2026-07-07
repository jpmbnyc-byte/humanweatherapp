import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WeatherState } from '../types';
import { Play, Pause, RefreshCw } from 'lucide-react';

interface BreathworkOrbProps {
  weatherState: WeatherState;
  currentTheme: 'day' | 'night';
}

export default function BreathworkOrb({ weatherState, currentTheme }: BreathworkOrbProps) {
  const { inhale, holdIn, exhale, holdOut } = weatherState.breathPattern;
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Hold Out'>('Inhale');
  const [secondsLeft, setSecondsLeft] = useState(inhale);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    // Reset when state changes
    setPhase('Inhale');
    setSecondsLeft(inhale);
  }, [weatherState]);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Transition to next phase
          let nextPhase: typeof phase = 'Inhale';
          let nextDuration = inhale;

          if (phase === 'Inhale') {
            if (holdIn > 0) {
              nextPhase = 'Hold';
              nextDuration = holdIn;
            } else {
              nextPhase = 'Exhale';
              nextDuration = exhale;
            }
          } else if (phase === 'Hold') {
            nextPhase = 'Exhale';
            nextDuration = exhale;
          } else if (phase === 'Exhale') {
            if (holdOut > 0) {
              nextPhase = 'Hold Out';
              nextDuration = holdOut;
            } else {
              nextPhase = 'Inhale';
              nextDuration = inhale;
            }
          } else if (phase === 'Hold Out') {
            nextPhase = 'Inhale';
            nextDuration = inhale;
          }

          setPhase(nextPhase);
          return nextDuration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, isPlaying, inhale, holdIn, exhale, holdOut]);

  // Determine the target scale based on phase
  let currentScale = 1.0;
  if (phase === 'Inhale') {
    // Progressively scale up
    const progress = (inhale - secondsLeft) / inhale;
    currentScale = 1.0 + progress * 1.1; // goes up to 2.1
  } else if (phase === 'Hold') {
    currentScale = 2.1;
  } else if (phase === 'Exhale') {
    // Progressively scale down
    const progress = (exhale - secondsLeft) / exhale;
    currentScale = 2.1 - progress * 1.1; // goes down to 1.0
  } else if (phase === 'Hold Out') {
    currentScale = 1.0;
  }

  // Animation configuration for Framer Motion
  const getPhaseColor = () => {
    switch (phase) {
      case 'Inhale': return 'rgba(140,108,208,0.75)';
      case 'Hold': return 'rgba(147,144,255,0.9)';
      case 'Exhale': return 'rgba(140,108,208,0.45)';
      case 'Hold Out': return 'rgba(140,108,208,0.3)';
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center p-6 rounded-2xl border backdrop-blur-md w-full max-w-md mx-auto ${
      currentTheme === 'night' 
        ? 'bg-[#29105A]/75 border-white/[0.06] backdrop-blur-md' 
        : 'bg-white/80 border-[#CCCAFF]/50 backdrop-blur-md shadow-lg shadow-[#8C6CD0]/10'
    }`}
         id="breathwork-guide-orb-container">
      
      {/* Title */}
      <span className="font-mono text-[10px] tracking-widest uppercase opacity-50 mb-1">COHERENT RESPIRATION GUIDE</span>
      <h3 className="font-serif text-lg text-accent italic mb-8">{weatherState.title} Pacing</h3>

      {/* Breathing Canvas Stage */}
      <div className="relative w-72 h-72 flex items-center justify-center mb-8">
        
        {/* Ambient Pulsing Aura Layer 1 */}
        <AnimatePresence>
          {isPlaying && (
            <motion.div
              key={`ripple-1-${phase}`}
              initial={{ scale: currentScale * 0.8, opacity: 0.3 }}
              animate={{ scale: currentScale * 1.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: phase === 'Inhale' ? inhale : exhale, ease: 'easeOut' }}
              className="absolute w-24 h-24 rounded-full border border-accent/30 pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* Ambient Pulsing Aura Layer 2 (Delayed/Offset) */}
        <AnimatePresence>
          {isPlaying && (
            <motion.div
              key={`ripple-2-${phase}`}
              initial={{ scale: currentScale * 1.0, opacity: 0.15 }}
              animate={{ scale: currentScale * 1.9, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: phase === 'Inhale' ? inhale + 1 : exhale + 1, ease: 'easeOut' }}
              className="absolute w-24 h-24 rounded-full border border-accent/10 pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* The Central Breathing Orb */}
        <motion.div
          animate={{
            scale: currentScale,
            boxShadow: `0 0 50px ${getPhaseColor()}, inset 0 0 20px rgba(255,255,255,0.4)`
          }}
          transition={{
            duration: 1.0, // Smooth transition between tick updates
            ease: 'linear'
          }}
          className="w-24 h-24 rounded-full bg-gradient-to-tr from-accent/80 to-[#CCCAFF]/90 flex flex-col items-center justify-center z-10 text-white select-none"
        >
          {/* Inner particle center */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-2 border border-white/20 rounded-full border-dashed"
          />
          
          <span className="font-serif text-2xl font-bold tracking-tight">
            {secondsLeft}
          </span>
          <span className="font-mono text-[8px] uppercase tracking-widest font-semibold opacity-70">
            sec
          </span>
        </motion.div>
      </div>

      {/* Control Panel */}
      <div className="flex flex-col items-center w-full">
        {/* Phase Label with dynamic typography */}
        <div className="h-10 text-center mb-6">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col"
          >
            <span className="font-serif text-2xl font-medium tracking-wide">
              {phase === 'Hold Out' ? 'Hold' : phase}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-widest opacity-60">
              {phase === 'Inhale' && `Expand Chest (${inhale}s)`}
              {phase === 'Hold' && `Suspend Breath (${holdIn}s)`}
              {phase === 'Exhale' && `Contraction / Release (${exhale}s)`}
              {phase === 'Hold Out' && `Empty Pause (${holdOut}s)`}
            </span>
          </motion.div>
        </div>

        {/* Action Button Row */}
        <div className="flex items-center gap-4">
          {/* Play/Pause Button */}
          <button
            id="toggle-breathwork-btn"
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-12 h-12 rounded-full border border-accent/30 flex items-center justify-center bg-accent/5 text-accent hover:bg-accent/15 transition-all duration-200 cursor-pointer"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          {/* Reset Button */}
          <button
            id="reset-breathwork-btn"
            onClick={() => {
              setPhase('Inhale');
              setSecondsLeft(inhale);
              setIsPlaying(true);
            }}
            className="w-10 h-10 rounded-full border border-accent/20 flex items-center justify-center bg-transparent text-accent/60 hover:text-accent hover:bg-accent/5 transition-all duration-200 cursor-pointer"
            title="Reset Respiration Cycle"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Respiration Pattern Info Bar */}
        <div className="w-full border-t border-accent/10 mt-6 pt-4 flex justify-around text-center">
          <div>
            <div className="font-mono text-xs text-accent font-medium">{inhale}s</div>
            <div className="font-mono text-[8px] uppercase tracking-wider opacity-50">Inhale</div>
          </div>
          <div>
            <div className="font-mono text-xs text-accent font-medium">{exhale}s</div>
            <div className="font-mono text-[8px] uppercase tracking-wider opacity-50">Exhale</div>
          </div>
          <div>
            <div className="font-mono text-xs text-accent font-medium">{weatherState.respiratoryRatio}</div>
            <div className="font-mono text-[8px] uppercase tracking-wider opacity-50">Ratio</div>
          </div>
          <div>
            <div className="font-mono text-xs text-accent font-medium">{weatherState.hrv}%</div>
            <div className="font-mono text-[8px] uppercase tracking-wider opacity-50">Coherence</div>
          </div>
        </div>
      </div>
    </div>
  );
}
