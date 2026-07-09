import { idbGet, idbSet } from './idb';
import { localDateKey } from './dailyMarks';

export type Office = 'vault' | 'meridian' | 'marrow';

export function officeObservedKey(office: Office, date: string): string {
  return `office:${office}:${date}`;
}

export async function isOfficeObserved(office: Office, date: string): Promise<boolean> {
  return (await idbGet(officeObservedKey(office, date))) === '1';
}

/** Mark observed ONLY at true completion of an office's final step. */
export async function markOfficeComplete(office: Office, now: Date = new Date()): Promise<void> {
  await idbSet(officeObservedKey(office, localDateKey(now)), '1');
}
