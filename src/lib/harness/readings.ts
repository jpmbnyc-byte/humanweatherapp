import { idbGetJson, idbSetJson } from '../idb';
import { HW_KEYS } from './keys';

export type ReadingRecord = {
  id: string;
  at: string;
  weatherId: string;
  office?: 'vault' | 'meridian' | 'marrow' | null;
  feltLine?: string;
  source: 'field_station' | 'office' | 'reading_flow';
};

export async function listReadings(): Promise<ReadingRecord[]> {
  return (await idbGetJson<ReadingRecord[]>(HW_KEYS.readings)) ?? [];
}

export async function appendReading(
  partial: Omit<ReadingRecord, 'id' | 'at'> & { at?: string },
): Promise<ReadingRecord> {
  const list = await listReadings();
  const record: ReadingRecord = {
    id: crypto.randomUUID(),
    at: partial.at ?? new Date().toISOString(),
    weatherId: partial.weatherId,
    office: partial.office ?? null,
    feltLine: partial.feltLine,
    source: partial.source,
  };
  list.unshift(record);
  await idbSetJson(HW_KEYS.readings, list.slice(0, 500));
  return record;
}
