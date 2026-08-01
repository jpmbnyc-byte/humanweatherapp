/** Tally CTRL — shared domain types aligned to vin-engine.sql */

export type CostCategory =
  | "acquisition"
  | "transport_in"
  | "recon_parts"
  | "recon_labor"
  | "recon_sublet"
  | "certification"
  | "detail"
  | "pack"
  | "floorplan_interest"
  | "title_fees"
  | "auction_fee"
  | "arbitration_credit"
  | "warranty_credit"
  | "other";

export type FindingBucket =
  | "recoverable_cash"
  | "gross_accuracy"
  | "period_exposure";

export type FindingTypeCode =
  | "WARRANTY_UNCLAIMED"
  | "CPO_REIMB_UNCLAIMED"
  | "ARBITRATION_UNPURSUED"
  | "FLOORPLAN_CURTAIL"
  | "INTERNAL_RO_MARKUP"
  | "RECON_WRONG_UNIT"
  | "RECON_POST_SALE"
  | "PACK_DOUBLE"
  | "PACK_MISSING"
  | "ACV_OVERALLOWANCE"
  | "TRANSPORT_UNALLOCATED"
  | "WHOLESALE_LOSS_MISPOSTED"
  | "COST_WRONG_PERIOD"
  | "LATE_ARRIVAL_ADJ";

/** Store-level recon economics — the four numbers controllers will type. */
export interface ReconEconomics {
  /** $/hr billed on internal RO labor (cents) */
  internalLaborRateCents: number;
  /** $/hr actual labor cost (cents) */
  laborCostRateCents: number;
  /** e.g. 0.40 = billed at cost × 1.40 */
  partsMarkupPct: number;
  /** e.g. 0.0–0.25 typical */
  subletMarkupPct: number;
  /** pack dollars in cents */
  packAmountCents: number;
}

export interface CostLineInput {
  category: CostCategory;
  description: string;
  postedAmountCents: number;
  isInternal?: boolean;
  /** Preview-scenario overlay — tags a line to a finding without changing strip math. */
  findingHint?: FindingTypeCode;
}

export interface StrippedCostLine extends CostLineInput {
  costBasisCents: number;
  markupCents: number;
}

export interface UnitComputeResult {
  lines: StrippedCostLine[];
  postedTotalCents: number;
  trueCostCents: number;
  costVarianceCents: number;
  internalRoMarkupCents: number;
}

export interface SampleVehicle {
  key: string;
  franchise: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  /** Display-only sample VIN — not a real customer VIN */
  sampleVin: string;
  stockNumber: string;
  mileage: number;
  acquisitionChannel: "trade" | "auction" | "lease_return" | "street_purchase";
  lines: CostLineInput[];
  /** Plausible franchise-tuned default economics */
  defaultEconomics: ReconEconomics;
}

export interface PreviewToken {
  token: string;
  prospectName: string;
  franchise: string | null;
  sampleVehicleKey: string | null;
  sampleUnitCount: number;
  expiresAt: string;
  defaults?: Partial<ReconEconomics>;
}

export interface PreviewFindingCard {
  code: FindingTypeCode;
  label: string;
  bucket: FindingBucket;
  blurb: string;
  amountCents?: number;
}
