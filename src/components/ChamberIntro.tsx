import React from 'react';

type ChamberId = 'therapy' | 'rhythms' | 'tender';

const CHAMBERS: Record<
  ChamberId,
  { designation: string; title: string; intro: string }
> = {
  therapy: {
    designation: 'MOD/01 · AURA & TONES',
    title: 'Aura & Tones',
    intro:
      'Light, frequency, and classical wash — sensory chambers for when the Conditions prescribe restoration through sound and spectrum.',
  },
  rhythms: {
    designation: 'MOD/02 · CIRCADIAN',
    title: 'Circadian Rhythms',
    intro:
      'The sun is the circadian center. Solar practice and forest bathing help you meet the local light–dark cycle, while the body—not the clock—reveals your response.',
  },
  tender: {
    designation: 'MOD/03 · TENDER STUDIO',
    title: 'Tender Studio',
    intro:
      'A private production room for words the body is carrying. Shape a passage through voice and image, then leave with a finished file you can share on your own terms.',
  },
};

type Props = {
  chamber: ChamberId;
  currentTheme: 'day' | 'night';
};

export default function ChamberIntro({ chamber, currentTheme }: Props) {
  const meta = CHAMBERS[chamber];
  const isNight = currentTheme === 'night';

  return (
    <header
      className={`hw-station-chamber mb-8 hw-wash-neutral ${
        isNight ? 'hw-station-chamber-night' : 'hw-station-chamber-day'
      }`}
    >
      <div className="hw-station-brackets" aria-hidden />
      <div className="relative z-[1] px-5 py-6 md:px-8 md:py-7">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent/65 mb-2">
          {meta.designation}
        </p>
        <h2 className="font-serif text-2xl md:text-3xl text-accent mb-3">{meta.title}</h2>
        <p className={`hw-section-intro max-w-prose ${isNight ? 'text-white/55' : 'text-stone-600'}`}>
          {meta.intro}
        </p>
      </div>
    </header>
  );
}
