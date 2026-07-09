import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { WeatherState } from '../types';
import { Play, Pause, RefreshCw } from 'lucide-react';
import { useFormingOptional } from '../lib/forming/FormingContext';
import { FORMING_CYCLE_COUNT } from '../lib/forming/types';

interface BreathworkOrbProps {
  weatherState: WeatherState;
  currentTheme: 'day' | 'night';
}

export default function BreathworkOrb({ weatherState, currentTheme }: BreathworkOrbProps) {
  const { inhale, holdIn, exhale, holdOut } = weatherState.breathPattern;
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Hold Out'>('Inhale');
  const [secondsLeft, setSecondsLeft] = useState(inhale);
  const [isPlaying, setIsPlaying] = useState(true);
  const exhaleCycleRef = useRef(0);
  const forming = useFormingOptional();

  useEffect(() => {
    // Reset when state changes
    setPhase('Inhale');
    setSecondsLeft(inhale);
    exhaleCycleRef.current = 0;
  }, [weatherState, inhale]);

  useEffect(() => {
    forming?.onBreathPhase(phase);
  }, [phase, forming]);

  useEffect(() => {
    if (forming?.stillness) setIsPlaying(false);
  }, [forming?.stillness]);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (phase === 'Exhale' && forming?.canForm) {
            forming.onExhaleEnd(exhaleCycleRef.current);
            exhaleCycleRef.current += 1;
            if (exhaleCycleRef.current >= FORMING_CYCLE_COUNT) {
              setIsPlaying(false);
            }
          }

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
      case 'Inhale': return 'rgba(196,160,68,0.75)';
      case 'Hold': return 'rgba(232,204,106,0.9)';
      case 'Exhale': return 'rgba(196,160,68,0.45)';
      case 'Hold Out': return 'rgba(196,160,68,0.3)';
    }
  };

  return (
    <div
      className={`flex flex-col items-center justify-center p-6 rounded-2xl border backdrop-blur-md w-full max-w-md mx-auto ${
      currentTheme === 'night' 
        ? 'bg-[#1e1c18]/90 border-white/[0.06]' 
        : 'bg-white/90 border-stone-200/60 shadow-sm shadow-stone-900/5'
    } ${forming?.stillness ? 'opacity-0 pointer-events-none' : ''}`}
         id="breathwork-guide-orb-container"
         style={{ transform: forming?.scalePunch && forming.scalePunch < 1 ? `scale(${forming.scalePunch})` : undefined }}
    >
      
      {/* Title */}
      <span className="hw-eyebrow mb-1">Breath guide</span>
      <h3 className={`font-serif text-xl md:text-2xl italic mb-8 ${currentTheme === 'night' ? 'text-accent' : 'text-[#2c2824]'}`}>{weatherState.title} Pacing</h3>

      {/* Breathing Canvas Stage */}
      <div className="relative w-72 h-72 flex items-center justify-center mb-8">
        
        {/* Continuous ripple rings — outside orb so they stay visible */}
        {isPlaying && (
          <>
            <motion.div
              className="absolute w-28 h-28 rounded-full border-2 border-accent/35 pointer-events-none"
              style={{ transformOrigin: 'center center' }}
              animate={{ scale: [0.85, 2.2], opacity: [0.55, 0] }}
              transition={{ duration: Math.max(inhale, 3), repeat: Infinity, ease: 'easeOut', repeatDelay: 0 }}
            />
            <motion.div
              className="absolute w-28 h-28 rounded-full border border-accent/25 pointer-events-none"
              style={{ transformOrigin: 'center center' }}
              animate={{ scale: [0.85, 2.5], opacity: [0.35, 0] }}
              transition={{ duration: Math.max(inhale, 3), repeat: Infinity, ease: 'easeOut', delay: Math.max(inhale, 3) / 2 }}
            />
          </>
        )}

        {/* Rotating guide ring */}
        {isPlaying && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            className="absolute w-32 h-32 rounded-full border border-dashed border-accent/45 pointer-events-none"
            style={{ transformOrigin: 'center center' }}
          />
        )}

        {/* The Central Breathing Orb */}
        <motion.div
          animate={{
            scale: currentScale,
            boxShadow: `0 0 50px ${getPhaseColor()}, inset 0 0 20px rgba(255,255,255,0.4)`
          }}
          transition={{
            duration: 1.0,
            ease: 'linear'
          }}
          className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-accent/70 to-[#f3efe8] flex flex-col items-center justify-center z-10 text-stone-900 select-none"
        >
          
          <span className="font-serif text-2xl font-bold tracking-tight">
            {secondsLeft}
          </span>
          <span className="hw-meta font-semibold opacity-70">
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
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col"
          >
            <span className="font-serif text-2xl font-medium tracking-wide">
              {phase === 'Hold Out' ? 'Hold' : phase}
            </span>
            <span className="hw-meta">
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
              exhaleCycleRef.current = 0;
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
            <div className="hw-stat-value">{inhale}s</div>
            <div className="hw-stat-label">Inhale</div>
          </div>
          <div>
            <div className="hw-stat-value">{exhale}s</div>
            <div className="hw-stat-label">Exhale</div>
          </div>
          <div>
            <div className="hw-stat-value">{weatherState.respiratoryRatio}</div>
            <div className="hw-stat-label">Ratio</div>
          </div>
          <div>
            <div className="hw-stat-value">{weatherState.hrv}%</div>
            <div className="hw-stat-label">Coherence</div>
          </div>
        </div>
      </div>
    </div>
  );
}
