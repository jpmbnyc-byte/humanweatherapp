/**
 * §7 Calculation pipeline — steps 2 (STRIP) and 3 (COMPUTE).
 * Strict subset used by the VIN Preview; same math as the production engine.
 */
import type {
  CostLineInput,
  ReconEconomics,
  StrippedCostLine,
  UnitComputeResult,
} from "@/schema/types";

const CREDIT_CATEGORIES = new Set([
  "arbitration_credit",
  "warranty_credit",
]);

/**
 * Step 2 — STRIP
 * cost_basis_cents = markup removed:
 *   recon_parts  → posted / (1 + parts_markup_pct)
 *   recon_labor  → posted × (labor_cost_rate / internal_labor_rate)
 *   recon_sublet → posted / (1 + sublet_markup_pct)
 *   all others   → posted
 */
export function stripCostLine(
  line: CostLineInput,
  economics: ReconEconomics,
): StrippedCostLine {
  const posted = line.postedAmountCents;
  let costBasis = posted;

  switch (line.category) {
    case "recon_parts": {
      const divisor = 1 + Math.max(0, economics.partsMarkupPct);
      costBasis = divisor > 0 ? Math.round(posted / divisor) : posted;
      break;
    }
    case "recon_labor": {
      const billed = economics.internalLaborRateCents;
      const cost = economics.laborCostRateCents;
      if (billed > 0 && cost >= 0) {
        costBasis = Math.round(posted * (cost / billed));
      }
      break;
    }
    case "recon_sublet": {
      const divisor = 1 + Math.max(0, economics.subletMarkupPct);
      costBasis = divisor > 0 ? Math.round(posted / divisor) : posted;
      break;
    }
    default:
      costBasis = posted;
  }

  return {
    ...line,
    costBasisCents: costBasis,
    markupCents: posted - costBasis,
  };
}

export function stripAll(
  lines: CostLineInput[],
  economics: ReconEconomics,
): StrippedCostLine[] {
  return lines.map((line) => stripCostLine(line, economics));
}

/**
 * Step 3 — COMPUTE
 * true_cost = Σ cost_basis WHERE category NOT IN credits − Σ credits
 * cost_variance = dms_total_cost − true_cost
 * (Preview uses Σ posted as dms_total_cost for the unit.)
 */
export function computeUnit(
  lines: CostLineInput[],
  economics: ReconEconomics,
): UnitComputeResult {
  const stripped = stripAll(lines, economics);

  let postedTotal = 0;
  let trueCost = 0;
  let creditBasis = 0;
  let internalRoMarkup = 0;

  for (const line of stripped) {
    postedTotal += line.postedAmountCents;

    if (CREDIT_CATEGORIES.has(line.category)) {
      creditBasis += Math.abs(line.costBasisCents);
      continue;
    }

    trueCost += line.costBasisCents;

    if (
      line.category === "recon_parts" ||
      line.category === "recon_labor" ||
      line.category === "recon_sublet"
    ) {
      internalRoMarkup += line.markupCents;
    }
  }

  trueCost -= creditBasis;
  const costVarianceCents = postedTotal - trueCost;

  return {
    lines: stripped,
    postedTotalCents: postedTotal,
    trueCostCents: trueCost,
    costVarianceCents,
    internalRoMarkupCents: internalRoMarkup,
  };
}

/** Extrapolate unit markup across a sample population at the same rates. */
export function extrapolateMarkup(
  unitMarkupCents: number,
  sampleUnitCount: number,
): number {
  return unitMarkupCents * sampleUnitCount;
}

export function formatUsd(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents) / 100;
  return (
    sign +
    abs.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  );
}

export function formatUsdExact(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents) / 100;
  return (
    sign +
    abs.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}
