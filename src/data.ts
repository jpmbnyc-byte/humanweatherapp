import { WeatherState, Pathway, FrequencyTone, LightMode, ClassicalPiece, ShinrinYokuProtocol, SolarProtocol } from './types';

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

export const FREQUENCY_TONES: FrequencyTone[] = [
  {
    id: 'delta',
    name: 'Delta · 2.5 Hz',
    hz: 2.5,
    type: 'binaural',
    subtitle: 'Deep sleep. Cellular repair.',
    description: 'Dreamless restoration. Ideal for late-night wind down and high physical recovery.',
    color: '#34495e'
  },
  {
    id: 'theta',
    name: 'Theta · 6 Hz',
    hz: 6,
    type: 'binaural',
    subtitle: 'Deep meditation. Intuition.',
    description: 'Unlocks hypnagogic states and hypnoidal visual imagery. Promotes creative insight.',
    color: '#8e44ad'
  },
  {
    id: 'alpha',
    name: 'Alpha · 10 Hz',
    hz: 10,
    type: 'binaural',
    subtitle: 'Relaxed awareness. Clarity.',
    description: 'Mitigates performance anxiety, clears cognitive static, and balances visual focus.',
    color: '#2980b9'
  },
  {
    id: 'beta',
    name: 'Beta · 20 Hz',
    hz: 20,
    type: 'binaural',
    subtitle: 'Active focus. Problem solving.',
    description: 'Promotes high alert presence, mental concentration, and computational cognitive tasks.',
    color: '#16a085'
  },
  {
    id: 'solfeggio_528',
    name: '528 Hz — The Love Tone',
    hz: 528,
    type: 'solfeggio',
    subtitle: 'Transformation. Cellular resonance.',
    description: 'The ancient frequency of transformation and DNA repair. Promotes a profound sense of security.',
    color: '#c0392b'
  },
  {
    id: 'solfeggio_432',
    name: '432 Hz — Earth Frequency',
    hz: 432,
    type: 'solfeggio',
    subtitle: 'Natural A tuning. Earth harmony.',
    description: 'Resonates with natural harmonics. Releases emotional blockages and establishes organic alignment.',
    color: '#27ae60'
  },
  {
    id: 'solfeggio_396',
    name: '396 Hz — Liberation',
    hz: 396,
    type: 'solfeggio',
    subtitle: 'Releasing fear and guilt.',
    description: 'Grounding frequency designed to clear anxiety, release negative thoughts, and ground the lower body.',
    color: '#d35400'
  },
  {
    id: 'solfeggio_639',
    name: '639 Hz — Connection',
    hz: 639,
    type: 'solfeggio',
    subtitle: 'Heart-centred resonance.',
    description: 'Promotes interpersonal harmony, active listening, and the clearing of relational friction.',
    color: '#e74c3c'
  }
];

export const LIGHT_MODES: LightMode[] = [
  {
    id: 'amber_orange',
    name: 'Amber Orange',
    label: 'Dawn',
    description: 'Serotonin activation. Circadian reset. The body greeting the day.',
    hex: '#e59866',
    glowClass: 'shadow-[0_0_80px_rgba(229,152,102,0.4)]',
    pulseSpeed: 7,
    benefits: 'Triggers cortisol rise to clear waking grogginess and synchronize morning metabolic rhythm.'
  },
  {
    id: 'bright_yellow',
    name: 'Bright Yellow',
    label: 'Solar',
    description: 'Full spectrum simulation. Vitamin D pathway.',
    hex: '#f4d03f',
    glowClass: 'shadow-[0_0_80px_rgba(244,208,63,0.4)]',
    pulseSpeed: 5,
    benefits: 'Mimics solar brightness to boost focus, enhance executive function, and clear winter lethargy.'
  },
  {
    id: 'deep_crimson',
    name: 'Deep Crimson',
    label: 'Rose',
    description: 'Oxytocin resonance. Warmth without stimulation.',
    hex: '#c0392b',
    glowClass: 'shadow-[0_0_80px_rgba(192,57,43,0.4)]',
    pulseSpeed: 8,
    benefits: 'Stimulates vascular dilation and triggers emotional safety, inducing gentle nervous system grounding.'
  },
  {
    id: 'electric_cobalt',
    name: 'Electric Cobalt',
    label: 'Blue',
    description: 'Focus. Cortisol regulation. Morning alertness.',
    hex: '#2471a3',
    glowClass: 'shadow-[0_0_80px_rgba(36,113,163,0.4)]',
    pulseSpeed: 6,
    benefits: 'Inhibits melatonin synthesis immediately, sharpening attention and logical processing.'
  },
  {
    id: 'deep_violet',
    name: 'Deep Violet',
    label: 'Indigo',
    description: 'Melatonin onset. Pre-sleep preparation.',
    hex: '#5b2c6f',
    glowClass: 'shadow-[0_0_80px_rgba(91,44,111,0.4)]',
    pulseSpeed: 9,
    benefits: 'Calms visual sensory circuits and triggers endogenous melatonin production for smooth sleep transition.'
  },
  {
    id: 'forest_green',
    name: 'Forest Green',
    label: 'Emerald',
    description: 'Parasympathetic activation. Nature recognition.',
    hex: '#1e8449',
    glowClass: 'shadow-[0_0_80px_rgba(30,132,73,0.4)]',
    pulseSpeed: 8,
    benefits: 'Resonates with forest phytoncides visually, down-regulating the amygdala and lowering resting heart rate.'
  }
];

