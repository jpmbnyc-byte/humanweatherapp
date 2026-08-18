import React from 'react';
import { Headphones, LampDesk, Music2, Sun, Trees, Wind } from 'lucide-react';

export type PracticeInstrument =
  | 'circadian'
  | 'breath'
  | 'tones'
  | 'light'
  | 'classical'
  | 'nature';

type Instrument = {
  id: PracticeInstrument;
  label: string;
  cue: string;
  register: 'Felt' | 'Fact';
  icon: React.ComponentType<{ className?: string }>;
};

const INSTRUMENTS: Instrument[] = [
  { id: 'breath', label: 'Breath', cue: 'Regulate', register: 'Felt', icon: Wind },
  { id: 'tones', label: 'Tones', cue: 'Listen', register: 'Felt', icon: Headphones },
  { id: 'light', label: 'Light', cue: 'Receive', register: 'Fact', icon: LampDesk },
  { id: 'classical', label: 'Classical', cue: 'Settle', register: 'Felt', icon: Music2 },
  { id: 'nature', label: 'Nature', cue: 'Return', register: 'Felt', icon: Trees },
];

type Props = {
  selected: PracticeInstrument;
  onSelect: (instrument: PracticeInstrument) => void;
  currentTheme: 'day' | 'night';
};

export default function PracticeInstrumentNav({ selected, onSelect, currentTheme }: Props) {
  const isNight = currentTheme === 'night';
  const circadianSelected = selected === 'circadian';

  return (
    <section className="mb-8 md:mb-10" aria-labelledby="practice-instrument-title">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-accent/55 mb-1">
            Practice · instruments
          </p>
          <h2 id="practice-instrument-title" className="font-serif text-2xl md:text-3xl text-accent">
            Choose what the moment needs.
          </h2>
        </div>
        <span className="hidden sm:block font-mono text-[9px] uppercase tracking-[0.12em] text-accent/40">
          One instrument at a time
        </span>
      </div>

      <button
        type="button"
        aria-pressed={circadianSelected}
        onClick={() => onSelect('circadian')}
        className={`relative w-full overflow-hidden border text-left px-5 py-5 md:px-7 md:py-6 transition-all cursor-pointer ${
          circadianSelected
            ? 'border-[#d4af37]/65 bg-[#0b1b1a] text-[#f5f3f0] shadow-[0_18px_50px_rgba(11,27,26,0.22)]'
            : isNight
              ? 'border-white/10 bg-[#0b1b1a]/55 text-white/75 hover:border-[#d4af37]/35'
              : 'border-[#1a3a38]/20 bg-[#1a3a38]/[0.055] text-[#1a3a38] hover:border-[#1a3a38]/35'
        }`}
      >
        <div
          className="absolute inset-y-0 right-0 w-2/3 opacity-50 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 78% 50%, rgba(212,175,55,.32), transparent 60%)' }}
          aria-hidden
        />
        <div className="relative z-[1] flex items-center justify-between gap-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] opacity-55">Fact · solar center</span>
              {circadianSelected ? (
                <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" aria-hidden />
              ) : null}
            </div>
            <h3 className="font-serif text-2xl md:text-3xl leading-none">Circadian</h3>
            <p className="font-serif text-sm italic opacity-65 mt-2">
              Meet the local light–dark cycle. The sun is the circadian center.
            </p>
          </div>
          <div className="shrink-0 w-12 h-12 md:w-14 md:h-14 border border-current/20 rounded-full flex items-center justify-center">
            <Sun className="w-5 h-5 md:w-6 md:h-6 text-[#d4af37]" />
          </div>
        </div>
      </button>

      <div
        className="mt-3 flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory"
        role="list"
        aria-label="Other Practice instruments"
      >
        {INSTRUMENTS.map(instrument => {
          const Icon = instrument.icon;
          const active = selected === instrument.id;
          return (
            <button
              key={instrument.id}
              type="button"
              role="listitem"
              aria-pressed={active}
              onClick={() => onSelect(instrument.id)}
              className={`snap-start shrink-0 min-w-[132px] md:min-w-[148px] border px-4 py-3.5 text-left transition-colors cursor-pointer ${
                active
                  ? isNight
                    ? 'border-[#c8a96a]/60 bg-[#c8a96a]/10 text-[#e8cc8a]'
                    : 'border-[#8f7440]/50 bg-[#c8a96a]/15 text-[#5c4825]'
                  : isNight
                    ? 'border-white/[0.08] bg-black/15 text-white/55 hover:border-white/20'
                    : 'border-stone-300/70 bg-white/45 text-stone-600 hover:border-stone-400'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <Icon className="w-4 h-4" />
                <span className="font-mono text-[8px] uppercase tracking-[0.1em] opacity-50">
                  {instrument.register}
                </span>
              </div>
              <span className="block font-serif text-lg leading-none">{instrument.label}</span>
              <span className="block font-mono text-[9px] uppercase tracking-[0.1em] opacity-45 mt-1.5">
                {instrument.cue}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
