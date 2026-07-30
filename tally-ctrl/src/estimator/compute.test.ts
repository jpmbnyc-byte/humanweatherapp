import { describe, expect, it } from "vitest";
import { computeEstimator, defaultsForTier } from "@/estimator/compute";

describe("used-only Variance Pool Estimator", () => {
  it("reproduces bible §2.2 used-only reference arithmetic", () => {
    const result = computeEstimator({
      rooftops: 10,
      usedUnitsMonth: 4950 / 12,
      brandTier: "moderate",
      avgUnitCost: 32_000,
      floorplanRate: 0.075,
      daysInInventory: 65,
      reconPerUsedUnit: 1_400,
    });

    expect(result.usedUnitsYear).toBe(4950);
    expect(result.a3FloorplanInterest).toBeCloseTo(169_249, -1);
    expect(result.b1ReconMisallocation).toBe(1_247_400);
    expect(result.b2AcvVariance).toBe(990_000);
    expect(result.bucketB).toBe(2_237_400);
    expect(result.totalIdentified).toBeCloseTo(2_406_649, -1);
    expect(result.leakagePerUsedUnit).toBeCloseTo(486, 0);
    expect(result.bucketC).toBe(0);
    expect(result.fee).toBe(30_390);
    expect(result.coefficientVersion).toMatch(/^used-only/);
  });

  it("never derives fee from the pool", () => {
    const small = computeEstimator({
      ...defaultsForTier("light"),
      rooftops: 2,
      usedUnitsMonth: 50,
    });
    const large = computeEstimator({
      ...defaultsForTier("heavy_stair_step"),
      rooftops: 40,
      usedUnitsMonth: 2000,
    });
    expect(small.fee).toBe(large.fee);
    expect(small.fee).toBe(30_390);
  });

  it("shows owner block only at 10+ rooftops", () => {
    expect(
      computeEstimator({ ...defaultsForTier("mixed"), rooftops: 9 })
        .showOwnerBlock,
    ).toBe(false);
    expect(
      computeEstimator({ ...defaultsForTier("mixed"), rooftops: 10 })
        .showOwnerBlock,
    ).toBe(true);
  });
});
