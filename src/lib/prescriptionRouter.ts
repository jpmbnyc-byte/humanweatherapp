export type PrescriptionTarget = 'shinrin' | 'breath' | 'therapy' | 'tender' | 'clear';

export type Prescription = {
  target: PrescriptionTarget;
  label: string;
  reason: string;
  /** Shown when target is clear — no routed tab. */
  clearMessage?: string;
};

const PRESCRIPTIONS: Record<string, Prescription> = {
  sympathetic_heat_dome: {
    target: 'shinrin',
    label: 'Shinrin-Yoku',
    reason: 'Sympathetic overload — forest bathing lowers thermal neural load.',
  },
  scattered_atmospheric_drift: {
    target: 'breath',
    label: 'Extended breath',
    reason: 'Scattered signal — equal pacing restores coherence on the grid.',
  },
  high_resonant_thermal_coherence: {
    target: 'clear',
    label: 'Clear sky',
    reason: 'Coherent flow — no intervention needed.',
    clearMessage: 'Your sky is clear. Go live under it.',
  },
  dewpoint_restorative_slumber: {
    target: 'therapy',
    label: 'Aura & Tones',
    reason: 'Heavy restorative state — light and frequency support vagal descent.',
  },
  vaporous_resonance_drift: {
    target: 'tender',
    label: 'The Tender',
    reason: 'Restless spiritual fog — spoken word and backdrop hold the drift.',
  },
  autonomic_stillness: {
    target: 'clear',
    label: 'Clear sky',
    reason: 'Unmarked field — live before you prescribe.',
    clearMessage: 'Your sky is clear. Go live under it.',
  },
};

export function routePrescription(weatherId: string): Prescription {
  return (
    PRESCRIPTIONS[weatherId] ?? {
      target: 'breath',
      label: 'Extended breath',
      reason: 'Return to the breath until the field clarifies.',
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
