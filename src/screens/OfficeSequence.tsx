import React, { useState, useEffect, useCallback } from 'react';
import type { WeatherState } from '../types';
import type { OfficeId } from '../lib/solarSchedule';
import type { OfficeWindow } from '../lib/solarSchedule';
import { buildConditions, formatConditionsForSpeech } from '../lib/conditions';
import { readProse, stopReading } from '../lib/readProse';
import { fileObservation, getTodaysVaultObservation } from '../lib/observations';
import SomaticField from '../components/hw/SomaticField';
import ConditionsPanel from '../components/hw/ConditionsPanel';
import OfficeHeader from '../components/hw/OfficeHeader';
import AtmosphereWash from '../components/hw/AtmosphereWash';
import HwButton from '../components/hw/HwButton';
import { PRESETS } from '../data/presets';

interface OfficeSequenceProps {
  office: OfficeWindow;
  onComplete: () => void;
  onExit: () => void;
}

type VaultStep = 'question' | 'grid' | 'conditions' | 'breath' | 'passage' | 'release';
type MeridianStep = 'line' | 'breath' | 'solar';
type MarrowStep = 'question' | 'grid' | 'comparison' | 'winddown' | 'stone';

function BreathCycles({
  weather,
  cycles,
  onComplete,
}: {
  weather: WeatherState;
  cycles: number;
  onComplete: () => void;
}) {
  const { inhale, exhale } = weather.breathPattern;
  const [cycle, setCycle] = useState(0);
  const [phase, setPhase] = useState<'inhale' | 'exhale'>('inhale');
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const duration = (phase === 'inhale' ? inhale : exhale) * 1000;
    const timer = setTimeout(() => {
      if (phase === 'inhale') {
        setPhase('exhale');
        setScale(0.6);
      } else {
        const next = cycle + 1;
        if (next >= cycles) {
          onComplete();
        } else {
          setCycle(next);
          setPhase('inhale');
          setScale(1.4);
        }
      }
    }, duration);
    return () => clearTimeout(timer);
  }, [phase, cycle, inhale, exhale, cycles, onComplete]);

  useEffect(() => {
    setScale(phase === 'inhale' ? 1.4 : 0.6);
  }, [phase]);

  return (
    <div className="flex flex-col items-center gap-8">
      <p className="hw-designation">Calibrated breath · {cycle + 1} of {cycles}</p>
      <div
        className="hw-breath-dot"
        style={{
          transform: `scale(${scale})`,
          width: 48,
          height: 48,
          transitionDuration: `${(phase === 'inhale' ? inhale : exhale) * 1000}ms`,
        }}
      />
      <p className="hw-font-serif italic hw-text-dim capitalize">{phase}</p>
    </div>
  );
}

