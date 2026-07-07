import React from 'react';
import type { PrescriptionType } from '../lib/prescriptions';
import ShinrinYoku from '../components/ShinrinYoku';
import BreathworkOrb from '../components/BreathworkOrb';
import FrequencyTherapy from '../components/FrequencyTherapy';
import TheTender from '../components/TheTender';
import { WEATHER_STATES } from '../data';
import AtmosphereWash from '../components/hw/AtmosphereWash';
import HwButton from '../components/hw/HwButton';

interface PrescriptionRoomProps {
  type: PrescriptionType;
  onExit: () => void;
}

export default function PrescriptionRoom({ type, onExit }: PrescriptionRoomProps) {
  const defaultWeather = WEATHER_STATES[1];
  const hwTheme = 'night' as const;

  return (
    <div className="hw-screen hw-ground hw-screen-scroll">
      <AtmosphereWash wash="--hw-fog" />
      <header className="sticky top-0 z-20 hw-ground-raise px-6 py-4 flex items-center justify-between">
        <p className="hw-designation">Prescription</p>
        <HwButton onClick={onExit}>← Out</HwButton>
      </header>
      <main className="relative z-10 px-4 py-6 max-w-4xl mx-auto">
        {type === 'shinrin-yoku' && <ShinrinYoku currentTheme={hwTheme} />}
        {type === 'breathwork' && (
          <BreathworkOrb weatherState={defaultWeather} currentTheme={hwTheme} />
        )}
        {type === 'aura-tones' && <FrequencyTherapy currentTheme={hwTheme} />}
        {type === 'tender' && <TheTender currentTheme={hwTheme} />}
      </main>
    </div>
  );
}
