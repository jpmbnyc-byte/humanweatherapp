import { idbGetJson, idbSetJson } from '../idb';
import { routePrescription } from '../prescriptionRouter';
import { buildPatternSummary } from './patternView';

export type VocabularyProfile = {
  preferredRegister: 'felt' | 'fact' | 'faith';
  seenWeatherIds: string[];
  corollaryIds: string[];
};

import { HW_KEYS } from './keys';

const COROLLARY_MAP: Record<string, string[]> = {
  sympathetic_heat_dome: ['extended_exhale', 'shinrin'],
  scattered_atmospheric_drift: ['equal_breath', 'breath'],
  high_resonant_thermal_coherence: ['clear_sky'],
  dewpoint_restorative_slumber: ['aura_tones', 'light_indigo'],
  vaporous_resonance_drift: ['tender', 'spoken_passage'],
  autonomic_stillness: ['witness_only'],
};

export async function getVocabularyProfile(): Promise<VocabularyProfile> {
  const stored = await idbGetJson<VocabularyProfile>(HW_KEYS.vocabularyProfile);
  return (
    stored ?? {
      preferredRegister: 'felt',
      seenWeatherIds: [],
      corollaryIds: [],
    }
  );
}

export async function noteWeatherObservation(weatherId: string): Promise<VocabularyProfile> {
  const profile = await getVocabularyProfile();
  if (!profile.seenWeatherIds.includes(weatherId)) {
    profile.seenWeatherIds.unshift(weatherId);
    profile.seenWeatherIds = profile.seenWeatherIds.slice(0, 30);
  }
  const corollaries = COROLLARY_MAP[weatherId] ?? ['breath'];
  profile.corollaryIds = [...new Set([...corollaries, ...profile.corollaryIds])].slice(0, 12);
  await idbSetJson(HW_KEYS.vocabularyProfile, profile);
  return profile;
}

export type CorollaryRecommendation = {
  id: string;
  label: string;
  reason: string;
};

export async function recommendCorollaries(weatherId: string): Promise<CorollaryRecommendation[]> {
  const profile = await getVocabularyProfile();
  const rx = routePrescription(weatherId);
  const base: CorollaryRecommendation = {
    id: rx.target,
    label: rx.label,
    reason: rx.reason,
  };

  const ids = profile.corollaryIds.length
    ? profile.corollaryIds
    : COROLLARY_MAP[weatherId] ?? ['breath'];

  const extras = ids
    .filter(id => id !== rx.target)
    .slice(0, 2)
    .map(id => ({
      id,
      label: id.replace(/_/g, ' '),
      reason: 'Drawn from your recent field pattern.',
    }));

  const summary = await buildPatternSummary();
  if (summary.dominantWeatherId && summary.dominantWeatherId !== weatherId) {
    extras.push({
      id: 'pattern_echo',
      label: 'Return to dominant pattern',
      reason: `Your field has often named ${summary.dominantWeatherId.replace(/_/g, ' ')}.`,
    });
  }

  return [base, ...extras];
}

/** Adaptive line variant — shorter copy after repeated exposures. */
export function adaptiveLine(full: string, weatherId: string, seenCount: number): string {
  if (seenCount >= 5) return full.split('.')[0] + '.';
  if (seenCount >= 3) {
    const words = full.split(/\s+/);
    return words.slice(0, Math.ceil(words.length * 0.7)).join(' ') + '…';
  }
  return full;
}
