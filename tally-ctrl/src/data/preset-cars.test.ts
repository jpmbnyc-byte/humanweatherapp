import { describe, expect, it } from "vitest";
import { PRESET_CARS, curatedVehicleForPreset } from "@/data/preset-cars";
import { computeUnit } from "@/engine/compute";
import { resolvePresetLive } from "@/gemini/live-preset";

describe("preset cars", () => {
  it("exposes exactly three illustrative presets", () => {
    expect(PRESET_CARS).toHaveLength(3);
    expect(new Set(PRESET_CARS.map((p) => p.id)).size).toBe(3);
  });

  it("keeps each curated preset in the boring markup band", () => {
    for (const preset of PRESET_CARS) {
      const vehicle = curatedVehicleForPreset(preset);
      const result = computeUnit(vehicle.lines, vehicle.defaultEconomics);
      expect(result.internalRoMarkupCents).toBeGreaterThan(50_000);
      expect(result.internalRoMarkupCents).toBeLessThan(120_000);
    }
  });

  it("falls back to curated when Gemini key is absent", async () => {
    const result = await resolvePresetLive(PRESET_CARS[0], {
      forceRefresh: true,
    });
    expect(result.source).toBe("curated");
    expect(result.vehicle.make).toBeTruthy();
    expect(result.economics.internalLaborRateCents).toBeGreaterThan(0);
  });
});
