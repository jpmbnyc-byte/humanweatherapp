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
  }
];
