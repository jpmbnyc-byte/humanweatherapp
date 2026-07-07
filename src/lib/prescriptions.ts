import type { WeatherState } from '../types';

export type PrescriptionType =
  | 'shinrin-yoku'
  | 'breathwork'
  | 'aura-tones'
  | 'tender'
  | 'clear-sky'
  | null;

export interface Prescription {
  type: PrescriptionType;
  label: string;
  action: string;
}

export function routePrescription(weather: WeatherState): Prescription {
  switch (weather.id) {
    case 'sympathetic_heat_dome':
      return {
        type: 'shinrin-yoku',
        label: 'Shinrin-Yoku',
        action: 'Walk to canopy',
      };
    case 'scattered_atmospheric_drift':
      return {
        type: 'breathwork',
        label: 'Calibrated Breathwork',
        action: 'Begin extended pacing',
      };
    case 'dewpoint_restorative_slumber':
      return {
        type: 'aura-tones',
        label: 'Aura & Tones',
        action: 'Enter immersion',
      };
    case 'vaporous_resonance_drift':
      return {
        type: 'tender',
        label: 'The Tender',
        action: 'Receive a passage',
      };
    case 'high_resonant_thermal_coherence':
    case 'autonomic_stillness':
      return {
        type: 'clear-sky',
        label: 'Clear Sky',
        action: 'Your sky is clear. Go live under it.',
      };
    default:
      return {
        type: 'breathwork',
        label: 'Calibrated Breathwork',
        action: 'Begin extended pacing',
      };
  }
}
