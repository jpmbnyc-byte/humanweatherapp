import { describe, expect, it } from "vitest";
import { PRESET_CARS, curatedVehicleForPreset } from "@/data/preset-cars";
import { resolveScenarioDiagnostic } from "@/data/scenarios";
import { computeUnit } from "@/engine/compute";
import { resolvePresetLive } from "@/gemini/live-preset";
import { curatedImageForPreset } from "@/gemini/preset-image";

describe("preset cars", () => {
  it("exposes exactly three illustrative presets", () => {
    expect(PRESET_CARS).toHaveLength(3);
    expect(new Set(PRESET_CARS.map((p) => p.id)).size).toBe(3);
  });

  it("keeps each curated primary finding in a mid-market band", () => {
    for (const preset of PRESET_CARS) {
      const vehicle = curatedVehicleForPreset(preset);
      const result = computeUnit(vehicle.lines, vehicle.defaultEconomics);
      const diag = resolveScenarioDiagnostic(
        preset,
        vehicle,
        vehicle.defaultEconomics,
        result,
      );
      expect(diag.primaryCents).toBeGreaterThan(20_000);
      expect(diag.primaryCents).toBeLessThan(150_000);
    }
  });

  it("ships a curated fallback image URL for each preset", () => {
    for (const preset of PRESET_CARS) {
      const img = curatedImageForPreset(preset);
      expect(img.source).toBe("curated");
      expect(img.src).toMatch(/^https:\/\//);
      expect(preset.imagePrompt.length).toBeGreaterThan(40);
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