function VaultSequence({
  office,
  onComplete,
  onExit,
}: {
  office: OfficeWindow;
  onComplete: () => void;
  onExit: () => void;
}) {
  const [step, setStep] = useState<VaultStep>('question');
  const [weather, setWeather] = useState<WeatherState | null>(null);
  const [coords, setCoords] = useState<[number, number][]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const conditions = weather ? buildConditions(weather) : null;
  const passage = PRESETS[0];

  const handleStateChange = useCallback((state: WeatherState, activeCoords: [number, number][]) => {
    setWeather(state);
    setCoords(activeCoords);
  }, []);

  const handleListen = async () => {
    if (!conditions) return;
    setIsSpeaking(true);
    await readProse(formatConditionsForSpeech(conditions), {
      keeper: 'joan',
      onLoading: setIsLoading,
      onComplete: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const handleRelease = async () => {
    if (weather && conditions) {
      await fileObservation('vault', weather, conditions, coords);
    }
    onComplete();
  };

  return (
    <>
      <button type="button" onClick={onExit} className="absolute top-6 left-6 z-20 hw-designation opacity-50">
        ← Out
      </button>
      <OfficeHeader name={office.name} designation={office.designation} solarTime={office.startTime} />

      {step === 'question' && (
        <div className="text-center hw-dissolve-enter">
          <p className="hw-question mb-12">{office.question}</p>
          <HwButton onClick={() => setStep('grid')}>Begin</HwButton>
        </div>
      )}

      {step === 'grid' && (
        <div className="w-full">
          <SomaticField onStateChange={handleStateChange} wash={office.wash} />
          <div className="flex justify-center mt-8">
            <HwButton onClick={() => setStep('conditions')} disabled={!weather}>Continue</HwButton>
          </div>
        </div>
      )}

      {step === 'conditions' && conditions && (
        <ConditionsPanel
          conditions={conditions}
          isLoading={isLoading}
          isSpeaking={isSpeaking}
          onListen={handleListen}
          prescriptionAction={
            !isSpeaking ? <HwButton onClick={() => setStep('breath')}>Breathe</HwButton> : null
          }
        />
      )}

      {step === 'breath' && weather && (
        <BreathCycles weather={weather} cycles={3} onComplete={() => setStep('passage')} />
      )}

      {step === 'passage' && (
        <div className="text-center max-w-md hw-dissolve-enter">
          <p className="hw-designation mb-4">Daily passage</p>
          <p className="hw-register mb-8">{passage.text.slice(0, 280)}…</p>
          <HwButton
            onClick={async () => {
              setIsSpeaking(true);
              await readProse(passage.text.slice(0, 500), {
                keeper: 'grace',
                onLoading: setIsLoading,
                onComplete: () => {
                  setIsSpeaking(false);
                  setStep('release');
                },
              });
            }}
            disabled={isSpeaking}
          >
            {isSpeaking ? 'Grace reading' : 'Listen'}
          </HwButton>
        </div>
      )}

      {step === 'release' && (
        <div className="text-center hw-dissolve-enter">
          <p className="hw-register mb-8">Observation filed. The office releases you.</p>
          <HwButton onClick={handleRelease}>Release</HwButton>
        </div>
      )}
    </>
  );
}

function MeridianSequence({
  office,
  onComplete,
  onExit,
}: {
  office: OfficeWindow;
  onComplete: () => void;
  onExit: () => void;
}) {
  const [step, setStep] = useState<MeridianStep>('line');
  const defaultWeather = { breathPattern: { inhale: 4, exhale: 6 } } as WeatherState;
  const line = 'Stand in the column of light. One breath. The sun marks the meridian.';

  useEffect(() => {
    if (step !== 'line') return;
    readProse(line, {
      keeper: 'daniel',
      onComplete: () => setStep('breath'),
    });
    return () => stopReading();
  }, []);

  const handleComplete = async () => {
    const stillness = buildConditions({
      id: 'vaporous_resonance_drift',
      title: 'Vaporous Resonance Drift',
      hrv: 78,
    } as WeatherState);
    await fileObservation(
      'meridian',
      { id: 'vaporous_resonance_drift', hrv: 78 } as WeatherState,
      stillness,
      [],
    );
    onComplete();
  };

  return (
    <>
      <button type="button" onClick={onExit} className="absolute top-6 left-6 z-20 hw-designation opacity-50">
        ← Out
      </button>
      <OfficeHeader name={office.name} designation={office.designation} solarTime={office.startTime} />

      {step === 'line' && (
        <p className="hw-register text-center hw-dissolve-enter">{line}</p>
      )}

      {step === 'breath' && (
        <BreathCycles weather={defaultWeather} cycles={1} onComplete={() => setStep('solar')} />
      )}

      {step === 'solar' && (
        <div className="text-center hw-dissolve-enter">
          <p className="hw-designation mb-4">Solar ray</p>
          <p className="hw-register mb-8">
            The sun stands at its highest. Step toward a window. Let the light find your face.
          </p>
          <HwButton onClick={handleComplete}>Release</HwButton>
        </div>
      )}
    </>
  );
}

function MarrowSequence({
  office,
  onComplete,
  onExit,
}: {
  office: OfficeWindow;
  onComplete: () => void;
  onExit: () => void;
}) {
  const [step, setStep] = useState<MarrowStep>('question');
  const [weather, setWeather] = useState<WeatherState | null>(null);
  const [coords, setCoords] = useState<[number, number][]>([]);
  const [vaultObs, setVaultObs] = useState<string | null>(null);
  const [keepStone, setKeepStone] = useState(false);

  const conditions = weather ? buildConditions(weather) : null;

  useEffect(() => {
    getTodaysVaultObservation().then((obs) => {
      setVaultObs(obs?.conditionsHeader ?? null);
    });
  }, []);

  const handleStateChange = useCallback((state: WeatherState, activeCoords: [number, number][]) => {
    setWeather(state);
    setCoords(activeCoords);
  }, []);

  const handleComplete = async () => {
    if (weather && conditions) {
      await fileObservation('marrow', weather, conditions, coords, keepStone ? conditions.felt : undefined);
    }
    onComplete();
  };

  return (
    <>
      <button type="button" onClick={onExit} className="absolute top-6 left-6 z-20 hw-designation opacity-50">
        ← Out
      </button>
      <OfficeHeader name={office.name} designation={office.designation} solarTime={office.startTime} />

      {step === 'question' && (
        <div className="text-center hw-dissolve-enter">
          <p className="hw-question mb-12">{office.question}</p>
          <HwButton onClick={() => setStep('grid')}>Begin</HwButton>
        </div>
      )}

      {step === 'grid' && (
        <div className="w-full">
          <SomaticField onStateChange={handleStateChange} wash={office.wash} />
          <div className="flex justify-center mt-8">
            <HwButton onClick={() => setStep('comparison')} disabled={!weather}>Continue</HwButton>
          </div>
        </div>
      )}

      {step === 'comparison' && conditions && (
        <div className="text-center max-w-md hw-dissolve-enter">
          <p className="hw-designation mb-4">Day's sky</p>
          {vaultObs ? (
            <p className="hw-font-mono text-xs hw-text-dim mb-4">Vault: {vaultObs}</p>
          ) : (
            <p className="hw-font-mono text-xs hw-text-dim mb-4">Vault: unfiled this morning</p>
          )}
          <p className="hw-font-mono text-xs mb-6">Marrow: {conditions.header}</p>
          <HwButton onClick={() => setStep('winddown')}>Wind down</HwButton>
        </div>
      )}

      {step === 'winddown' && (
        <div className="text-center hw-dissolve-enter">
          <p className="hw-designation mb-4">Aura & Tones</p>
          <p className="hw-register mb-8">
            Let the frequencies settle what the day carried. Rest in the dimming field.
          </p>
          <HwButton onClick={() => setStep('stone')}>Continue</HwButton>
        </div>
      )}

      {step === 'stone' && (
        <div className="text-center hw-dissolve-enter">
          <p className="hw-designation mb-4">Keep a stone?</p>
          <p className="hw-register mb-8 italic">{conditions?.felt}</p>
          <div className="flex gap-4 justify-center">
            <HwButton onClick={() => { setKeepStone(true); handleComplete(); }}>Keep</HwButton>
            <HwButton onClick={handleComplete}>Release</HwButton>
          </div>
        </div>
      )}
    </>
  );
}

export default function OfficeSequence({ office, onComplete, onExit }: OfficeSequenceProps) {
  return (
    <div className={`hw-screen hw-ground ${office.id === 'marrow' ? 'hw-ground-deep' : ''}`}>
      <AtmosphereWash wash={office.wash} />
      <main className="flex-1 flex flex-col items-center justify-center px-6 z-10 py-12 relative">
        {office.id === 'vault' && (
          <VaultSequence office={office} onComplete={onComplete} onExit={onExit} />
        )}
        {office.id === 'meridian' && (
          <MeridianSequence office={office} onComplete={onComplete} onExit={onExit} />
        )}
        {office.id === 'marrow' && (
          <MarrowSequence office={office} onComplete={onComplete} onExit={onExit} />
        )}
      </main>
    </div>
  );
}
