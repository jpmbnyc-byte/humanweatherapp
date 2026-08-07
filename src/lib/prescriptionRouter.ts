import type { PrescriptionFocus } from './prescriptionFocus';

export type PrescriptionTarget = 'shinrin' | 'breath' | 'therapy' | 'tender' | 'clear';

export type Prescription = {
  target: PrescriptionTarget;
  label: string;
  reason: string;
  /** Peer-reviewed or clinical study anchor shown in Conditions. */
  research: string;
  /** Deep-link into a specific modality card when the user opens the prescription. */
  focus?: PrescriptionFocus;
  clearMessage?: string;
};

const PRESCRIPTIONS: Record<string, Prescription> = {
  sympathetic_heat_dome: {
    target: 'shinrin',
    label: 'Shinrin-Yoku · High Stress',
    reason: 'Sympathetic heat in the chest — forest phytoncides lower cortisol and thermal neural load.',
    research: 'Li et al. (2010) — forest bathing ↓ salivary cortisol (p<0.01) and prefrontal over-activity.',
    focus: { shinrinProtocolId: 'high_stress' },
  },
  scattered_atmospheric_drift: {
    target: 'breath',
    label: 'Equal breath · Sama Vritti',
    reason: 'Scattered signal — matched inhale/exhale restores grid coherence before cognitive load.',
    research: 'Brown & Gerbarg (2005) — equal-ratio breathing improves HRV and attentional stability.',
  },
  high_resonant_thermal_coherence: {
    target: 'clear',
    label: 'Clear sky',
    reason: 'Coherent flow — no intervention needed.',
    research: 'HRV in optimal coherence band — maintain, do not over-prescribe.',
    clearMessage: 'Your sky is clear. Go live under it.',
  },
  dewpoint_restorative_slumber: {
    target: 'therapy',
    label: 'Light · Indigo pre-sleep',
    reason: 'Heavy restorative descent — violet light supports melatonin onset without stimulation.',
    research: 'Cajochen et al. — short-wavelength light suppresses melatonin; indigo wash prepares sleep transition.',
    focus: { lightModeId: 'deep_violet' },
  },
  vaporous_resonance_drift: {
    target: 'tender',
    label: 'The Tender',
    reason: 'Thin spiritual fog at equilibrium — spoken word and backdrop hold the drift.',
    research: 'Narrative exposure and paced listening ↓ rumination in low-arousal states (Pennebaker, expressive writing).',
  },
  autonomic_stillness: {
    target: 'clear',
    label: 'Clear sky',
    reason: 'Unmarked field — live before you prescribe.',
    research: 'No somatic signal filed — mapping precedes intervention.',
    clearMessage: 'Your sky is clear. Go live under it.',
  },
  frontal_tension_headache: {
    target: 'shinrin',
    label: 'Shinrin-Yoku · High Stress',
    reason: 'Frontal pressure tracks sympathetic hold — cool canopy air and phytoncides ease vascular tension.',
    research: 'Li et al. — forest walks ↓ blood pressure 7–8 mmHg and muscle sympathetic nerve activity.',
    focus: { shinrinProtocolId: 'high_stress' },
  },
  sleep_debt_drift: {
    target: 'shinrin',
    label: 'Shinrin-Yoku · Sleep',
    reason: 'Sleep debt needs late-afternoon komorebi and parasympathetic downshift — not more screen light.',
    research: 'Park et al. — 2hr afternoon forest exposure ↑ sleep efficiency to 89.3% (EEG-confirmed).',
    focus: { shinrinProtocolId: 'sleep_disruption' },
  },
  cognitive_morning_fog: {
    target: 'therapy',
    label: 'Aura & Tones · Alpha 10 Hz',
    reason: 'Morning fog lifts with equal breath plus alpha entrainment before tasks demand focus.',
    research: 'Klimesch (1999) — alpha band (8–12 Hz) correlates with relaxed alertness and working-memory readiness.',
    focus: { frequencyId: 'alpha' },
  },
  barometric_rainy_grey: {
    target: 'therapy',
    label: 'Light · Solar wash',
    reason: 'Grey low-lux days blunt circadian amplitude — brief full-spectrum light restores alertness and mood.',
    research: 'Lam & Levitt meta-analysis — bright light therapy effective for seasonal and overcast low-energy states.',
    focus: { lightModeId: 'bright_yellow' },
  },
};

export function routePrescription(weatherId: string): Prescription {
  return (
    PRESCRIPTIONS[weatherId] ?? {
      target: 'breath',
      label: 'Extended breath',
      reason: 'Return to the breath until the field clarifies.',
      research: 'Slow coherent breathing improves HRV within minutes (Lehrer & Gevirtz, 2014).',
    }
  );
}

export type AppTab = 'somatic' | 'therapy' | 'rhythms' | 'tender';

export function prescriptionTab(target: PrescriptionTarget): AppTab | null {
  switch (target) {
    case 'shinrin':
      return 'rhythms';
    case 'breath':
      return 'somatic';
    case 'therapy':
      return 'therapy';
    case 'tender':
      return 'tender';
    case 'clear':
      return null;
  }
}
