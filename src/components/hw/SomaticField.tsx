import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WEATHER_STATES } from '../../data';
import { WeatherState } from '../../types';

interface SomaticFieldProps {
  onStateChange: (state: WeatherState, activeCoordinates: [number, number][]) => void;
  wash?: string;
}

export default function SomaticField({ onStateChange, wash = '--hw-dawn' }: SomaticFieldProps) {
  const [grid, setGrid] = useState<boolean[][]>(
    Array(8).fill(null).map(() => Array(8).fill(false)),
  );
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState(true);
  const gridRef = useRef<HTMLDivElement>(null);
  const lastCellRef = useRef<string | null>(null);

  useEffect(() => {
    const activeCoords: [number, number][] = [];
    grid.forEach((row, rIdx) => {
      row.forEach((active, cIdx) => {
        if (active) activeCoords.push([rIdx, cIdx]);
      });
    });

    const count = activeCoords.length;
    if (count === 0) {
      const stillness = WEATHER_STATES.find((s) => s.id === 'autonomic_stillness')!;
      onStateChange(stillness, activeCoords);
      return;
    }

    let sumRow = 0;
    activeCoords.forEach(([r]) => {
      sumRow += r;
    });
    const avgRow = sumRow / count;

    let neighborsCount = 0;
    const isNeighbor = (c1: [number, number], c2: [number, number]) => {
      const dr = Math.abs(c1[0] - c2[0]);
      const dc = Math.abs(c1[1] - c2[1]);
      return dr <= 1 && dc <= 1 && !(dr === 0 && dc === 0);
    };

    activeCoords.forEach((c1) => {
      if (activeCoords.some((c2) => isNeighbor(c1, c2))) neighborsCount++;
    });

    const coherenceRatio = neighborsCount / count;
    let detectedStateId = 'vaporous_resonance_drift';

    if (count >= 20) detectedStateId = 'sympathetic_heat_dome';
    else if (coherenceRatio < 0.4 && count >= 3) detectedStateId = 'scattered_atmospheric_drift';
    else if (avgRow <= 2.5 && count >= 3) detectedStateId = 'sympathetic_heat_dome';
    else if (avgRow >= 4.8 && count >= 3) detectedStateId = 'dewpoint_restorative_slumber';
    else if (coherenceRatio >= 0.7 && count >= 5) detectedStateId = 'high_resonant_thermal_coherence';

    const state = WEATHER_STATES.find((s) => s.id === detectedStateId) || WEATHER_STATES[4];
    onStateChange(state, activeCoords);
  }, [grid, onStateChange]);

  const toggleCell = (r: number, c: number, overrideVal?: boolean) => {
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
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

  const handleTouchStart = (r: number, c: number) => {
    const targetVal = !grid[r][c];
    setDrawMode(targetVal);
    setIsDrawing(true);
    toggleCell(r, c, targetVal);
    lastCellRef.current = `${r},${c}`;
  };

  useEffect(() => {
    const up = () => {
      setIsDrawing(false);
      lastCellRef.current = null;
    };
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  const washColor = `var(${wash})`;

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto">
      <p className="hw-designation mb-6 text-center">The Somatic Field</p>
      <RegistrationBracket>
        <div
          ref={gridRef}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => setIsDrawing(false)}
          className="grid grid-cols-8 gap-1 w-full aspect-square"
          style={{ touchAction: 'none' }}
        >
          {grid.map((row, rIdx) =>
            row.map((active, cIdx) => (
              <div
                key={`${rIdx}-${cIdx}`}
                data-cell={`${rIdx},${cIdx}`}
                onMouseDown={(e) => handleMouseDown(rIdx, cIdx, e)}
                onMouseEnter={() => handleMouseEnterCell(rIdx, cIdx)}
                onTouchStart={() => handleTouchStart(rIdx, cIdx)}
                className="aspect-square cursor-crosshair select-none transition-all"
                style={{
                  backgroundColor: active ? washColor : 'rgba(239,230,216,0.03)',
                  border: `1px solid ${active ? washColor : 'var(--hw-line)'}`,
                  borderRadius: 'var(--hw-radius)',
                  boxShadow: active ? `0 0 12px ${washColor}` : 'none',
                  transitionDuration: 'var(--hw-settle)',
                }}
              />
            )),
          )}
        </div>
      </RegistrationBracket>
      <p className="hw-font-serif text-sm hw-text-dim mt-6 text-center italic">
        Touch where sensation lives in the field.
      </p>
    </div>
  );
}

function RegistrationBracket({ children }: { children: React.ReactNode }) {
  return <div className="hw-bracket relative p-4 w-full">{children}</div>;
}
