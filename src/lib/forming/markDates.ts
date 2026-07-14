import { localDateKey } from '../dailyMarks';

function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function dayOffset(from: Date, to: Date): number {
  const a = new Date(from);
  a.setHours(0, 0, 0, 0);
  const b = new Date(to);
  b.setHours(0, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/** Human date label for marked-day tiles. */
export function formatMarkDateLabel(dateKey: string, now: Date = new Date()): string {
  const todayKey = localDateKey(now);
  const offset = dayOffset(parseDateKey(dateKey), now);

  if (dateKey === todayKey || offset === 0) return 'Today';
  if (offset === -1) return 'Yesterday';

  const d = parseDateKey(dateKey);
  const weekday = d.toLocaleDateString(undefined, { weekday: 'long' });
  const monthDay = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${weekday} · ${monthDay}`;
}
