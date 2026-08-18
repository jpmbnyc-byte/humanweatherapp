export const SOMATIC_ZONE_BANDS = [
  { id: "head", label: "Head", rows: [0, 1] },
  { id: "chest", label: "Chest", rows: [2, 3] },
  { id: "core", label: "Core", rows: [4, 5] },
  { id: "pelvis", label: "Pelvis", rows: [6, 7] },
] as const;

export type SomaticZone = (typeof SOMATIC_ZONE_BANDS)[number]["id"];
export type SomaticCoordinates = [number, number][];

export function somaticZoneForRow(row: number): SomaticZone {
  if (!Number.isInteger(row) || row < 0 || row > 7) {
    throw new RangeError(`Somatic grid row must be an integer from 0 to 7; received ${row}`);
  }
  return SOMATIC_ZONE_BANDS[Math.floor(row / 2)].id;
}

export function countSomaticZones(coords: SomaticCoordinates): Record<SomaticZone, number> {
  const counts: Record<SomaticZone, number> = { head: 0, chest: 0, core: 0, pelvis: 0 };
  for (const [row] of coords) counts[somaticZoneForRow(row)] += 1;
  return counts;
}
