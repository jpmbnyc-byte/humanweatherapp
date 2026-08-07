export type TripleRegister = {
  felt: string;
  fact: string;
  faith: string;
};

export type ConditionCopy = TripleRegister & {
  /** Full spoken Conditions line for optional device TTS. */
  spoken: string;
};

export const CONDITIONS_COPY: Record<string, ConditionCopy> = {
  sympathetic_heat_dome: {
    felt: 'Heat in the chest and temples. The body is lit and scanning.',
    fact: 'Sympathetic load elevated. HRV coherence reduced.',
    faith: 'You do not have to cool down by force. The heat moves when it is witnessed.',
    spoken:
      'Current conditions: Sympathetic Heat Dome. Coherence forty-two percent. Felt: heat in the chest and temples. Fact: sympathetic load is elevated. Faith: the heat moves when it is witnessed, not fought.',
  },
  scattered_atmospheric_drift: {
    felt: 'Attention pulled in many directions. Nothing lands long enough to settle.',
    fact: 'Low internal coherence. Alpha-beta noise across the field.',
    faith: 'One equal breath at a time is enough to gather the drift.',
    spoken:
      'Current conditions: Scattered Atmospheric Drift. Coherence fifty-five percent. Felt: attention pulled in many directions. Fact: low internal coherence. Faith: one equal breath gathers the drift.',
  },
  high_resonant_thermal_coherence: {
    felt: 'Warm, centered flow. Doing and noticing share the same room.',
    fact: 'Parasympathetic dominance. HRV spectrum optimal.',
    faith: 'Nothing needs fixing here. Rest in the wave you already are.',
    spoken:
      'Current conditions: High-Resonant Thermal Coherence. Coherence ninety-four percent. Felt: warm centered flow. Fact: parasympathetic dominance. Faith: rest in the wave you already are.',
  },
  dewpoint_restorative_slumber: {
    felt: 'Weight sinking. Shoulders drop; the pelvis holds the day.',
    fact: 'Vagal rest active. Metabolic demand low.',
    faith: 'Let the surface beneath you carry what you no longer need to hold.',
    spoken:
      'Current conditions: Dewpoint Restorative Slumber. Coherence eighty-eight percent. Felt: weight sinking through the body. Fact: vagal rest is active. Faith: let the surface carry what you release.',
  },
  vaporous_resonance_drift: {
    felt: 'Quiet equilibrium — neither driven nor heavy. A thin spiritual fog.',
    fact: 'Homeostatic baseline. Sympathetic and parasympathetic in balance.',
    faith: 'Neutrality is not emptiness. It is room to choose your next direction.',
    spoken:
      'Current conditions: Vaporous Resonance Drift. Coherence seventy-eight percent. Felt: quiet equilibrium with a thin fog. Fact: homeostatic baseline. Faith: neutrality is room to choose.',
  },
  autonomic_stillness: {
    felt: 'The field is unmarked — clean canvas, no weather yet drawn.',
    fact: 'No somatic signal filed. Stillness is the starting condition.',
    faith: 'Stillness is not absence. It is the threshold before the first true mark.',
    spoken:
      'Current conditions: Autonomic Stillness. The field is unmarked. Touch the grid when you are ready to name what you feel.',
  },
  frontal_tension_headache: {
    felt: 'Band of pressure at the temples or forehead. The head is holding the day.',
    fact: 'Pericranial tension elevated. Sympathetic vascular load in the head.',
    faith: 'The pressure is information, not a verdict. Cool air and slow exhale are medicine enough to start.',
    spoken:
      'Current conditions: Frontal Tension Headache. Coherence forty-eight percent. Felt: pressure at the temples. Fact: sympathetic hold in the head. Faith: lengthen the exhale and let the heat drain.',
  },
  sleep_debt_drift: {
    felt: 'Tired but wired. Eyes heavy, mind still narrating.',
    fact: 'Sleep pressure elevated. Fragmented or insufficient rest on the ledger.',
    faith: 'You are under-fueled, not failing. Evening can arrive early today.',
    spoken:
      'Current conditions: Sleep Debt Drift. Coherence fifty-two percent. Felt: tired but wired. Fact: sleep debt is active. Faith: honor rest without punishing the day.',
  },
  cognitive_morning_fog: {
    felt: 'Thoughts move through cotton. Focus slips before it lands.',
    fact: 'Reduced morning alpha coherence. Mild hypofrontality on waking.',
    faith: 'Equal breath before equal effort — clarity often follows pacing, not force.',
    spoken:
      'Current conditions: Cognitive Morning Fog. Coherence fifty-eight percent. Felt: slow thinking behind a veil. Fact: alpha coherence is low. Faith: one matched breath at a time.',
  },
  barometric_rainy_grey: {
    felt: 'Grey light, heavy air. The weather has moved inside.',
    fact: 'Circadian amplitude reduced. Low lux and barometric drag.',
    faith: 'You are not lazy — the sky is dim. A little light and movement can help.',
    spoken:
      'Current conditions: Barometric Rainy Grey. Coherence sixty-two percent. Felt: grey weather inside and out. Fact: circadian signal is muted. Faith: brief bright light, gentle pace.',
  },
};

export function getConditionCopy(weatherId: string): ConditionCopy | null {
  return CONDITIONS_COPY[weatherId] ?? null;
}
