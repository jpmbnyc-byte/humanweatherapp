import { getDailyMarks, resolveCoords, type CachedDailyMarks } from './dailyMarks';
import { isOfficeObserved, type Office } from './officeObserved';

export type OfficeState = 'available' | 'observed' | 'upcoming' | 'missed';

export type WhereAreWeResult = {
  activeOffice: Office | null;
  officeState: OfficeState | null;
  showStation: true;
  marks: CachedDailyMarks;
};

export function localDecimalHours(date: Date): number {
  return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
}

function marrowEnd(marks: CachedDailyMarks): number {
  if (marks.dark > marks.sunset) return Math.min(marks.dark, 24);
  return 24;
}

function windowFor(office: Office, marks: CachedDailyMarks): { start: number; end: number } {
  switch (office) {
    case 'vault':
      return { start: marks.sunrise, end: marks.noon };
    case 'meridian':
      return { start: marks.noon, end: marks.sunset };
    case 'marrow':
      return { start: marks.sunset, end: marrowEnd(marks) };
  }
}

function resolveActiveOffice(t: number, marks: CachedDailyMarks): Office | null {
  const end = marrowEnd(marks);
  if (t >= marks.sunrise && t < marks.noon) return 'vault';
  if (t >= marks.noon && t < marks.sunset) return 'meridian';
  if (t >= marks.sunset && t < end) return 'marrow';
  return null;
}

function officeStateFor(
  office: Office,
  t: number,
  marks: CachedDailyMarks,
  observed: boolean,
): OfficeState {
  const { start, end } = windowFor(office, marks);
  if (t >= start && t < end) return observed ? 'observed' : 'available';
  if (t < start) return 'upcoming';
  return 'missed';
}

/**
 * Single on-demand resolver — call on section entry and visibility→visible.
 * Never driven by timers; state is computed from (now + today's marks + flags).
 */
export async function whereAreWe(
  now: Date = new Date(),
  coords?: { lat: number; lon: number },
): Promise<WhereAreWeResult> {
  const { lat, lon } = coords ?? await resolveCoords();
  const marks = await getDailyMarks(lat, lon, now);
  const t = localDecimalHours(now);
  const activeOffice = resolveActiveOffice(t, marks);

  let officeState: OfficeState | null = null;
  if (activeOffice) {
    const observed = await isOfficeObserved(activeOffice, marks.date);
    officeState = officeStateFor(activeOffice, t, marks, observed);
  }

  return { activeOffice, officeState, showStation: true, marks };
}
