import { CONDITIONS_COPY } from '../../data/conditions';
import { appendReading } from './readings';

export type ReadingStep = 'question' | 'touch' | 'conditions';

export const READING_STEPS: ReadingStep[] = ['question', 'touch', 'conditions'];

export const READING_QUESTION = 'What is your weather right now?';

/** Target under twenty seconds for the three-step reading flow. */
export const READING_BUDGET_MS = 20_000;

export type ReadingFlowState = {
  step: ReadingStep;
  startedAt: number;
  weatherId: string | null;
  complete: boolean;
};

export function createReadingFlowState(now = Date.now()): ReadingFlowState {
  return { step: 'question', startedAt: now, weatherId: null, complete: false };
}

export function advanceReadingStep(state: ReadingFlowState): ReadingFlowState {
  const idx = READING_STEPS.indexOf(state.step);
  if (idx < 0 || idx >= READING_STEPS.length - 1) {
    return { ...state, complete: true };
  }
  return { ...state, step: READING_STEPS[idx + 1] };
}

export function readingElapsedMs(state: ReadingFlowState, now = Date.now()): number {
  return now - state.startedAt;
}

export function readingWithinBudget(state: ReadingFlowState, now = Date.now()): boolean {
  return readingElapsedMs(state, now) <= READING_BUDGET_MS;
}

/** Conditions copy for reading flow — no numeric metrics on screen. */
export function readingConditionsLines(weatherId: string): {
  felt: string;
  fact: string;
  faith: string;
} {
  const entry = CONDITIONS_COPY[weatherId];
  if (!entry) {
    return {
      felt: 'Something is moving in the field.',
      fact: 'The grid holds a pattern worth witnessing.',
      faith: 'Be still; the weather is passing through you, not staying.',
    };
  }
  return { felt: entry.felt, fact: entry.fact, faith: entry.faith };
}

export async function completeReadingFlow(weatherId: string): Promise<void> {
  const felt = readingConditionsLines(weatherId).felt;
  await appendReading({
    weatherId,
    feltLine: felt,
    source: 'reading_flow',
    office: null,
  });
}