export const CLASSICAL_PIECES: ClassicalPiece[] = [
  {
    id: 'clair_de_lune',
    title: 'Clair de Lune',
    composer: 'Claude Debussy',
    weatherState: 'Dewpoint Restorative Slumber',
    description: 'For Dewpoint Restorative states. Dissolves the boundary between listening and being.',
    youtubeUrl: 'https://www.youtube.com/watch?v=WNcsUNKlAKw',
    ambientFrequency: 220,
    carrierFrequency: 222.5,
    explanation: 'Debussy’s fluid impressionism bypasses defensive neural circuits, triggering rapid parasympathetic transition via slow-pulsing tempo shifts.'
  },
  {
    id: 'air_on_g_string',
    title: 'Air on the G String',
    composer: 'Johann Sebastian Bach',
    weatherState: 'Vaporous Resonance Drift',
    description: 'For Equilibrium states. Mathematical cathedrals. Sit inside one.',
    youtubeUrl: 'https://www.youtube.com/watch?v=JSAd3XPxF08',
    ambientFrequency: 147,
    carrierFrequency: 153,
    explanation: 'Bach’s steady metronomic pulse acts as an auditory pacemaker, entraining cardiac and respiratory rhythms to a stable homeostatic baseline.'
  },
  {
    id: 'gymnopedie_1',
    title: 'Gymnopédie No. 1',
    composer: 'Erik Satie',
    weatherState: 'Scattered Atmospheric Drift',
    description: 'For Scattered states. The space between notes is also music.',
    youtubeUrl: 'https://www.youtube.com/watch?v=S-Xm7s9eGxU',
    ambientFrequency: 146,
    carrierFrequency: 152,
    explanation: 'Satie’s minimalist spacing leaves acoustic room for cognitive settling. The deliberate silence between chords reduces sensory overload.'
  },
  {
    id: 'moonlight_sonata',
    title: 'Moonlight Sonata Mvt. I',
    composer: 'Ludwig van Beethoven',
    weatherState: 'Autonomic Stillness',
    description: 'For Night mode. Sounds like it was written from inside.',
    youtubeUrl: 'https://www.youtube.com/watch?v=4Tr0otuiQuU',
    ambientFrequency: 130,
    carrierFrequency: 132.5,
    explanation: 'Beethoven’s triple meter ostinato acts as a heavy somatic anchor, calming motor cortex activity and preparing the brain for delta-wave sleep.'
  },
  {
    id: 'nocturne_chopin',
    title: 'Nocturne Op. 9 No. 2',
    composer: 'Frédéric Chopin',
    weatherState: 'High-Resonant Thermal Coherence',
    description: 'For Flow State. A conversation with himself. Let it be one with you.',
    youtubeUrl: 'https://www.youtube.com/watch?v=9E6b3swgMTY',
    ambientFrequency: 131,
    carrierFrequency: 137,
    explanation: 'Chopin’s sweeping rubato mirrors naturally occurring physiological fluctuations, enhancing heart rate variability (HRV) and emotional resonance.'
  },
  {
    id: 'spiegel_im_spiegel',
    title: 'Spiegel im Spiegel',
    composer: 'Arvo Pärt',
    weatherState: 'All States',
    description: 'For all states. Mirror in the mirror. What silence sounds like when it has courage.',
    youtubeUrl: 'https://www.youtube.com/watch?v=FZu0976CdBA',
    ambientFrequency: 110,
    carrierFrequency: 111.5,
    explanation: 'Pärt’s tintinnabuli style creates a perfectly predictable, non-threatening auditory environment, down-regulating the amygdala and promoting deep neural safety.'
  }
];

