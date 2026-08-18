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
      'Current conditions: Sympathetic Heat Dome. Felt: heat in the chest and temples. Fact: sympathetic load is elevated. Faith: the heat moves when it is witnessed, not fought.',
  },
  scattered_atmospheric_drift: {
    felt: 'Attention pulled in many directions. Nothing lands long enough to settle.',
    fact: 'Low internal coherence. Alpha-beta noise across the field.',
    faith: 'One equal breath at a time is enough to gather the drift.',
    spoken:
      'Current conditions: Scattered Atmospheric Drift. Felt: attention pulled in many directions. Fact: attention is dispersed across the field. Faith: one equal breath gathers the drift.',
  },
  high_resonant_thermal_coherence: {
    felt: 'Warm, centered flow. Doing and noticing share the same room.',
    fact: 'Parasympathetic dominance. HRV spectrum optimal.',
    faith: 'Nothing needs fixing here. Rest in the wave you already are.',
    spoken:
      'Current conditions: High-Resonant Thermal Coherence. Felt: warm centered flow. Fact: the marks gather closely across the field. Faith: rest in the wave you already are.',
  },
  dewpoint_restorative_slumber: {
    felt: 'Weight sinking. Shoulders drop; the pelvis holds the day.',
    fact: 'Vagal rest active. Metabolic demand low.',
    faith: 'Let the surface beneath you carry what you no longer need to hold.',
    spoken:
      'Current conditions: Dewpoint Restorative Slumber. Felt: weight sinking through the body. Fact: the marks gather lower in the field. Faith: let the surface carry what you release.',
  },
  vaporous_resonance_drift: {
    felt: 'Quiet equilibrium — neither driven nor heavy. A thin spiritual fog.',
    fact: 'Homeostatic baseline. Sympathetic and parasympathetic in balance.',
    faith: 'Neutrality is not emptiness. It is room to choose your next direction.',
    spoken:
      'Current conditions: Vaporous Resonance Drift. Felt: quiet equilibrium with a thin fog. Fact: the marks rest near the center of the field. Faith: neutrality is room to choose.',
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
      'Current conditions: Frontal Tension Headache. Felt: pressure at the temples. Fact: the marks gather around the head. Faith: lengthen the exhale and let the heat drain.',
  },
  sleep_debt_drift: {
    felt: 'Tired but wired. Eyes heavy, mind still narrating.',
    fact: 'Sleep pressure elevated. Fragmented or insufficient rest on the ledger.',
    faith: 'You are under-fueled, not failing. Evening can arrive early today.',
    spoken:
      'Current conditions: Sleep Debt Drift. Felt: tired but wired. Fact: the selected pathway names a need for rest. Faith: honor rest without punishing the day.',
  },
  cognitive_morning_fog: {
    felt: 'Thoughts move through cotton. Focus slips before it lands.',
    fact: 'Reduced morning alpha coherence. Mild hypofrontality on waking.',
    faith: 'Equal breath before equal effort — clarity often follows pacing, not force.',
    spoken:
      'Current conditions: Cognitive Morning Fog. Felt: slow thinking behind a veil. Fact: attention may take time to gather after waking. Faith: one matched breath at a time.',
  },
  barometric_rainy_grey: {
    felt: 'Grey light, heavy air. The weather has moved inside.',
    fact: 'Circadian amplitude reduced. Low lux and barometric drag.',
    faith: 'You are not lazy — the sky is dim. A little light and movement can help.',
    spoken:
      'Current conditions: Barometric Rainy Grey. Felt: grey weather inside and out. Fact: available daylight may be lower. Faith: brief bright light, gentle pace.',
  },
};

export function getConditionCopy(weatherId: string): ConditionCopy | null {
  return CONDITIONS_COPY[weatherId] ?? null;
}
