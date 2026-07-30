/**
 * Used-only Estimator coefficients (bible §2.2).
 * Stored as versioned config — never hard-coded inside formula bodies.
 *
 * New-car lines (A1 incentives, A2 FPA, C1 ASC 606) are retired here.
 * Warranty / CPO / arbitration remain n=0 and are omitted from the model
 * until a Diagnostic writes actuals into estimator_calibration.
 */

export const COEFFICIENT_VERSION = "used-only.v1.0";

export type BrandTier =
  | "heavy_stair_step"
  | "moderate"
  | "light"
  | "luxury"
  | "mixed";

export interface BrandTierOption {
  id: BrandTier;
  label: string;
  brands: string;
  /** Seeds default recon spend; domain signal, not a new-car program dollar. */
  defaultReconPerUsedUnit: number;
}

export const BRAND_TIERS: BrandTierOption[] = [
  {
    id: "heavy_stair_step",
    label: "Heavy stair-step",
    brands: "CDJR, Nissan, Mitsubishi",
    defaultReconPerUsedUnit: 1600,
  },
  {
    id: "moderate",
    label: "Moderate",
    brands: "Ford, GM, Hyundai, Kia, VW",
    defaultReconPerUsedUnit: 1400,
  },
  {
    id: "light",
    label: "Light",
    brands: "Toyota, Honda, Subaru, Mazda",
    defaultReconPerUsedUnit: 1200,
  },
  {
    id: "luxury",
    label: "Luxury",
    brands: "BMW, Mercedes-Benz, Audi, Lexus, Volvo",
    defaultReconPerUsedUnit: 1800,
  },
  {
    id: "mixed",
    label: "Mixed / multiple",
    brands: "Default when unsure",
    defaultReconPerUsedUnit: 1400,
  },
];

export const LEAKAGE = {
  /** Share of floorplan interest overpaid via curtailment timing */
  curtailmentErrorRate: 0.08,
  /** Share of recon spend posted to wrong unit, period, or department */
  reconMisallocationRate: 0.18,
  /** Average trade ACV posting variance, dollars */
  acvVariancePerUsedUnit: 200,
} as const;

export const ADVANCED_DEFAULTS = {
  avgUnitCost: 28_000, // used inventory cost (used-only scope)
  floorplanRate: 0.075,
  daysInInventory: 65,
  reconPerUsedUnit: 1_400,
} as const;

/** Confirmed Diagnostic fee — fixed; never derived from the pool. */
export const DIAGNOSTIC_FEE = 30_390;
