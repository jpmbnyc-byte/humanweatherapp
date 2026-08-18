import React from 'react';
import type { CachedDailyMarks } from '../lib/dailyMarks';
import { localDecimalHours } from '../lib/whereAreWe';

type Props = {
  marks: CachedDailyMarks;
  currentTheme: 'day' | 'night';
};

type SolarPhase = {
  name: string;
  movement: string;
  observation: string;
  start: number;
  end: number;
};

function formatMark(value: number): string {
  const totalMinutes = Math.round(value * 60);
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function phaseFor(now: number, marks: CachedDailyMarks): SolarPhase {
  if (now < marks.sunrise) {
    return {
      name: 'Before sunrise',
      movement: 'Light is gathering below the horizon.',
      observation: 'The solar day has not opened yet. Notice what the body brings into first light.',
      start: 0,
      end: marks.sunrise,
    };
  }
  if (now < marks.noon) {
    return {
      name: 'Solar ascent',
      movement: 'The sun is climbing toward its daily height.',
      observation: 'The circadian field is strengthening. Your response to it remains personal.',
      start: marks.sunrise,
      end: marks.noon,
    };
  }
  if (now < marks.sunset) {
    return {
      name: 'Solar descent',
      movement: 'The sun has crossed its height and is descending.',
      observation: 'The light remains active while the day begins to turn. Notice what remains available.',
      start: marks.noon,
      end: marks.sunset,
    };
  }
  if (now < marks.dark) {
    return {
      name: 'Afterlight',
      movement: 'The sun is below the horizon; its light is withdrawing.',
      observation: 'The circadian field is changing register. Let the body report the transition.',
      start: marks.sunset,
      end: marks.dark,
    };
  }
  return {
    name: 'Solar night',
    movement: 'The local light cycle is at rest.',
    observation: 'Darkness is part of the rhythm, not an absence of it. Notice without scoring yourself.',
    start: marks.dark,
    end: 24,
  };
}

export default function SolarCircadianField({ marks, currentTheme }: Props) {
  const now = localDecimalHours(new Date());
  const phase = phaseFor(now, marks);
  const span = Math.max(phase.end - phase.start, 0.01);
  const progress = Math.min(100, Math.max(0, ((now - phase.start) / span) * 100));
  const isNight = currentTheme === 'night';

  return (
    <section
      aria-label="Solar circadian context"
      className={`mb-8 rounded-2xl border px-5 py-6 md:px-8 md:py-7 ${
        isNight
          ? 'border-white/10 bg-black/15'
          : 'border-stone-200/80 bg-white/45'
      }`}
      id="solar-circadian-field"
    >
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <p className="hw-eyebrow text-accent/70 mb-2">Circadian center · the sun</p>
          <h2 className="font-serif text-2xl md:text-3xl text-accent leading-tight">{phase.name}</h2>
          <p className={`font-serif text-base italic mt-2 ${isNight ? 'text-white/65' : 'text-stone-700'}`}>
            {phase.movement}
          </p>
        </div>
        <p className={`hw-caption max-w-sm md:text-right ${isNight ? 'text-white/50' : 'text-stone-600'}`}>
          Sun establishes the field. The body reveals its response.
        </p>
      </div>

      <div className="relative h-px bg-accent/20 mb-3" aria-hidden>
        <span
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-accent shadow-[0_0_18px_rgba(212,176,90,0.6)]"
          style={{ left: `calc(${progress}% - 6px)` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {([
          ['Sunrise', marks.sunrise],
          ['Solar noon', marks.noon],
          ['Sunset', marks.sunset],
        ] as const).map(([label, value]) => (
          <div key={label}>
            <span className="font-mono text-[9px] uppercase tracking-widest opacity-40 block mb-1">{label}</span>
            <span className="font-mono text-xs text-accent/85">{formatMark(value)}</span>
          </div>
        ))}
      </div>

      <p className={`font-sans text-sm leading-relaxed ${isNight ? 'text-white/60' : 'text-stone-600'}`}>
        {phase.observation}
      </p>
    </section>
  );
}
