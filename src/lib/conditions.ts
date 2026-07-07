import { WEATHER_STATES } from '../data';
import type { WeatherState } from '../types';

export interface ConditionsData {
  header: string;
  felt: string;
  fact: string;
  faith: string;
}

const TRIPLE_REGISTERS: Record<string, Omit<ConditionsData, 'header'>> = {
  sympathetic_heat_dome: {
    felt: "There's static in your chest that wants movement.",
    fact: 'Your mapping suggests sympathetic activation — this breath pattern targets vagal tone.',
    faith: 'Be still; the weather is passing through you, not staying.',
  },
  scattered_atmospheric_drift: {
    felt: 'Attention scatters like wind across open water.',
    fact: 'Low coherence detected — equal-duration pacing restores signal integration.',
    faith: 'The fragments will settle when you stop chasing them.',
  },
  high_resonant_thermal_coherence: {
    felt: 'A quiet warmth holds the center of your field.',
    fact: 'Parasympathetic dominance with high HRV coherence — maintain without forcing.',
    faith: 'This is inheritance surfacing. Receive it.',
  },
  dewpoint_restorative_slumber: {
    felt: 'Weight gathers low — the body asking to descend.',
    fact: 'Vagal rest active. Metabolic demand low. Support the descent.',
    faith: 'Let the ground receive what you have been carrying.',
  },
  vaporous_resonance_drift: {
    felt: 'Neither storm nor stillness — a vaporous equilibrium.',
    fact: 'Homeostatic baseline. Symmetric autonomic balance.',
    faith: 'Neutral weather is not absence. It is readiness.',
  },
  autonomic_stillness: {
    felt: 'The field is quiet — unwritten, waiting.',
    fact: 'No active pattern mapped. The canvas is clear.',
    faith: 'Stillness is the beginning, not the end.',
  },
};

export function buildConditions(weather: WeatherState): ConditionsData {
  const register = TRIPLE_REGISTERS[weather.id] ?? TRIPLE_REGISTERS.autonomic_stillness;
  const clinicalLabel = weather.title.toUpperCase().replace(/-/g, ' ');
  return {
    header: `CURRENT CONDITIONS: ${clinicalLabel} · COHERENCE ${weather.hrv}%`,
    ...register,
  };
}

export function getWeatherById(id: string): WeatherState {
  return WEATHER_STATES.find((s) => s.id === id) ?? WEATHER_STATES[5];
}

export function formatConditionsForSpeech(conditions: ConditionsData): string {
  return `${conditions.felt} ${conditions.fact} ${conditions.faith}`;
}
