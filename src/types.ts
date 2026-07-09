export interface WeatherState {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  hrv: number;
  breathPattern: {
    inhale: number;
    holdIn: number;
    exhale: number;
    holdOut: number;
  };
  clinicalIndex: string;
  respiratoryRatio: string;
  guidanceText: string;
}

export interface Pathway {
  id: string;
  name: string;
  description: string;
  cells: [number, number][]; // coordinates on 8x8 grid
}

export interface FrequencyTone {
  id: string;
  name: string;
  hz: number;
  type: 'binaural' | 'solfeggio';
  subtitle: string;
  description: string;
  color: string;
}

export interface LightMode {
  id: string;
  name: string;
  label: string;
  description: string;
  hex: string;
  glowClass: string;
  pulseSpeed: number; // in seconds
  benefits: string;
}

export interface ClassicalPiece {
  id: string;
  title: string;
  composer: string;
  weatherState: string;
  description: string;
  ambientFrequency: number; // Hz for live synthesis root
  carrierFrequency: number; // Hz for carrier (binaural-like)
  explanation: string;
}

export interface ShinrinYokuProtocol {
  id: string;
  number: string;
  title: string;
  dose: string;
  biomarkers: string;
  stats: string;
  description: string;
}

export interface SolarProtocol {
  id: string;
  title: string;
  description: string;
  duration: string;
  rayType: string;
  timeOfDay: string;
}

export interface SolarWeathergram {
  id: string;
  time: string;
  title: string;
  recommendation: string;
  status: 'NOW' | 'DONE' | 'SOON';
}
