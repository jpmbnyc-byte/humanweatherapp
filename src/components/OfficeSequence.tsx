import React, { useState } from 'react';
import { ChevronRight, Check, Lock } from 'lucide-react';
import type { WhereAreWeResult } from '../lib/whereAreWe';
import type { Office } from '../lib/officeObserved';
import { markOfficeComplete } from '../lib/officeObserved';
import { stationSpeak, ensureVoicesReady, primeSpeechEngine } from '../lib/stationSpeech';
import { useEntitlement } from '../lib/EntitlementContext';
import PurchaseOffer from './PurchaseOffer';

type AppTab = 'somatic' | 'therapy' | 'rhythms' | 'tender';

type Props = {
  place: WhereAreWeResult | null;
  currentTheme: 'day' | 'night';
  onNavigateTab: (tab: AppTab) => void;
};

type StepDef = {
  id: string;
  title: string;
  body: string;
  hint?: string;
  speak?: string;
  navigate?: AppTab;
};

type OfficeDef = {
  designation: string;
  subtitle: string;
  explainer: string;
  steps: StepDef[];
};

const OFFICES: Record<Office, OfficeDef> = {
  vault: {
    designation: 'The Vault',
    subtitle: 'Morning office · sunrise to noon',
    explainer:
      'The Vault is your morning threshold. You arrive at the field station, mark the body on the grid, name the Conditions, breathe three cycles, and file the observation before noon passes.',
    steps: [
      {
        id: 'vault-map',
        title: 'Mark the somatic field',
        body: 'Touch or drag across the grid to map sensation, tension, or quiet in the body. High rows are head and chest; low rows are core and pelvis.',
        hint: 'Use the grid on the left.',
      },
      {
        id: 'vault-conditions',
        title: 'Read the Conditions',
        body: 'The triple register — Felt, Fact, Faith — names what the grid revealed. Optional Listen speaks the Conditions aloud.',
        hint: 'See the Conditions card on the right.',
      },
      {
        id: 'vault-breath',
        title: 'Three breath cycles',
        body: 'Follow the orb through three full cycles. If Il Nascimento is active, dust coalesces on the exhale and a memento may form.',
        hint: 'Complete three cycles in the breath orb below.',
      },
      {
        id: 'vault-passage',
        title: 'Morning passage',
        body: 'Carry one line from the Faith register into the day. No need to fix — only to witness.',
        speak: 'The Vault closes when the observation is filed. Witness, do not fix.',
      },
      {
        id: 'vault-file',
        title: 'File the observation',
        body: 'When the grid, Conditions, and breath are complete, file this morning office. The diurnal spine records that the Vault was held.',
      },
    ],
  },
  meridian: {
    designation: 'The Meridian',
    subtitle: 'Midday office · noon to sunset',
    explainer:
      'The Meridian is the solar hinge of the day. One spoken line, one conscious breath, and a moment with the sun — enough to re-center before the afternoon drift.',
    steps: [
      {
        id: 'meridian-line',
        title: 'Meridian line',
        body: 'At true noon the spine asks for a single true sentence. Speak it aloud or listen to the station voice.',
        speak: 'At meridian, name one true thing about this day.',
      },
      {
        id: 'meridian-breath',
        title: 'One breath cycle',
        body: 'One full inhale and exhale with the orb — no rush. Let the solar plexus settle.',
        hint: 'One cycle in the breath orb.',
      },
      {
        id: 'meridian-solar',
        title: 'Solar moment',
        body: 'Open Circadian Rhythms for the solar ray protocol — even two minutes of directed light marks the hinge.',
        navigate: 'rhythms',
      },
      {
        id: 'meridian-close',
        title: 'Close the Meridian',
        body: 'File the office when the line, breath, and solar moment are complete.',
      },
    ],
  },
  marrow: {
    designation: 'The Marrow',
    subtitle: 'Evening office · sunset to dark',
    explainer:
      'The Marrow is the evening descent. Review the day on the grid, compare morning to now, wind down with Aura & Tones, and optionally keep a stone — a single word or sensation to carry.',
    steps: [
      {
        id: 'marrow-grid',
        title: 'Evening grid',
        body: 'Mark the body again. Notice what shifted since the Vault — what softened, what hardened, what remained.',
        hint: 'Refresh the grid on the left.',
      },
      {
        id: 'marrow-compare',
        title: 'Day comparison',
        body: 'Compare morning Conditions to now. The Fascia holds mementos if Il Nascimento ran; otherwise hold the comparison in one sentence.',
      },
      {
        id: 'marrow-wind',
        title: 'Aura wind-down',
        body: 'Open Aura & Tones for frequency or light therapy — a gentle vagal descent before sleep.',
        navigate: 'therapy',
      },
      {
        id: 'marrow-stone',
        title: 'Keep a stone (optional)',
        body: 'Choose one word or sensation from the day to keep. Release the rest.',
      },
      {
        id: 'marrow-close',
        title: 'Close the Marrow',
        body: 'File the evening office. The diurnal spine rests until tomorrow\'s Vault.',
      },
    ],
  },
};

