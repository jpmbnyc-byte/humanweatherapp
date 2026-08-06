import { describe, expect, it } from 'vitest';
import {
  ANNUAL_ACCESS_DAYS,
  canReadFascia,
  daysLeftInTrialMonth,
  hasFeature,
  isMembershipExpired,
  monthKey,
  resolveEffectiveState,
  trialFootline,
  type EntitlementRecord,
} from './entitlement';

describe('monthKey', () => {
  it('formats calendar month', () => {
    expect(monthKey(new Date('2026-08-15T12:00:00'))).toBe('2026-08');
    expect(monthKey(new Date('2026-01-02T12:00:00'))).toBe('2026-01');
  });
});

describe('resolveEffectiveState', () => {
  const now = new Date('2026-08-15T12:00:00');

  it('returns trial for active trial month', () => {
    const record: EntitlementRecord = {
      state: 'trial',
      startedAt: '2026-08-01T00:00:00.000Z',
      trialMonth: '2026-08',
    };
    expect(resolveEffectiveState(record, now)).toBe('trial');
  });

  it('returns lapsed when trial month ended', () => {
    const record: EntitlementRecord = {
      state: 'trial',
      startedAt: '2026-07-01T00:00:00.000Z',
      trialMonth: '2026-07',
    };
    expect(resolveEffectiveState(record, now)).toBe('lapsed');
  });

  it('returns member for active annual membership', () => {
    const record: EntitlementRecord = {
      state: 'member',
      since: '2026-01-01T00:00:00.000Z',
      expiresAt: '2027-01-01T00:00:00.000Z',
    };
    expect(resolveEffectiveState(record, now)).toBe('member');
  });

  it('returns lapsed for expired membership', () => {
    const record: EntitlementRecord = {
      state: 'member',
      since: '2025-01-01T00:00:00.000Z',
      expiresAt: '2026-01-01T00:00:00.000Z',
    };
    expect(resolveEffectiveState(record, now)).toBe('lapsed');
    expect(isMembershipExpired(record, now)).toBe(true);
  });

  it('lifetime membership never expires', () => {
    const record: EntitlementRecord = {
      state: 'member',
      since: '2020-01-01T00:00:00.000Z',
      lifetime: true,
    };
    expect(resolveEffectiveState(record, now)).toBe('member');
    expect(isMembershipExpired(record, now)).toBe(false);
  });
});

describe('hasFeature and canReadFascia', () => {
  it('grants features during trial and member', () => {
    expect(hasFeature('trial', 'fascia')).toBe(true);
    expect(hasFeature('member', 'nascimento')).toBe(true);
  });

  it('blocks write features when lapsed', () => {
    expect(hasFeature('lapsed', 'fascia')).toBe(false);
    expect(hasFeature('lapsed', 'offices')).toBe(false);
  });

  it('allows read-only fascia when lapsed', () => {
    expect(canReadFascia('lapsed')).toBe(true);
    expect(canReadFascia('trial')).toBe(true);
  });
});

describe('trialFootline', () => {
  it('warns near month end', () => {
    const record: EntitlementRecord = {
      state: 'trial',
      startedAt: '2026-08-01T00:00:00.000Z',
      trialMonth: '2026-08',
    };
    const endOfMonth = new Date('2026-08-30T12:00:00');
    expect(trialFootline(record, endOfMonth)).toContain('ends in');
  });

  it('is null early in month', () => {
    const record: EntitlementRecord = {
      state: 'trial',
      startedAt: '2026-08-01T00:00:00.000Z',
      trialMonth: '2026-08',
    };
    expect(trialFootline(record, new Date('2026-08-05T12:00:00'))).toBeNull();
  });
});

describe('daysLeftInTrialMonth', () => {
  it('counts remaining days in month', () => {
    const days = daysLeftInTrialMonth(new Date('2026-08-30T12:00:00'));
    expect(days).toBeGreaterThan(0);
    expect(days).toBeLessThanOrEqual(2);
  });
});

describe('ANNUAL_ACCESS_DAYS', () => {
  it('is one year', () => {
    expect(ANNUAL_ACCESS_DAYS).toBe(365);
  });
});