export const SHINRIN_YOKU_PROTOCOLS: ShinrinYokuProtocol[] = [
  {
    id: 'high_stress',
    number: 'Protocol 01',
    title: 'High Stress',
    dose: '2 × 2hr weekly',
    biomarkers: 'Cortisol p<0.01. Adrenaline p<0.05. Blood pressure -7–8 mmHg.',
    stats: '87.4% Stress Reduction',
    description: 'Active immersion in broadleaf forests. Focused inhalation of phytoncides (terpenes) from oak and birch, shown to elevate natural killer (NK) cells and drop systemic inflammatory markers.'
  },
  {
    id: 'high_blood_pressure',
    number: 'Protocol 02',
    title: 'High Blood Pressure',
    dose: '7-day immersive',
    biomarkers: 'Renin-angiotensin suppression. Comparable to antihypertensive medication.',
    stats: 'Clinically Equivalent to Antihypertensives',
    description: 'Continuous multiday exposure to evergreen conifers. Deep inhalation of alpha-pinene lowers blood pressure through direct parasympathetic activation and arterial expansion.'
  },
  {
    id: 'sleep_disruption',
    number: 'Protocol 03',
    title: 'Sleep Disruption',
    dose: '2hr late afternoon',
    biomarkers: 'Sleep efficiency to 89.3%. EEG-confirmed alpha-wave increase.',
    stats: '+14.2% Deep Sleep Duration',
    description: 'Late afternoon walk beneath tree canopy. Sun filtering through leaves (Komorebi) blocks melatonin suppression while boosting evening sleep spindle density.'
  },
  {
    id: 'immune_support',
    number: 'Protocol 04',
    title: 'Immune Support',
    dose: '3-day / 2-night',
    biomarkers: 'NK cell activity elevated 30+ days post-trip.',
    stats: '+53% Natural Killer Cell Active Density',
    description: 'Extended wilderness camp. The sustained aromatic profile of cedar wood activates long-term immune memory, elevating intracellular anticancer proteins.'
  },
  {
    id: 'low_mood',
    number: 'Protocol 05',
    title: 'Low Mood',
    dose: '20 min daily',
    biomarkers: 'Blood serotonin increase confirmed. Tested across 280 subjects, 24 forests.',
    stats: 'Serotonin Balance Confirmed',
    description: 'Brief daily contact with soil microbes (M. vaccae) and visual fractal canopy. Activates prefrontal serotonin release, mimicking antidepressant actions without side effects.'
  },
  {
    id: 'blood_sugar',
    number: 'Protocol 06',
    title: 'Blood Sugar',
    dose: '2hr twice weekly',
    biomarkers: 'Glucose 179→108 mg/dL. HbA1c 6.9→6.5% confirmed.',
    stats: 'Improved HbA1c Stability',
    description: 'Steady pace walking in mixed evergreen-deciduous groves. Activates high-efficiency glucose metabolism and improves insulin receptor sensitivity under forest light conditions.'
  }
];

export const SOLAR_PROTOCOLS: SolarProtocol[] = [
  {
    id: 'uv_b',
    title: 'UV-B Window (Vitamin D)',
    description: 'Midday solar ray containing peak UV-B wavelengths for biological synthesis.',
    duration: '10–30 min midday',
    rayType: 'UV-B Wavelengths',
    timeOfDay: 'Midday (Peak Solar Angle)'
  },
  {
    id: 'uv_a',
    title: 'UV-A Window (Circadian Calibration)',
    description: 'Morning low-angle solar rays containing blue-spectrum light for master clock regulation.',
    duration: '15–30 min after waking',
    rayType: 'UV-A + Blue Wavelengths',
    timeOfDay: 'First hour after sunrise'
  },
  {
    id: 'visible_light',
    title: 'Visible Light (Serotonin Synthesis)',
    description: 'Full spectrum visible solar rays promoting emotional health and neurotransmitter balance.',
    duration: '30–60 min daily',
    rayType: 'Visible Spectrum (400-700nm)',
    timeOfDay: 'Throughout the day'
  },
  {
    id: 'red_light',
    title: 'Red Light (Photobiomodulation)',
    description: '660nm red wavelengths targeting mitochondria to stimulate ATP synthesis and repair.',
    duration: '10–20 min morning/evening',
    rayType: 'Red Spectrum (660nm)',
    timeOfDay: 'Sunrise & Sunset Windows'
  },
  {
    id: 'near_infrared',
    title: 'Near-Infrared (Deep Tissue Repair)',
    description: 'Deeply penetrative infrared spectrum supporting cellular health and capillary density.',
    duration: '20–40 min afternoon',
    rayType: 'Near-Infrared (850nm)',
    timeOfDay: 'Afternoon'
  },
  {
    id: 'the_dawn_protocol',
    title: 'The Dawn Protocol (Full Spectrum Reset)',
    description: 'The golden hour full spectrum containing perfect warm, balanced light ratios.',
    duration: 'First 30 min of the day',
    rayType: 'Full Spectrum (Low Intensity)',
    timeOfDay: 'Sunrise (First 30 minutes)'
  }
];
