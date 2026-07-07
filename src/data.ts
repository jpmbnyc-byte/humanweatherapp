import { FrequencyTone, LightMode, ClassicalPiece, ShinrinYokuProtocol, SolarProtocol } from './types';

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