function formatHour(decimal: number): string {
  const h = Math.floor(decimal);
  const m = Math.round((decimal - h) * 60);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export default function OfficeSequence({ place, currentTheme, onNavigateTab }: Props) {
  const { can } = useEntitlement();
  const [stepIndex, setStepIndex] = useState(0);
  const [filed, setFiled] = useState(false);

  const isNight = currentTheme === 'night';
  const officesEnabled = can('offices');

  if (!place?.activeOffice) return null;

  const office = place.activeOffice;
  const def = OFFICES[office];
  const observed = place.officeState === 'observed';
  const step = def.steps[stepIndex];
  const isLast = stepIndex >= def.steps.length - 1;

  const handleNext = async () => {
    if (isLast) {
      await markOfficeComplete(office);
      setFiled(true);
      return;
    }
    setStepIndex(i => i + 1);
  };

  const handleSpeak = () => {
    if (!step?.speak) return;
    primeSpeechEngine();
    void ensureVoicesReady().then(() => stationSpeak(step.speak!));
  };

  if (!officesEnabled) {
    return (
      <div className="w-full mb-8 flex flex-col gap-4" id="office-sequence">
        <div
          className={`p-6 rounded-2xl border ${
            isNight ? 'border-white/10 bg-black/20' : 'border-stone-200 bg-white/60'
          }`}
        >
          <div className="flex items-start gap-3">
            <Lock className={`w-4 h-4 mt-0.5 shrink-0 ${isNight ? 'text-white/40' : 'text-stone-400'}`} />
            <div>
              <span className="hw-eyebrow block mb-1">Diurnal spine · {def.designation}</span>
              <p className={`font-sans text-sm leading-relaxed ${isNight ? 'text-white/60' : 'text-stone-600'}`}>
                {def.explainer} The Diurnal Spine opens during trial and membership. Field Station core
                remains available.
              </p>
            </div>
          </div>
        </div>
        <PurchaseOffer currentTheme={currentTheme} variant="card" />
      </div>
    );
  }

  if (observed || filed) {
    return (
      <div
        className={`w-full mb-8 p-5 rounded-2xl border flex items-center gap-3 ${
          isNight ? 'border-accent/20 bg-accent/5' : 'border-accent/25 bg-accent/[0.04]'
        }`}
        id="office-sequence"
      >
        <Check className="w-4 h-4 text-accent shrink-0" />
        <div>
          <span className="font-mono text-xs uppercase tracking-widest opacity-60">
            {def.designation} · observed today
          </span>
          <p className={`font-serif text-sm italic mt-1 ${isNight ? 'text-white/70' : 'text-stone-600'}`}>
            This office is filed. The diurnal spine continues in its window.
          </p>
        </div>
      </div>
    );
  }

  const windowStart =
    office === 'vault'
      ? place.marks.sunrise
      : office === 'meridian'
        ? place.marks.noon
        : place.marks.sunset;
  const windowEnd =
    office === 'vault'
      ? place.marks.noon
      : office === 'meridian'
        ? place.marks.sunset
        : place.marks.dark;

  return (
    <div
      className={`w-full mb-8 p-6 md:p-8 rounded-2xl border ${
        isNight ? 'border-white/10 bg-black/25' : 'border-stone-200/80 bg-white/70'
      }`}
      id="office-sequence"
    >
      <div className="mb-5">
        <span className="hw-eyebrow block mb-1">Diurnal spine · {def.designation}</span>
        <p className={`font-mono text-[10px] uppercase tracking-widest opacity-45 mb-3`}>
          {def.subtitle} · {formatHour(windowStart)} – {formatHour(windowEnd)}
        </p>
        <p className={`font-sans text-sm leading-relaxed ${isNight ? 'text-white/65' : 'text-stone-600'}`}>
          {def.explainer}
        </p>
      </div>

      <div
        className={`p-5 rounded-xl border mb-4 ${
          isNight ? 'border-white/8 bg-white/[0.03]' : 'border-stone-200 bg-stone-50/80'
        }`}
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] opacity-40 block mb-2">
          Step {stepIndex + 1} of {def.steps.length}
        </span>
        <h3 className={`font-serif text-lg mb-2 ${isNight ? 'text-accent' : 'text-[#2c2824]'}`}>
          {step.title}
        </h3>
        <p className={`font-sans text-sm leading-relaxed mb-3 ${isNight ? 'text-white/75' : 'text-stone-700'}`}>
          {step.body}
        </p>
        {step.hint && (
          <p className={`font-mono text-[11px] opacity-50 italic ${isNight ? 'text-white/50' : 'text-stone-500'}`}>
            {step.hint}
          </p>
        )}
        <div className="flex flex-wrap gap-2 mt-4">
          {step.speak && (
            <button
              type="button"
              onClick={handleSpeak}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono uppercase tracking-wide cursor-pointer ${
                isNight
                  ? 'border-white/15 text-white/70 hover:border-accent/40'
                  : 'border-stone-300 text-stone-600 hover:border-accent/40'
              }`}
            >
              Listen
            </button>
          )}
          {step.navigate && (
            <button
              type="button"
              onClick={() => onNavigateTab(step.navigate!)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono uppercase tracking-wide cursor-pointer ${
                isNight
                  ? 'border-accent/30 text-accent hover:bg-accent/10'
                  : 'border-accent/40 text-[#8a6f2e] hover:bg-accent/5'
              }`}
            >
              Open section
            </button>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => void handleNext()}
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-mono uppercase tracking-widest cursor-pointer transition-colors ${
          isNight
            ? 'border-accent/35 text-accent hover:bg-accent/10'
            : 'border-accent/45 text-[#8a6f2e] hover:bg-accent/5'
        }`}
      >
        {isLast ? 'File observation' : 'Next step'}
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
