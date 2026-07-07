import React from 'react';
import type { SolarSchedule } from '../lib/solarSchedule';
import type { OfficeId } from '../lib/solarSchedule';
import AtmosphereWash from '../components/hw/AtmosphereWash';
import HwButton from '../components/hw/HwButton';

interface ThresholdProps {
  schedule: SolarSchedule;
  onEnterOffice: (office: OfficeId) => void;
  onEnterFieldStation: () => void;
  onEnterFascia: () => void;
}

export default function Threshold({
  schedule,
  onEnterOffice,
  onEnterFieldStation,
  onEnterFascia,
}: ThresholdProps) {
  const activeOffice = schedule.activeOffice
    ? schedule.offices.find((o) => o.id === schedule.activeOffice)
    : null;

  const wash = activeOffice?.wash ?? '--hw-fog';

  return (
    <div className="hw-screen hw-ground">
      <AtmosphereWash wash={wash} />

      <button
        type="button"
        onClick={onEnterFascia}
        className="absolute top-6 right-6 z-20 hw-designation opacity-50 hover:opacity-100 transition-opacity"
        aria-label="The Fascia"
      >
        ◇
      </button>

      <main className="flex-1 flex flex-col items-center justify-center px-6 z-10 relative">
        {activeOffice ? (
          <>
            <p className="hw-designation mb-4">{activeOffice.designation}</p>
            <h1 className="hw-name text-center mb-8">{activeOffice.name}</h1>
            <p className="hw-question text-center mb-12">{activeOffice.question}</p>
            <HwButton onClick={() => onEnterOffice(activeOffice.id)}>
              Enter · {activeOffice.startTime}
            </HwButton>
          </>
        ) : (
          <>
            <p className="hw-designation mb-4">HW/01 · FIELD INSTRUMENT · NERVOUS SYSTEM</p>
            <h1 className="hw-name text-center mb-4">THE FIELD STATION</h1>
            <p className="hw-question text-center mb-4">What is your weather right now?</p>
            <p className="hw-font-serif italic hw-text-dim text-center mb-12 max-w-md">
              A guide to the wiring you already own.
            </p>
            <HwButton onClick={onEnterFieldStation}>Open the station</HwButton>
          </>
        )}

        {!activeOffice && schedule.offices.length > 0 && (
          <div className="mt-16 text-center">
            <p className="hw-designation mb-4">The Diurnal Spine</p>
            <div className="flex flex-col gap-2">
              {schedule.offices.map((office) => (
                <p key={office.id} className="hw-font-mono text-xs hw-text-dim">
                  {office.name} · {office.startTime}
                </p>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="py-6 text-center z-10">
        <p className="hw-designation opacity-40">
          {schedule.locationLabel} · ↑ {schedule.sunrise} · ○ {schedule.noon} · ↓{' '}
          {schedule.sunset}
        </p>
      </footer>
    </div>
  );
}
