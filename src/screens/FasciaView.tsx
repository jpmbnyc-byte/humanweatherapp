import React, { useEffect, useState } from 'react';
import {
  getObservations,
  computeInheritance,
  toggleStone,
  type Observation,
  type InheritanceMetrics,
} from '../lib/observations';
import AtmosphereWash from '../components/hw/AtmosphereWash';
import HwButton from '../components/hw/HwButton';

interface FasciaViewProps {
  onExit: () => void;
}

function InheritanceLine({ metrics }: { metrics: InheritanceMetrics }) {
  const points = 12;
  const baseY = 24;
  const amplitude = 16;
  const pathPoints: string[] = [];

  for (let i = 0; i <= points; i++) {
    const x = (i / points) * 300;
    const phase = (i / points) * Math.PI * 2;
    const coherenceWave = Math.sin(phase) * (metrics.coherenceAvg / 100) * amplitude;
    const recoveryWave = Math.cos(phase * 0.7) * (metrics.recoveryVelocity / 20) * 8;
    const y = baseY - coherenceWave - recoveryWave;
    pathPoints.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
  }

  return (
    <div className="hw-inheritance-line mb-8 px-4">
      <p className="hw-designation mb-2">The Inheritance</p>
      <p className="hw-font-mono text-[10px] hw-text-dim mb-2">
        CLIMATE/BASELINE · LONGITUDINAL · {metrics.observationCount} observations
      </p>
      <svg viewBox="0 0 300 48" preserveAspectRatio="none" aria-hidden>
        <path
          d={pathPoints.join(' ')}
          fill="none"
          stroke="var(--hw-gold)"
          strokeWidth="1"
          opacity="0.6"
        />
      </svg>
      {metrics.forecastUnlocked && (
        <p className="hw-font-mono text-[10px] hw-text-gold mt-1">Forecast privilege unlocked</p>
      )}
    </div>
  );
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function FasciaView({ onExit }: FasciaViewProps) {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [inheritance, setInheritance] = useState<InheritanceMetrics | null>(null);

  useEffect(() => {
    getObservations().then(setObservations);
    computeInheritance().then(setInheritance);
  }, []);

  const handleToggleStone = async (id: string) => {
    await toggleStone(id);
    const updated = await getObservations();
    setObservations(updated);
  };

  return (
    <div className="hw-screen hw-ground hw-screen-scroll">
      <AtmosphereWash wash="--hw-fog" />

      <header className="sticky top-0 z-20 hw-ground-raise px-6 py-4 flex items-center justify-between border-b border-[var(--hw-line)]">
        <div>
          <p className="hw-designation">REC/01 · CONNECTIVE RECORD</p>
          <h1 className="hw-name text-xl">THE FASCIA</h1>
        </div>
        <HwButton onClick={onExit}>← Out</HwButton>
      </header>

      <main className="relative z-10 px-6 py-8 max-w-lg mx-auto w-full">
        {inheritance && <InheritanceLine metrics={inheritance} />}

        {observations.length === 0 ? (
          <p className="hw-font-serif italic hw-text-dim text-center py-12">
            No observations filed yet. The record keeps itself quietly.
          </p>
        ) : (
          <ul className="flex flex-col gap-0">
            {observations.map((obs) => (
              <li
                key={obs.id}
                className="flex items-start gap-3 py-4 border-b border-[var(--hw-line)]"
              >
                <button
                  type="button"
                  onClick={() => handleToggleStone(obs.id)}
                  className={`hw-stone mt-1.5 ${obs.stone ? 'hw-stone--kept' : ''}`}
                  aria-label={obs.stone ? 'Release stone' : 'Keep a stone'}
                />
                <div className="flex-1 min-w-0">
                  <p className="hw-font-mono text-xs hw-text-dim mb-1">
                    {formatDate(obs.timestamp)} · {obs.office.toUpperCase()}
                  </p>
                  <p className="hw-font-serif text-sm truncate">{obs.summary}</p>
                  <p className="hw-font-mono text-[10px] hw-text-dim mt-1 truncate">
                    {obs.conditionsHeader}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
