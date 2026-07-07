import React, { useState, useCallback } from 'react';
import type { WeatherState } from '../types';
import { buildConditions, formatConditionsForSpeech } from '../lib/conditions';
import { routePrescription } from '../lib/prescriptions';
import { readProse, stopReading } from '../lib/readProse';
import { fileObservation } from '../lib/observations';
import type { PrescriptionType } from '../lib/prescriptions';
import SomaticField from '../components/hw/SomaticField';
import ConditionsPanel from '../components/hw/ConditionsPanel';
import AtmosphereWash from '../components/hw/AtmosphereWash';
import HwButton from '../components/hw/HwButton';

type Step = 'question' | 'grid' | 'conditions' | 'prescription';

interface FieldStationProps {
  onExit: () => void;
  onPrescription: (type: PrescriptionType) => void;
}

export default function FieldStation({ onExit, onPrescription }: FieldStationProps) {
  const [step, setStep] = useState<Step>('question');
  const [weather, setWeather] = useState<WeatherState | null>(null);
  const [coords, setCoords] = useState<[number, number][]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceDone, setVoiceDone] = useState(false);

  const conditions = weather ? buildConditions(weather) : null;
  const prescription = weather ? routePrescription(weather) : null;

  const handleStateChange = useCallback((state: WeatherState, activeCoords: [number, number][]) => {
    setWeather(state);
    setCoords(activeCoords);
  }, []);

  const handleGridComplete = () => {
    if (weather) setStep('conditions');
  };

  const handleListen = async () => {
    if (!conditions) return;
    setIsSpeaking(true);
    setVoiceDone(false);
    const text = formatConditionsForSpeech(conditions);
    await readProse(text, {
      keeper: 'joan',
      onLoading: setIsLoading,
      onComplete: () => {
        setIsSpeaking(false);
        setVoiceDone(true);
      },
      onError: () => setIsSpeaking(false),
    });
  };

  const handlePrescription = async () => {
    if (!weather || !conditions || !prescription) return;
    await fileObservation('field', weather, conditions, coords);
    if (prescription.type === 'clear-sky') {
      onExit();
      return;
    }
    if (prescription.type) onPrescription(prescription.type);
  };

  const handleExit = () => {
    stopReading();
    onExit();
  };

  return (
    <div className="hw-screen hw-ground">
      <AtmosphereWash wash="--hw-clear" />

      <button
        type="button"
        onClick={handleExit}
        className="absolute top-6 left-6 z-20 hw-designation opacity-50 hover:opacity-100"
      >
        ← Out
      </button>

      <main className="flex-1 flex flex-col items-center justify-center px-6 z-10 py-12">
        {step === 'question' && (
          <div className="text-center hw-dissolve-enter">
            <p className="hw-designation mb-4">THE FIELD STATION</p>
            <p className="hw-question mb-12">What is your weather right now?</p>
            <HwButton onClick={() => setStep('grid')}>Map the field</HwButton>
          </div>
        )}

        {step === 'grid' && (
          <div className="w-full hw-dissolve-enter">
            <SomaticField onStateChange={handleStateChange} wash="--hw-clear" />
            <div className="flex justify-center mt-8">
              <HwButton onClick={handleGridComplete} disabled={!weather}>
                Name the conditions
              </HwButton>
            </div>
          </div>
        )}

        {step === 'conditions' && conditions && (
          <div className="w-full hw-dissolve-enter">
            <ConditionsPanel
              conditions={conditions}
              isLoading={isLoading}
              isSpeaking={isSpeaking}
              onListen={handleListen}
              prescriptionAction={
                voiceDone || !isSpeaking ? (
                  <HwButton onClick={() => setStep('prescription')}>
                    {prescription?.action ?? 'Continue'}
                  </HwButton>
                ) : null
              }
            />
          </div>
        )}

        {step === 'prescription' && conditions && prescription && (
          <div className="text-center hw-dissolve-enter">
            <p className="hw-designation mb-4">Prescription</p>
            <p className="hw-register mb-8">{prescription.action}</p>
            <HwButton onClick={handlePrescription}>
              {prescription.type === 'clear-sky' ? 'Go live under it' : prescription.label}
            </HwButton>
          </div>
        )}
      </main>
    </div>
  );
}
