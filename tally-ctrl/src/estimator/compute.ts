import {
  ADVANCED_DEFAULTS,
  BRAND_TIERS,
  COEFFICIENT_VERSION,
  DIAGNOSTIC_FEE,
  LEAKAGE,
  type BrandTier,
} from "@/config/estimator-coefficients";

export interface EstimatorInputs {
  rooftops: number;
  usedUnitsMonth: number;
  brandTier: BrandTier;
  avgUnitCost: number;
  floorplanRate: number;
  daysInInventory: number;
  reconPerUsedUnit: number;
}

export interface EstimatorResult {
  coefficientVersion: string;
  usedUnitsYear: number;
  /** Bucket A — recoverable cash (used-calibrated lines only) */
  bucketA: number;
  a3FloorplanInterest: number;
  /** Bucket B — gross accuracy correction */
  bucketB: number;
  b1ReconMisallocation: number;
  b2AcvVariance: number;
  /**
   * Bucket C — period exposure.
   * Used-side period exposure requires actual close calendars; not modelled
   * from volume coefficients. Always 0 in the Estimator; quantified in Snapshot/Diagnostic.
   */
  bucketC: number;
  totalIdentified: number;
  leakagePerUsedUnit: number;
  recoverablePerUsedUnit: number;
  /** Run-rate EBITDA improvement ≈ recoverable cash once controls hold */
  runRateEbitda: number;
  fee: number;
  feeRatioTotal: number | null;
  feeRatioCash: number | null;
  showOwnerBlock: boolean;
}

export function defaultsForTier(tier: BrandTier): EstimatorInputs {
  const row = BRAND_TIERS.find((t) => t.id === tier) ?? BRAND_TIERS[4];
  return {
    rooftops: 10,
    usedUnitsMonth: 400,
    brandTier: tier,
    avgUnitCost: ADVANCED_DEFAULTS.avgUnitCost,
    floorplanRate: ADVANCED_DEFAULTS.floorplanRate,
    daysInInventory: ADVANCED_DEFAULTS.daysInInventory,
    reconPerUsedUnit: row.defaultReconPerUsedUnit,
  };
}

/**
 * Used-only Variance Pool Estimator.
 *
 * A3_overpaid_floorplan_interest =
 *   used_units_year × avg_unit_cost × floorplan_rate
 *   × (days_in_inventory / 365) × curtailment_error_rate
 *
 * B1_recon_misallocation =
 *   used_units_year × recon_per_used_unit × recon_misallocation_rate
 *
 * B2_acv_posting_variance =
 *   used_units_year × acv_variance_per_used_unit
 */
export function computeEstimator(inputs: EstimatorInputs): EstimatorResult {
  const usedUnitsYear = Math.max(0, inputs.usedUnitsMonth) * 12;

  const a3FloorplanInterest =
    usedUnitsYear *
    inputs.avgUnitCost *
    inputs.floorplanRate *
    (inputs.daysInInventory / 365) *
    LEAKAGE.curtailmentErrorRate;

  const b1ReconMisallocation =
    usedUnitsYear *
    inputs.reconPerUsedUnit *
    LEAKAGE.reconMisallocationRate;

  const b2AcvVariance = usedUnitsYear * LEAKAGE.acvVariancePerUsedUnit;

  const bucketA = a3FloorplanInterest;
  const bucketB = b1ReconMisallocation + b2AcvVariance;
  const bucketC = 0;
  const totalIdentified = bucketA + bucketB + bucketC;

  const leakagePerUsedUnit =
    usedUnitsYear > 0 ? totalIdentified / usedUnitsYear : 0;
  const recoverablePerUsedUnit =
    usedUnitsYear > 0 ? bucketA / usedUnitsYear : 0;

  const fee = DIAGNOSTIC_FEE;
  const feeRatioTotal = totalIdentified > 0 ? fee / totalIdentified : null;
  const feeRatioCash = bucketA > 0 ? fee / bucketA : null;

  return {
    coefficientVersion: COEFFICIENT_VERSION,
    usedUnitsYear,
    bucketA,
    a3FloorplanInterest,
    bucketB,
    b1ReconMisallocation,
    b2AcvVariance,
    bucketC,
    totalIdentified,
    leakagePerUsedUnit,
    recoverablePerUsedUnit,
    runRateEbitda: bucketA,
    fee,
    feeRatioTotal,
    feeRatioCash,
    showOwnerBlock: inputs.rooftops >= 10,
  };
}

export function formatDollars(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function formatPct(ratio: number | null): string {
  if (ratio == null || !Number.isFinite(ratio)) return "—";
  return `${(ratio * 100).toFixed(2)}%`;
}
