import { describe, expect, it } from "vitest";
import {
  curatedEconomicsForPreset,
  curatedVehicleForPreset,
  PRESET_CARS,
} from "@/data/preset-cars";
import { resolveScenarioDiagnostic } from "@/data/scenarios";
import { computeUnit } from "@/engine/compute";

describe("varied preset scenarios", () => {
  it("assigns three distinct primary finding codes", () => {
    const codes = PRESET_CARS.map((p) => p.scenarioId);
    expect(new Set(codes).size).toBe(3);
    expect(codes).toContain("ro_markup");
    expect(codes).toContain("pack_double");
    expect(codes).toContain("warranty_unclaimed");
  });

  it("computes a non-zero primary amount for each scenario", () => {
    for (const preset of PRESET_CARS) {
      const vehicle = curatedVehicleForPreset(preset);
      const economics = curatedEconomicsForPreset(preset);
      const result = computeUnit(vehicle.lines, economics);
      const diag = resolveScenarioDiagnostic(
        preset,
        vehicle,
        economics,
        result,
      );
      expect(diag.primaryCents).toBeGreaterThan(10_000);
      expect(diag.primaryCents).toBeLessThan(200_000);
      expect(diag.layers.some((l) => l.primary)).toBe(true);
    }
  });

  it("surfaces PACK_DOUBLE as primary on the auction profile", () => {
    const preset = PRESET_CARS.find((p) => p.id === "camry-auction")!;
    const vehicle = curatedVehicleForPreset(preset);
    const economics = curatedEconomicsForPreset(preset);
    const result = computeUnit(vehicle.lines, economics);
    const diag = resolveScenarioDiagnostic(preset, vehicle, economics, result);
    expect(diag.primaryCode).toBe("PACK_DOUBLE");
    const packLines = vehicle.lines.filter((l) => l.category === "pack");
    expect(packLines.length).toBeGreaterThanOrEqual(2);
  });

  it("surfaces WARRANTY_UNCLAIMED as primary on the lease profile", () => {
    const preset = PRESET_CARS.find((p) => p.id === "escape-lease")!;
    const vehicle = curatedVehicleForPreset(preset);
    const economics = curatedEconomicsForPreset(preset);
    const result = computeUnit(vehicle.lines, economics);
    const diag = resolveScenarioDiagnostic(preset, vehicle, economics, result);
    expect(diag.primaryCode).toBe("WARRANTY_UNCLAIMED");
    expect(
      vehicle.lines.some((l) => l.findingHint === "WARRANTY_UNCLAIMED"),
    ).toBe(true);
  });
});
