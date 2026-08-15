import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type JourneyStep = 'arrive' | 'map' | 'name' | 'breathe' | 'prescribe';

export const JOURNEY_STEPS: { id: JourneyStep; label: string; anchor: string; hint: string }[] = [
  { id: 'arrive', label: 'Arrive', anchor: '#station-guide', hint: 'What is your weather right now?' },
  { id: 'map', label: 'Map', anchor: '#somatic-field', hint: 'Touch the somatic field.' },
  { id: 'name', label: 'Name', anchor: '#conditions-card', hint: 'Read the Conditions.' },
  { id: 'breathe', label: 'Breathe', anchor: '#breath-orb', hint: 'Three cycles with the orb.' },
  { id: 'prescribe', label: 'Release', anchor: '#conditions-card', hint: 'Follow the prescription, or live under clear sky.' },
];

type StationJourneyContextValue = {
  mapped: boolean;
  conditionsEngaged: boolean;
  breathComplete: boolean;
  prescriptionTaken: boolean;
  activeStep: JourneyStep;
  markMapped: () => void;
  markConditionsEngaged: () => void;
  markBreathComplete: () => void;
  markPrescriptionTaken: () => void;
  scrollToStep: (step: JourneyStep) => void;
};

const StationJourneyContext = createContext<StationJourneyContextValue | null>(null);

function resolveActiveStep(flags: {
  mapped: boolean;
  conditionsEngaged: boolean;
  breathComplete: boolean;
  prescriptionTaken: boolean;
}): JourneyStep {
  if (flags.prescriptionTaken) return 'prescribe';
  if (flags.breathComplete) return 'prescribe';
  if (flags.conditionsEngaged) return 'breathe';
  if (flags.mapped) return 'name';
  return 'map';
}

export function StationJourneyProvider({ children }: { children: React.ReactNode }) {
  const [mapped, setMapped] = useState(false);
  const [conditionsEngaged, setConditionsEngaged] = useState(false);
  const [breathComplete, setBreathComplete] = useState(false);
  const [prescriptionTaken, setPrescriptionTaken] = useState(false);

  const activeStep = useMemo(
    () => resolveActiveStep({ mapped, conditionsEngaged, breathComplete, prescriptionTaken }),
    [mapped, conditionsEngaged, breathComplete, prescriptionTaken],
  );

  const scrollToStep = useCallback((step: JourneyStep) => {
    const target = JOURNEY_STEPS.find(s => s.id === step)?.anchor;
    if (!target || typeof document === 'undefined') return;
    document.querySelector(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const value = useMemo<StationJourneyContextValue>(
    () => ({
      mapped,
      conditionsEngaged,
      breathComplete,
      prescriptionTaken,
      activeStep,
      markMapped: () => setMapped(true),
      markConditionsEngaged: () => setConditionsEngaged(true),
      markBreathComplete: () => setBreathComplete(true),
      markPrescriptionTaken: () => setPrescriptionTaken(true),
      scrollToStep,
    }),
    [mapped, conditionsEngaged, breathComplete, prescriptionTaken, activeStep, scrollToStep],
  );

  return (
    <StationJourneyContext.Provider value={value}>{children}</StationJourneyContext.Provider>
  );
}

export function useStationJourney(): StationJourneyContextValue {
  const ctx = useContext(StationJourneyContext);
  if (!ctx) throw new Error('useStationJourney requires StationJourneyProvider');
  return ctx;
}

export function useStationJourneyOptional(): StationJourneyContextValue | null {
  return useContext(StationJourneyContext);
}
