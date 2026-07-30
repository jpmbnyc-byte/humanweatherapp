import { describe, expect, it } from "vitest";
import {
  computeUnit,
  extrapolateMarkup,
  stripCostLine,
} from "@/engine/compute";
import { getSampleForFranchise, PLAUSIBLE_DEFAULTS } from "@/data/sample-vehicles";
import { isTokenExpired, lookupToken } from "@/data/preview-tokens";

describe("§7 STRIP", () => {
  it("strips parts by markup divisor", () => {
    const line = stripCostLine(
      {
        category: "recon_parts",
        description: "parts",
        postedAmountCents: 68600,
      },
      PLAUSIBLE_DEFAULTS,
    );
    // 68600 / 1.40 = 49000
    expect(line.costBasisCents).toBe(49000);
    expect(line.markupCents).toBe(19600);
  });

  it("scales labor to cost rate", () => {
    const line = stripCostLine(
      {
        category: "recon_labor",
        description: "labor",
        postedAmountCents: 92500,
      },
      PLAUSIBLE_DEFAULTS,
    );
    // 92500 * (7500/18500) = 37500
    expect(line.costBasisCents).toBe(37500);
    expect(line.markupCents).toBe(55000);
  });

  it("passes acquisition through unchanged", () => {
    const line = stripCostLine(
      {
        category: "acquisition",
        description: "acv",
        postedAmountCents: 1845000,
      },
      PLAUSIBLE_DEFAULTS,
    );
    expect(line.costBasisCents).toBe(1845000);
    expect(line.markupCents).toBe(0);
  });
});

describe("§7 COMPUTE on Honda sample", () => {
  it("lands INTERNAL_RO_MARKUP near $730 — boringly typical", () => {
    const vehicle = getSampleForFranchise("honda");
    const result = computeUnit(vehicle.lines, PLAUSIBLE_DEFAULTS);

    // parts markup 19600 + labor markup 55000 = 74600 (~$746)
    expect(result.internalRoMarkupCents).toBeGreaterThan(60000);
    expect(result.internalRoMarkupCents).toBeLessThan(90000);
    expect(result.costVarianceCents).toBe(result.internalRoMarkupCents);
    expect(result.trueCostCents).toBe(
      result.postedTotalCents - result.costVarianceCents,
    );
  });

  it("extrapolates across 200 units", () => {
    const vehicle = getSampleForFranchise("honda");
    const result = computeUnit(vehicle.lines, PLAUSIBLE_DEFAULTS);
    const total = extrapolateMarkup(result.internalRoMarkupCents, 200);
    expect(total).toBe(result.internalRoMarkupCents * 200);
    expect(total).toBeGreaterThan(100_000_00); // > $100k
  });
});

describe("preview tokens", () => {
  it("resolves demo-faulkner", () => {
    const t = lookupToken("demo-faulkner");
    expect(t?.prospectName).toBe("Faulkner Automotive Group");
    expect(t?.franchise).toBe("honda");
    expect(isTokenExpired(t!)).toBe(false);
  });

  it("flags expired tokens", () => {
    const t = lookupToken("demo-expired");
    expect(isTokenExpired(t!)).toBe(true);
  });
});
