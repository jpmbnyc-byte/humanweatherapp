import { describe, expect, it } from 'vitest';
import {
  advanceReadingStep,
  createReadingFlowState,
  readingWithinBudget,
  READING_BUDGET_MS,
} from './readingFlow';
import { isValidReactionMs, medianReactionMs } from './pvt';
import { slowFieldDurationMs, SLOW_FIELD_MAX_HZ } from './slowField';
import { tierGateSnapshot, REVERSE_TRIAL_DAYS, TRIAL_FOOTLINE_START_DAY } from './tierGate';
import type { EntitlementRecord } from '../entitlement';

describe('readingFlow', () => {
  it('advances through three steps', () => {
    let state = createReadingFlowState();
    expect(state.step).toBe('question');
    state = advanceReadingStep(state);
    expect(state.step).toBe('touch');
    state = advanceReadingStep(state);
    expect(state.step).toBe('conditions');
    state = advanceReadingStep(state);
    expect(state.complete).toBe(true);
  });

  it('respects twenty second budget', () => {
    const state = createReadingFlowState(Date.now() - READING_BUDGET_MS + 1000);
    expect(readingWithinBudget(state)).toBe(true);
    const late = createReadingFlowState(Date.now() - READING_BUDGET_MS - 1);
    expect(readingWithinBudget(late)).toBe(false);
  });
});

describe('pvt', () => {
  it('validates reaction window', () => {
    expect(isValidReactionMs(250)).toBe(true);
    expect(isValidReactionMs(50)).toBe(false);
    expect(isValidReactionMs(900)).toBe(false);
  });

  it('computes median', () => {
    expect(
      medianReactionMs([
        { id: '1', at: '', reactionMs: 200, valid: true },
        { id: '2', at: '', reactionMs: 300, valid: true },
        { id: '3', at: '', reactionMs: 50, valid: false },
      ]),
    ).toBe(250);
  });
});

describe('slowField', () => {
  it('caps animation at 2 Hz', () => {
    expect(slowFieldDurationMs(100)).toBe(500);
    expect(slowFieldDurationMs(600, { enabled: true, photosensitiveGate: true, maxHz: SLOW_FIELD_MAX_HZ })).toBe(600);
  });
});

describe('tierGate', () => {
  it('shows harness footline on days 6–7 of reverse trial', () => {
    const record: EntitlementRecord = {
      state: 'trial',
      startedAt: new Date(Date.now() - (TRIAL_FOOTLINE_START_DAY - 1) * 86_400_000).toISOString(),
      trialMonth: '2026-08',
    };
    const snap = tierGateSnapshot(record);
    expect(snap.showHarnessFootline).toBe(true);
    expect(snap.harnessFootline).toContain('Keep the station');
  });

  it('marks within reverse trial window', () => {
    const record: EntitlementRecord = {
      state: 'trial',
      startedAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
      trialMonth: '2026-08',
    };
    expect(tierGateSnapshot(record).withinReverseTrial).toBe(true);
    const late: EntitlementRecord = {
      state: 'trial',
      startedAt: new Date(Date.now() - (REVERSE_TRIAL_DAYS + 2) * 86_400_000).toISOString(),
      trialMonth: '2026-07',
    };
    expect(tierGateSnapshot(late).withinReverseTrial).toBe(false);
  });
});
