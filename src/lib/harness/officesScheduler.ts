import { idbGetJson, idbSetJson } from '../idb';
import { getDailyMarks, type CachedDailyMarks } from '../dailyMarks';
import { isOfficeObserved, type Office } from '../officeObserved';
import { localDecimalHours } from '../whereAreWe';
import { HW_KEYS } from './keys';

export type OfficeOffsetMinutes = Partial<Record<Office, number>>;

export type ScheduledOffice = {
  office: Office;
  name: string;
  designation: string;
  windowStart: number;
  windowEnd: number;
  state: 'available' | 'observed' | 'upcoming' | 'missed';
};

const OFFICE_META: Record<Office, { name: string; designation: string }> = {
  vault: { name: 'THE VAULT', designation: 'OBS/01 · SUNRISE · THORACIC OPENING' },
  meridian: { name: 'THE MERIDIAN', designation: 'OBS/02 · SOLAR NOON · STANDING COLUMN' },
  marrow: { name: 'THE MARROW', designation: 'OBS/03 · SUNSET · DEEP INTERIOR' },
};

function marrowEnd(marks: CachedDailyMarks): number {
  if (marks.dark > marks.sunset) return Math.min(marks.dark, 24);
  return 24;
}

function baseWindow(office: Office, marks: CachedDailyMarks): { start: number; end: number } {
  switch (office) {
    case 'vault':
      return { start: marks.sunrise, end: marks.noon };
    case 'meridian':
      return { start: marks.noon, end: marks.sunset };
    case 'marrow':
      return { start: marks.sunset, end: marrowEnd(marks) };
  }
}

export async function getOfficeOffsets(): Promise<OfficeOffsetMinutes> {
  return (await idbGetJson<OfficeOffsetMinutes>(HW_KEYS.officeOffsets)) ?? {};
}

export async function setOfficeOffset(office: Office, minutes: number): Promise<void> {
  const offsets = await getOfficeOffsets();
  offsets[office] = minutes;
  await idbSetJson(HW_KEYS.officeOffsets, offsets);
}

function applyOffset(hours: number, minutes: number): number {
  return hours + minutes / 60;
}

export async function computeOfficeSchedule(
  lat: number,
  lon: number,
  now: Date = new Date(),
): Promise<{ marks: CachedDailyMarks; offices: ScheduledOffice[]; active: Office | null }> {
  const marks = await getDailyMarks(lat, lon, now);
  const offsets = await getOfficeOffsets();
  const t = localDecimalHours(now);
  const offices: Office[] = ['vault', 'meridian', 'marrow'];
  const scheduled: ScheduledOffice[] = [];

  for (const office of offices) {
    const base = baseWindow(office, marks);
    const offset = offsets[office] ?? 0;
    const start = applyOffset(base.start, offset);
    const end = applyOffset(base.end, offset);
    const observed = await isOfficeObserved(office, marks.date);
    let state: ScheduledOffice['state'] = 'missed';
    if (t >= start && t < end) state = observed ? 'observed' : 'available';
    else if (t < start) state = 'upcoming';

    scheduled.push({
      office,
      name: OFFICE_META[office].name,
      designation: OFFICE_META[office].designation,
      windowStart: start,
      windowEnd: end,
      state,
    });
  }

  const active =
    scheduled.find(o => o.state === 'available' || o.state === 'observed')?.office ?? null;
  return { marks, offices: scheduled, active };
}

/** Adapt office offsets from repeated late completions (pattern-driven nudge). */
export async function adaptOfficeOffsetsFromPattern(
  lateByMinutes: Partial<Record<Office, number>>,
): Promise<OfficeOffsetMinutes> {
  const offsets = await getOfficeOffsets();
  for (const office of ['vault', 'meridian', 'marrow'] as Office[]) {
    const late = lateByMinutes[office];
    if (late != null && late > 5) {
      offsets[office] = Math.min(45, (offsets[office] ?? 0) + Math.round(late / 2));
    }
  }
  await idbSetJson(HW_KEYS.officeOffsets, offsets);
  return offsets;
}
