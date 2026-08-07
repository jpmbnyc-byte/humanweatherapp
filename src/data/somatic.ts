import { WeatherState, Pathway } from '../types';

export const WEATHER_STATES: WeatherState[] = [
  {
    id: 'sympathetic_heat_dome',
    title: 'Sympathetic Heat Dome',
    subtitle: 'Hyper-Arousal. High neural load.',
    description: 'The system is running hot. Adrenaline is circulating, and cognitive fields are locked in active threat-assessment. There is no need to forcefully calm down. Just acknowledge the heat. The somatic temperature is real.',
    hrv: 42,
    breathPattern: { inhale: 4, holdIn: 0, exhale: 7, holdOut: 0 },
    clinicalIndex: 'Adrenaline/Cortisol ratio elevated (3.2x baseline)',
    respiratoryRatio: '1:1.75',
    guidanceText: 'Give your nervous system permission to be fully awake right now. Do not fight the arousal. Instead, slowly elongate the exhalation. Let the out-breath act as a natural pressure valve, draining the thermal load from your chest and shoulders.'
  },
  {
    id: 'scattered_atmospheric_drift',
    title: 'Scattered Atmospheric Drift',
    subtitle: 'Disconnected noise. Many signals, none connected.',
    description: 'Attention is fragmented across multiple points. You are here, but your mind is elsewhere, drifting in a low-coherence cloud of micro-stimuli. Internal coherence is low, and grounding is absent.',
    hrv: 55,
    breathPattern: { inhale: 4, holdIn: 0, exhale: 4, holdOut: 0 },
    clinicalIndex: 'Vagal tone variable. High alpha-beta noise.',
    respiratoryRatio: '1:1',
    guidanceText: 'Restoring order requires equal-duration pacing (Sama Vritti). Let each inhalation match each exhalation exactly. Anchor your awareness directly to the tactile sensation of air entering the nostrils. Let the noise drift away, unguided.'
  },
  {
    id: 'high_resonant_thermal_coherence',
    title: 'High-Resonant Thermal Coherence',
    subtitle: 'Flow state. Parasympathetic dominance.',
    description: 'You are centered. The boundary between observing and doing has softened. The autonomic nervous system is in a highly receptive, coherent state. Homeostasis is actively humming.',
    hrv: 94,
    breathPattern: { inhale: 6, holdIn: 0, exhale: 8, holdOut: 0 },
    clinicalIndex: 'Optimal HRV power spectrum density. High vagal tone.',
    respiratoryRatio: '1:1.33',
    guidanceText: 'This is a state of integrated physiological flow. There is nothing to fix, nothing to change. Simply rest in this aligned wave. Let your breath expand naturally, using the 6:8 ratio to lock in this exquisite, self-regulating resonance.'
  },
  {
    id: 'dewpoint_restorative_slumber',
    title: 'Dewpoint Restorative Slumber',
    subtitle: 'Vagal rest. Deep parasympathetic restoration.',
    description: 'The body is sinking into deep restoration. Blood pressure is dipping, and muscle tissue is releasing its residual holding patterns. Vagal rest is active and heavy.',
    hrv: 88,
    breathPattern: { inhale: 5, holdIn: 0, exhale: 5, holdOut: 0 },
    clinicalIndex: 'Acetylcholine dominance. Low metabolic demand.',
    respiratoryRatio: '1:1',
    guidanceText: 'Allow your physical weight to be fully supported by whatever surface is beneath you. Let go of any remaining effort in your posture. Breathe slowly and effortlessly, matching the 5:5 pulse to nourish your cells and nervous system.'
  },
  {
    id: 'vaporous_resonance_drift',
    title: 'Vaporous Resonance Drift',
    subtitle: 'Equilibrium. Homeostatic balance.',
    description: 'You are at neutral. Neither running hot in overdrive nor sinking deeply into heavy slumber. This is a quiet, vaporous equilibrium—a clean state of metabolic balance.',
    hrv: 78,
    breathPattern: { inhale: 5, holdIn: 0, exhale: 6, holdOut: 0 },
    clinicalIndex: 'Homeostatic baseline. Symmetric sympathetic-parasympathetic balance.',
    respiratoryRatio: '1:1.2',
    guidanceText: 'Use this balanced state to observe your thoughts and environment without judgment. Your nervous system is stable, poised, and efficient. Breathe with a gentle 5-second inhale and 6-second exhale to preserve this tranquil state.'
  },
  {
    id: 'autonomic_stillness',
    title: 'Autonomic Stillness',
    subtitle: 'No signal. Inactive field. The beginning, not an absence.',
    description: 'The somatic field is clean, quiet, and unwritten. Autonomic stillness is not a void, but the pristine canvas upon which all states are drawn.',
    hrv: 99,
    breathPattern: { inhale: 5, holdIn: 0, exhale: 5, holdOut: 0 },
    clinicalIndex: 'Absolute stillness. Low-frequency dominance.',
    respiratoryRatio: '1:1',
    guidanceText: 'Rest in this silent, unburdened potential. There is no active weather system because you have not marked any sensations. When you are ready, touch or drag across the grid to begin mapping your internal climate.'
  },
  {
    id: 'frontal_tension_headache',
    title: 'Frontal Tension Headache',
    subtitle: 'Pressure at the temples. Sympathetic hold in the head.',
    description: 'Sensation clusters at the forehead and temples — the body bracing against noise, glare, or unfinished strain. Vascular tone in the head is elevated; the neck may be quietly participating.',
    hrv: 48,
    breathPattern: { inhale: 4, holdIn: 0, exhale: 8, holdOut: 0 },
    clinicalIndex: 'Elevated pericranial muscle tone. Sympathetic vascular load.',
    respiratoryRatio: '1:2',
    guidanceText: 'Do not fight the pressure — lengthen the exhale as a release valve. Let each out-breath drain heat from the temples and jaw. Cool air, dim light, and unhurried pace are allies today.'
  },
  {
    id: 'sleep_debt_drift',
    title: 'Sleep Debt Drift',
    subtitle: 'Under-rested. Mind racing behind tired eyes.',
    description: 'You are running on incomplete sleep — not the deep restorative slumber of choice, but the thin, fragmented rest of a debt still owed. The head holds the ledger.',
    hrv: 52,
    breathPattern: { inhale: 4, holdIn: 0, exhale: 6, holdOut: 0 },
    clinicalIndex: 'Sleep pressure elevated. Cortisol awakening response blunted.',
    respiratoryRatio: '1:1.5',
    guidanceText: 'Honor the debt without punishing the day. Keep stimulation low this afternoon; let evening arrive early. Breathe slowly — you are not failing, you are under-fueled.'
  },
  {
    id: 'cognitive_morning_fog',
    title: 'Cognitive Morning Fog',
    subtitle: 'Slow thinking. Attention won\'t quite land.',
    description: 'The field is humid with unformed thought — not scattered panic, but a dull veil between you and clarity. Tasks feel one step farther than they should.',
    hrv: 58,
    breathPattern: { inhale: 4, holdIn: 0, exhale: 4, holdOut: 0 },
    clinicalIndex: 'Reduced alpha coherence. Mild hypofrontality on waking.',
    respiratoryRatio: '1:1',
    guidanceText: 'Equal breath before equal effort. Match each inhale to each exhale at the nostrils until the fog thins. Light movement and morning spectrum help — force is not required.'
  },
  {
    id: 'barometric_rainy_grey',
    title: 'Barometric Rainy Grey',
    subtitle: 'Low light. Heavy air. Grey outside, grey inside.',
    description: 'The weather has entered the body — low barometric pressure, muted lux, and the familiar drag of an overcast day. Energy is present but diffuse, like rain on glass.',
    hrv: 62,
    breathPattern: { inhale: 5, holdIn: 0, exhale: 6, holdOut: 0 },
    clinicalIndex: 'Circadian amplitude reduced. Sub-threshold seasonal drag.',
    respiratoryRatio: '1:1.2',
    guidanceText: 'You are not lazy — the sky is dim. A brief bright-light pause and gentle movement can lift circadian signal without overriding the quiet the rain offers.'
  }
];

