import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { PATHWAYS, WEATHER_STATES } from '../data';
import { WeatherState, Pathway } from '../types';
import { Sparkles, Trash2, HelpCircle } from 'lucide-react';

interface SomaticGridProps {
  onStateChange: (state: WeatherState, activeCoordinates: [number, number][]) => void;
  currentTheme: 'day' | 'night';
}

export default function SomaticGrid({ onStateChange, currentTheme }: SomaticGridProps) {
  const [grid, setGrid] = useState<boolean[][]>(
    Array(8).fill(null).map(() => Array(8).fill(false))
  );
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState<boolean>(true); // true to draw, false to erase
  const gridRef = useRef<HTMLDivElement>(null);
  const lastCellRef = useRef<string | null>(null);

  // Classify state based on active grid cells
  useEffect(() => {
    const activeCoords: [number, number][] = [];
    grid.forEach((row, rIdx) => {
      row.forEach((active, cIdx) => {
        if (active) {
          activeCoords.push([rIdx, cIdx]);
        }
      });
    });

    const count = activeCoords.length;

    if (count === 0) {
      const stillnessState = WEATHER_STATES.find(s => s.id === 'autonomic_stillness')!;
      onStateChange(stillnessState, activeCoords);
      return;
    }

    // Compute metrics
    let sumRow = 0;
    activeCoords.forEach(([r]) => {
      sumRow += r;
    });
    const avgRow = sumRow / count; // 0 to 7. Lower = closer to head (top), higher = pelvis (bottom)

    // Compute neighbors for coherence calculation
    let neighborsCount = 0;
    const isNeighbor = (c1: [number, number], c2: [number, number]) => {
      const dr = Math.abs(c1[0] - c2[0]);
      const dc = Math.abs(c1[1] - c2[1]);
      return dr <= 1 && dc <= 1 && !(dr === 0 && dc === 0);
    };

    activeCoords.forEach(c1 => {
      const hasNeighbor = activeCoords.some(c2 => isNeighbor(c1, c2));
      if (hasNeighbor) {
        neighborsCount++;
      }
    });

    const coherenceRatio = neighborsCount / count; // 0 to 1

    let detectedStateId = 'vaporous_resonance_drift'; // default equilibrium

    if (count >= 20) {
      // Very high load
      detectedStateId = 'sympathetic_heat_dome';
    } else if (coherenceRatio < 0.4 && count >= 3) {
      // Fragmented, scattered
      detectedStateId = 'scattered_atmospheric_drift';
    } else if (avgRow <= 2.5 && count >= 3) {
      // High center of gravity (Chest / Head)
      detectedStateId = 'sympathetic_heat_dome';
    } else if (avgRow >= 4.8 && count >= 3) {
      // Low center of gravity (Pelvis / Lower)
      detectedStateId = 'dewpoint_restorative_slumber';
    } else if (coherenceRatio >= 0.7 && count >= 5) {
      // Coherent cluster
      detectedStateId = 'high_resonant_thermal_coherence';
    } else {
      // Stable moderate state
      detectedStateId = 'vaporous_resonance_drift';
    }

    const state = WEATHER_STATES.find(s => s.id === detectedStateId) || WEATHER_STATES[4];
    onStateChange(state, activeCoords);
  }, [grid, onStateChange]);

  const toggleCell = (r: number, c: number, overrideVal?: boolean) => {
    setGrid(prev => {
      const next = prev.map(row => [...row]);
      next[r][c] = overrideVal !== undefined ? overrideVal : !next[r][c];
      return next;
    });
  };

  const handleMouseDown = (r: number, c: number, e: React.MouseEvent) => {
    e.preventDefault();
    const targetVal = !grid[r][c];
    setDrawMode(targetVal);
    setIsDrawing(true);
    toggleCell(r, c, targetVal);
    lastCellRef.current = `${r},${c}`;
  };

  const handleMouseEnterCell = (r: number, c: number) => {
    if (!isDrawing) return;
    const cellKey = `${r},${c}`;
    if (lastCellRef.current === cellKey) return;
    toggleCell(r, c, drawMode);
    lastCellRef.current = cellKey;
  };

  const handleGlobalMouseUp = () => {
    setIsDrawing(false);
    lastCellRef.current = null;
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  // Handle Touch Events for seamless mobile drawing
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!gridRef.current) return;
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!element) return;
    const cellCoords = element.getAttribute('data-cell');
    if (cellCoords) {
      const [r, c] = cellCoords.split(',').map(Number);
      const cellKey = `${r},${c}`;
      if (lastCellRef.current !== cellKey) {
        toggleCell(r, c, drawMode);
        lastCellRef.current = cellKey;
      }
    }
  };

  const handleTouchStart = (r: number, c: number, e: React.TouchEvent) => {
    // Start drawing
    const targetVal = !grid[r][c];
    setDrawMode(targetVal);
    setIsDrawing(true);
    toggleCell(r, c, targetVal);
    lastCellRef.current = `${r},${c}`;
  };

  const loadPathway = (pathway: Pathway) => {
    const nextGrid = Array(8).fill(null).map(() => Array(8).fill(false));
    pathway.cells.forEach(([r, c]) => {
      if (r >= 0 && r < 8 && c >= 0 && c < 8) {
        nextGrid[r][c] = true;
      }
    });
    setGrid(nextGrid);
  };

  const clearGrid = () => {
    setGrid(Array(8).fill(null).map(() => Array(8).fill(false)));
  };

  const activeCount = grid.flat().filter(Boolean).length;

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto" id="somatic-field-section">
      {/* Title & Stats */}
      <div className="w-full flex items-center justify-between mb-2">
        <div className="flex flex-col">
          <span className="font-mono text-[10px] tracking-widest uppercase opacity-50">Somatic Field mapping</span>
          <span className="font-serif text-sm italic">
            {activeCount === 0 ? 'Quiet canvas...' : `${activeCount} active sensations`}
          </span>
        </div>
        
        {/* Reset Button */}
        {activeCount > 0 && (
          <motion.button
            id="clear-grid-btn"
            onClick={clearGrid}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-full border border-red-500/30 text-red-400 bg-red-500/5 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Map
          </motion.button>
        )}
      </div>

      {/* Gentle instruction intro */}
      <p className={`text-[11.5px] font-serif leading-relaxed text-left w-full mb-4 ${currentTheme === 'night' ? 'text-gray-400' : 'text-slate-600'}`}>
        Gently touch, drag, or tap across the grid below to map where you are holding sensation, tension, or quietness in your body right now. High points represent head and chest; low points represent core and pelvis. Every point you map shapes your custom breathing rhythm.
      </p>

      {/* Interactive 8x8 Grid */}
      <div 
        ref={gridRef}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => setIsDrawing(false)}
        className={`grid grid-cols-8 gap-1.5 p-3 rounded-2xl border backdrop-blur-md transition-all duration-300 w-full aspect-square relative ${
          currentTheme === 'night' 
            ? 'bg-[#121214]/80 border-white/[0.08]' 
            : 'bg-white/75 border-sky-300/40 shadow-lg shadow-sky-100/30'
        }`}
        style={{
          touchAction: 'pan-y',
          boxShadow: currentTheme === 'night' 
            ? '0 10px 30px -10px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255,255,255,0.03)' 
            : '0 10px 30px -10px rgba(14, 165, 233, 0.08)'
        }}
      >
        {grid.map((row, rIdx) => 
          row.map((active, cIdx) => {
            const cellKey = `${rIdx},${cIdx}`;
            return (
              <div
                key={cellKey}
                data-cell={cellKey}
                onMouseDown={(e) => handleMouseDown(rIdx, cIdx, e)}
                onMouseEnter={() => handleMouseEnterCell(rIdx, cIdx)}
                onTouchStart={(e) => handleTouchStart(rIdx, cIdx, e)}
                className="relative aspect-square rounded-md cursor-crosshair select-none overflow-hidden transition-all duration-300"
                style={{
                  touchAction: 'pan-y',
                  backgroundColor: active 
                    ? currentTheme === 'night' ? '#eab308' : '#d97706' 
                    : currentTheme === 'night' 
                      ? 'rgba(255,255,255,0.02)' 
                      : 'rgba(14, 165, 233, 0.03)',
                  border: active 
                    ? currentTheme === 'night' ? '1px solid #eab308' : '1px solid #d97706' 
                    : currentTheme === 'night' 
                      ? '1px solid rgba(255,255,255,0.05)' 
                      : '1px solid rgba(14, 165, 233, 0.1)',
                  boxShadow: active 
                    ? currentTheme === 'night'
                      ? '0 0 14px rgba(234,179,8,0.8), inset 0 0 4px rgba(255,255,255,0.4)' 
                      : '0 0 14px rgba(217,119,6,0.6), inset 0 0 4px rgba(255,255,255,0.5)' 
                    : 'none'
                }}
              >
                {/* Subtle internal particle animation for active cells */}
                {active && (
                  <motion.div
                    animate={{
                      opacity: [0.4, 0.8, 0.4],
                      scale: [0.9, 1.1, 0.9],
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                    className="absolute inset-0 bg-white/20 blur-[1px]"
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Guide Pathways Entry points */}
      <div className="w-full mt-6">
        <span className="font-mono text-[9px] tracking-widest uppercase opacity-50 block mb-2.5">
          Or load a guide pathway
        </span>
        <div className="flex flex-wrap gap-1.5 justify-center">
          {PATHWAYS.map((path) => (
            <motion.button
              id={`pathway-btn-${path.id}`}
              key={path.id}
              onClick={() => loadPathway(path)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all duration-200 border cursor-pointer ${
                currentTheme === 'night'
                  ? 'bg-amber-500/5 border-white/[0.08] text-gray-300 hover:text-white hover:bg-amber-500/10'
                  : 'bg-white/60 border-sky-300/40 text-sky-950 hover:bg-white hover:border-sky-300 shadow-sm'
              }`}
              title={path.description}
            >
              {path.name}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
