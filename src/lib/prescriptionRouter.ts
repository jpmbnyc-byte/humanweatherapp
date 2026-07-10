/**
 * Routes measured somatic conditions to primary clinical modalities.
 * Shinrin-Yoku is supplemental only — not a default prescription.
 */

export type PrescriptionModality =
  | 'breath'
  | 'solar'
  | 'frequency'
  | 'light'
  | 'classical'
  | 'tender'
  | 'clear';

export type SupplementalModality = 'shinrin';

export type SupplementalPrescription = {
  modality: SupplementalModality;
  label: string;
  reason: string;
};

export type Prescription = {
  modality: PrescriptionModality;
  label: string;
  reason: string;
  /** Shown when modality is clear — no routed tab. */
  clearMessage?: string;
  /** Optional, measured add-on — never the primary route. */
  supplemental?: SupplementalPrescription;
};

const PRESCRIPTIONS: Record<string, Prescription> = {
  sympathetic_heat_dome: {
    modality: 'frequency',
    label: 'Alpha · 10 Hz',
    reason:
      'Sympathetic load is elevated — alpha-range entrainment supports a parasympathetic downshift. Pair with the lengthened exhale on the grid.',
    supplemental: {
      modality: 'shinrin',
      label: 'Shinrin-Yoku (supplemental)',
      reason:
        'Forest exposure can lower cortisol when accessible — use sparingly as an adjunct, not a daily default.',
    },
  },
  scattered_atmospheric_drift: {
    modality: 'solar',
    label: 'Solar / Circadian',
    reason:
      'Low internal coherence often tracks circadian drift — anchor morning light and evening dimming before reaching for more stimulation.',
    supplemental: {
      modality: 'shinrin',
      label: 'Shinrin-Yoku (supplemental)',
      reason:
        'Brief, intentional time among trees may support attention restoration — one session when available, not a standing order.',
    },
  },
  high_resonant_thermal_coherence: {
    modality: 'clear',
    label: 'Clear sky',
    reason: 'Parasympathetic flow is optimal — no corrective modality indicated.',
    clearMessage: 'Your sky is clear. Go live under it.',
  },
  dewpoint_restorative_slumber: {
    modality: 'light',
    label: 'Amber Light Therapy',
    reason:
      'Vagal rest is active — warm, low-intensity long-wavelength light avoids melatonin disruption and supports continued restoration.',
  },
  vaporous_resonance_drift: {
    modality: 'tender',
    label: 'The Tender',
    reason:
      'Homeostatic balance with reflective fog — spoken word and gentle backdrop support integration without adding stimulation.',
    supplemental: {
      modality: 'shinrin',
      label: 'Shinrin-Yoku (supplemental)',
      reason:
        'If you need gentle outdoor grounding, a slow walk among trees can supplement — measured, not routine.',
    },
  },
  autonomic_stillness: {
    modality: 'clear',
    label: 'Clear sky',
    reason: 'The field is unmarked — observe before prescribing.',
    clearMessage: 'Your sky is clear. Go live under it.',
  },
};

export function routePrescription(weatherId: string): Prescription {
  return (
    PRESCRIPTIONS[weatherId]     ?? {
      modality: 'breath',
      label: 'Breathwork on the grid',
      reason:
        'Return to equal-ratio breathing on the Field Station until the pattern clarifies.',
    }
  );
}

export type AppTab = 'somatic' | 'therapy' | 'rhythms' | 'tender';

export function prescriptionTab(modality: PrescriptionModality | SupplementalModality): AppTab | null {
  switch (modality) {
    case 'breath':
      return 'somatic';
    case 'solar':
    case 'shinrin':
      return 'rhythms';
    case 'frequency':
    case 'light':
    case 'classical':
      return 'therapy';
    case 'tender':
      return 'tender';
    case 'clear':
      return null;
  }
}
