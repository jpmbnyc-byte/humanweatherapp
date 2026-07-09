import { createContext, useContext } from 'react';
import type {
  BreathPhase,
  FormSeed,
  FormingStage,
  Memento,
} from './types';

export type FormingDustApi = {
  update: (
    dt: number,
    pointer: { x: number; y: number } | null,
    scatter: number,
    lift: number,
    tighten: number,
  ) => void;
  readonly count: number;
};

export type FormingContextValue = {
  stage: FormingStage;
  dust: FormingDustApi;
  formSeed: FormSeed | null;
  coalesce: number;
  breathPhase: BreathPhase;
  breathScatter: number;
  cycleIndex: number;
  canForm: boolean;
  mounting: boolean;
  stillness: boolean;
  scalePunch: number;
  warmthBloom: number;
  showFrame: boolean;
  caption: string;
  mementos: Memento[];
  todaySaved: boolean;
  reduceMotion: boolean;
  displaySeed: FormSeed | null;
  registerTouch: (normX: number, normY: number, dwellMs: number) => void;
  onBreathPhase: (phase: BreathPhase) => void;
  onExhaleEnd: (cycle: number) => void;
  abortForming: () => void;
  refreshMementos: () => void;
};

export const FormingContext = createContext<FormingContextValue | null>(null);

export function useForming(): FormingContextValue {
  const ctx = useContext(FormingContext);
  if (!ctx) throw new Error('useForming requires FormingProvider');
  return ctx;
}

export function useFormingOptional(): FormingContextValue | null {
  return useContext(FormingContext);
}
