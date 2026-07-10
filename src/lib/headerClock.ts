import type { WhereAreWeResult } from './whereAreWe';

const TIME_OPTS: Intl.DateTimeFormatOptions = {
  hour: 'numeric',
  minute: '2-digit',
};

const DATE_OPTS: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
};

export function formatHeaderClock(now: Date): { time: string; date: string } {
  return {
    time: now.toLocaleTimeString(undefined, TIME_OPTS),
    date: now.toLocaleDateString(undefined, DATE_OPTS),
  };
}

function formatSolarHour(decimal: number): string {
  const h = Math.floor(decimal);
  const m = Math.round((decimal - h) * 60);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

const OFFICE_LABEL: Record<NonNullable<WhereAreWeResult['activeOffice']>, string> = {
  vault: 'The Vault',
  meridian: 'The Meridian',
  marrow: 'The Marrow',
};

/** Diurnal reference line for the header — active office + local solar window. */
export function formatHeaderReference(place: WhereAreWeResult | null): string | null {
  if (!place?.activeOffice) return null;

  const { activeOffice, marks } = place;
  const label = OFFICE_LABEL[activeOffice];

  const windowStart =
    activeOffice === 'vault'
      ? marks.sunrise
      : activeOffice === 'meridian'
        ? marks.noon
        : marks.sunset;
  const windowEnd =
    activeOffice === 'vault'
      ? marks.noon
      : activeOffice === 'meridian'
        ? marks.sunset
        : marks.dark;

  return `${label} · ${formatSolarHour(windowStart)} – ${formatSolarHour(windowEnd)}`;
}
