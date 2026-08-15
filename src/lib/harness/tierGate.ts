import {
  hasFeature,
  resolveEffectiveState,
  trialDayNumber,
  type EffectiveEntitlement,
  type EntitlementRecord,
} from '../entitlement';

/** Harness §8.1 reverse trial — fourteen days full access before graceful lapse. */
export const REVERSE_TRIAL_DAYS = 14;
export const TRIAL_FOOTLINE_START_DAY = 6;

export type TierGateSnapshot = {
  effective: EffectiveEntitlement;
  trialDay: number | null;
  showHarnessFootline: boolean;
  harnessFootline: string | null;
  withinReverseTrial: boolean;
};

export function tierGateSnapshot(
  record: EntitlementRecord,
  now: Date = new Date(),
): TierGateSnapshot {
  const effective = resolveEffectiveState(record, now);
  const trialDay =
    record.state === 'trial' ? trialDayNumber(record.startedAt, now) : null;

  const withinReverseTrial =
    record.state === 'trial' &&
    trialDay != null &&
    trialDay >= 1 &&
    trialDay <= REVERSE_TRIAL_DAYS;

  const showHarnessFootline =
    withinReverseTrial &&
    trialDay != null &&
    trialDay >= TRIAL_FOOTLINE_START_DAY;

  let harnessFootline: string | null = null;
  if (showHarnessFootline && trialDay != null) {
    const endDay = new Date(record.startedAt);
    endDay.setDate(endDay.getDate() + REVERSE_TRIAL_DAYS);
    const endLabel = endDay.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
    harnessFootline = `Your full-access week ends ${endLabel}. Keep the station: annual membership or a promo code.`;
  }

  return {
    effective,
    trialDay,
    showHarnessFootline,
    harnessFootline,
    withinReverseTrial,
  };
}

export function harnessMemberFeatures(
  record: EntitlementRecord,
  feature: Parameters<typeof hasFeature>[1],
  now?: Date,
): boolean {
  return hasFeature(resolveEffectiveState(record, now), feature);
}