export const PATHWAYS: Pathway[] = [
  {
    id: 'high_anxiety',
    name: 'High Anxiety',
    description: 'Heavy chest, high heart rate, thermal load in the head.',
    cells: [[0, 3], [0, 4], [1, 2], [1, 3], [1, 4], [1, 5], [2, 3], [2, 4]]
  },
  {
    id: 'deep_rest',
    name: 'Deep Rest',
    description: 'Heavy pelvic floor, dropping shoulders, slow metabolic state.',
    cells: [[6, 3], [6, 4], [7, 2], [7, 3], [7, 4], [7, 5], [5, 3], [5, 4]]
  },
  {
    id: 'flow_state',
    name: 'Flow State',
    description: 'Perfect, symmetrical distribution of energy in the solar plexus.',
    cells: [[3, 3], [3, 4], [4, 3], [4, 4], [2, 3], [2, 4], [5, 3], [5, 4], [3, 2], [3, 5], [4, 2], [4, 5]]
  },
  {
    id: 'scattered',
    name: 'Scattered',
    description: 'Fragmented focus with points of tension scattered in isolation.',
    cells: [[0, 1], [1, 6], [3, 0], [4, 7], [6, 1], [7, 5]]
  },
  {
    id: 'overdrive',
    name: 'Overdrive',
    description: 'Intense neural firing across the entire sensory cortex.',
    cells: [
      [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7],
      [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [2, 3], [2, 4]
    ]
  },
  {
    id: 'headache',
    name: 'Headache',
    description: 'Pressure at temples, forehead, or base of skull.',
    cells: [[0, 2], [0, 3], [0, 4], [0, 5], [1, 2], [1, 3], [1, 4], [1, 5]]
  },
  {
    id: 'poor_sleep',
    name: 'Poor Sleep',
    description: 'Racing mind, shallow rest, morning heaviness.',
    cells: [[0, 3], [0, 4], [1, 2], [1, 3], [1, 4], [1, 5], [2, 3], [2, 4]]
  },
  {
    id: 'mental_fog',
    name: 'Mental Fog',
    description: 'Slow thinking, dull focus, hard to land on a task.',
    cells: [[1, 1], [1, 2], [2, 3], [2, 4], [2, 5], [3, 2], [3, 3], [3, 4]]
  },
  {
    id: 'rainy_day',
    name: 'Rainy Day',
    description: 'Grey outside, low energy, barometric heaviness.',
    cells: [[2, 2], [2, 3], [2, 4], [2, 5], [3, 2], [3, 3], [3, 4], [3, 5], [4, 2], [4, 3], [4, 4], [4, 5]]
  }
];
