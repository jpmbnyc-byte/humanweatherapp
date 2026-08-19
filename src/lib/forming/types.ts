export type GesturePoint = {
  x: number;
  y: number;
  t: number;
  pressure: number;
  dwell: number;
};

export type FormSeed = {
  gestureHash: number;
  weatherId: string;
  weatherName: string;
  date: string;
  gridCentroid: [number, number];
  pathSpread: number;
  particleCount: number;
  conditionsSummary: string;
  gesturePoints: GesturePoint[];
};

export type Memento = {
  id: string;
  date: string;
  index: number;
  weatherName: string;
  formSeed: FormSeed;
  conditionsSummary: string;
};

export type BreathPhase = 'Inhale' | 'Hold' | 'Exhale' | 'Hold Out';

export type FormingStage =
  | 'idle'
  | 'gathering'
  | 'breathing'
  | 'capturing'
  | 'mounting'
  | 'stillness'
  | 'complete';

export const FORMING_CYCLE_COUNT = 3;
/** One honestly noticed place is enough to begin a Daymark. */
export const MIN_DUST_FOR_FORMING = 1;
