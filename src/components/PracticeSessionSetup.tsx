import React from 'react';
import { Users, UserRound } from 'lucide-react';

export type PracticeMode = 'personal' | 'room';

export type ClassSessionConfig = {
  arrivalSeconds: number;
  practiceMinutes: number;
  closingSeconds: number;
  breathPace: 'natural' | 'slow' | 'steady';
};

export const DEFAULT_CLASS_SESSION: ClassSessionConfig = {
  arrivalSeconds: 60,
  practiceMinutes: 30,
  closingSeconds: 60,
  breathPace: 'natural',
};

type Props = {
  mode: PracticeMode;
  onModeChange: (mode: PracticeMode) => void;
  config: ClassSessionConfig;
  onConfigChange: (config: ClassSessionConfig) => void;
};

const SelectField = ({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) => (
  <label className="flex flex-col gap-1.5">
    <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-accent/55">{label}</span>
    <select
      value={value}
      onChange={event => onChange(event.target.value)}
      className="min-h-10 rounded-lg border border-accent/15 bg-black/20 px-3 text-xs text-accent outline-none focus:border-accent/40"
    >
      {children}
    </select>
  </label>
);

export default function PracticeSessionSetup({ mode, onModeChange, config, onConfigChange }: Props) {
  const update = <K extends keyof ClassSessionConfig>(key: K, value: ClassSessionConfig[K]) => {
    onConfigChange({ ...config, [key]: value });
  };

  return (
    <div className="mb-6 rounded-xl border border-accent/10 bg-accent/[0.025] p-3">
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Practice setting">
        <button
          type="button"
          aria-pressed={mode === 'personal'}
          onClick={() => onModeChange('personal')}
          className={`min-h-11 rounded-lg border px-3 text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer ${
            mode === 'personal'
              ? 'border-accent/45 bg-accent/10 text-accent'
              : 'border-accent/10 text-accent/55 hover:border-accent/25'
          }`}
        >
          <UserRound className="w-4 h-4" />
          For myself
        </button>
        <button
          type="button"
          aria-pressed={mode === 'room'}
          onClick={() => onModeChange('room')}
          className={`min-h-11 rounded-lg border px-3 text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer ${
            mode === 'room'
              ? 'border-accent/45 bg-accent/10 text-accent'
              : 'border-accent/10 text-accent/55 hover:border-accent/25'
          }`}
        >
          <Users className="w-4 h-4" />
          Guiding a room
        </button>
      </div>

      {mode === 'personal' ? (
        <p className="mt-3 text-center font-serif text-xs italic text-accent/55">
          One tap begins a private two-minute practice. Stay longer if it feels supportive.
        </p>
      ) : (
        <div className="mt-4">
          <div className="mb-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-accent/50">Class setup</span>
            <p className="font-serif text-sm text-accent/75 mt-1">
              Set the room once. Arrival, practice, and closing advance without instructor input.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <SelectField
              label="Arrival"
              value={config.arrivalSeconds}
              onChange={value => update('arrivalSeconds', Number(value))}
            >
              <option value={0}>Off</option>
              <option value={30}>30 sec</option>
              <option value={60}>1 min</option>
              <option value={120}>2 min</option>
              <option value={180}>3 min</option>
            </SelectField>
            <SelectField
              label="Practice"
              value={config.practiceMinutes}
              onChange={value => update('practiceMinutes', Number(value))}
            >
              {[5, 10, 15, 20, 30, 45, 60].map(minutes => (
                <option key={minutes} value={minutes}>{minutes} min</option>
              ))}
            </SelectField>
            <SelectField
              label="Closing"
              value={config.closingSeconds}
              onChange={value => update('closingSeconds', Number(value))}
            >
              <option value={30}>30 sec</option>
              <option value={60}>1 min</option>
              <option value={120}>2 min</option>
            </SelectField>
            <SelectField
              label="Breath"
              value={config.breathPace}
              onChange={value => update('breathPace', value as ClassSessionConfig['breathPace'])}
            >
              <option value="natural">Natural</option>
              <option value="slow">Slow</option>
              <option value="steady">Steady</option>
            </SelectField>
          </div>
          <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.1em] text-accent/40 text-center">
            Tap a sound when the room is ready
          </p>
        </div>
      )}
    </div>
  );
}
