import type { WeatherState } from '../types';

/** Initial canvas state — keep tiny so App.tsx avoids importing full somatic data. */
export const DEFAULT_WEATHER: WeatherState = {
  id: 'autonomic_stillness',
  title: 'Autonomic Stillness',
  subtitle: 'No signal. Inactive field. The beginning, not an absence.',
  description:
    'The somatic field is clean, quiet, and unwritten. Autonomic stillness is not a void, but the pristine canvas upon which all states are drawn.',
  hrv: 99,
  breathPattern: { inhale: 5, holdIn: 0, exhale: 5, holdOut: 0 },
  clinicalIndex: 'Absolute stillness. Low-frequency dominance.',
  respiratoryRatio: '1:1',
  guidanceText:
    'Rest in this silent, unburdened potential. There is no active weather system because you have not marked any sensations. When you are ready, touch or drag across the grid to begin mapping your internal climate.',
};
