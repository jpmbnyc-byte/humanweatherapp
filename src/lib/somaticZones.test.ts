import { describe, expect, it } from "vitest";
import { countSomaticZones, SOMATIC_ZONE_BANDS, somaticZoneForRow } from "./somaticZones";

describe("somatic grid zones", () => {
  it("maps exactly two rows to each visible body zone", () => {
    expect(Array.from({ length: 8 }, (_, row) => somaticZoneForRow(row))).toEqual([
      "head",
      "head",
      "chest",
      "chest",
      "core",
      "core",
      "pelvis",
      "pelvis",
    ]);
    expect(SOMATIC_ZONE_BANDS.every((zone) => zone.rows.length === 2)).toBe(true);
  });

  it("counts marks in the same bands shown beside the grid", () => {
    expect(
      countSomaticZones([
        [0, 0],
        [1, 7],
        [2, 2],
        [4, 3],
        [6, 4],
        [7, 5],
      ]),
    ).toEqual({
      head: 2,
      chest: 1,
      core: 1,
      pelvis: 2,
    });
  });

  it("rejects coordinates outside the eight-row instrument", () => {
    expect(() => somaticZoneForRow(8)).toThrow(RangeError);
  });
});
