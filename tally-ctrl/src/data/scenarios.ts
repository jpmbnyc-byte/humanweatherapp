/**
 * Per-preset variance scenarios — each sample unit demonstrates a different
 * real finding, not the same INTERNAL_RO_MARKUP story three times.
 */
import { formatUsd } from "@/engine/compute";
import type { PresetCar } from "@/data/preset-cars";
import type {
  CostLineInput,
  FindingBucket,
  FindingTypeCode,
  ReconEconomics,
  SampleVehicle,
  UnitComputeResult,
} from "@/schema/types";

export type ScenarioId =
  | "ro_markup"
  | "pack_double"
  | "warranty_unclaimed";

export interface ScenarioLayer {
  code: FindingTypeCode | "PACK_INTEGRITY";
  label: string;
  detail: string;
  amountCents?: number;
  amountLabel?: string;
  tone: "delta" | "muted";
  primary?: boolean;
}

export interface ScenarioDiagnostic {
  scenarioId: ScenarioId;
  primaryCode: FindingTypeCode;
  primaryLabel: string;
  bucket: FindingBucket;
  /** Hero dollars for this unit */
  primaryCents: number;
  /** Short status while the auto-demo runs */
  readingLabel: string;
  computingLabel: string;
  readyLabel: string;
  /** One-line explanation under the hero number */
  heroBlurb: string;
  layers: ScenarioLayer[];
  actionPlan: (args: {
    primaryCents: number;
    sampleUnitCount: number;
    extrapolatedCents: number;
    prospectName: string;
    snapshotName: string;
  }) => string;
}

const SCENARIO_META: Record<
  ScenarioId,
  Omit<ScenarioDiagnostic, "primaryCents" | "layers" | "actionPlan"> & {
    cardLabel: string;
  }
> = {
  ro_markup: {
    scenarioId: "ro_markup",
    primaryCode: "INTERNAL_RO_MARKUP",
    primaryLabel: "Internal RO markup",
    bucket: "gross_accuracy",
    cardLabel: "RO markup",
    readingLabel: "Reading DMS cost basis…",
    computingLabel: "Stripping internal RO markup…",
    readyLabel: "Strip complete · INTERNAL_RO_MARKUP identified",
    heroBlurb:
      "Posted recon parts and labor carry store markup into inventory cost. Front gross on this unit was understated by the delta until the strip ran.",
  },
  pack_double: {
    scenarioId: "pack_double",
    primaryCode: "PACK_DOUBLE",
    primaryLabel: "Double pack",
    bucket: "gross_accuracy",
    cardLabel: "Double pack",
    readingLabel: "Reading pack posts against schedule…",
    computingLabel: "Matching pack lines to store schedule…",
    readyLabel: "Pack integrity · PACK_DOUBLE identified",
    heroBlurb:
      "The same used pack hit inventory cost twice. Cost basis is overstated by one full pack — a gross-accuracy correction, not a cash recovery.",
  },
  warranty_unclaimed: {
    scenarioId: "warranty_unclaimed",
    primaryCode: "WARRANTY_UNCLAIMED",
    primaryLabel: "Unclaimed warranty",
    bucket: "recoverable_cash",
    cardLabel: "Warranty miss",
    readingLabel: "Checking in-warranty recon vs claim…",
    computingLabel: "Matching OEM lookback windows…",
    readyLabel: "Claim path · WARRANTY_UNCLAIMED identified",
    heroBlurb:
      "Warranty-eligible recon was billed to used inventory instead of submitted as a claim. Recoverable cash — subject to OEM lookback windows.",
  },
};

export function scenarioCardLabel(preset: PresetCar): string {
  return SCENARIO_META[preset.scenarioId].cardLabel;
}

/** Overlay scenario-specific cost lines onto a curated / live base vehicle. */
export function applyScenarioLines(
  preset: PresetCar,
  vehicle: SampleVehicle,
): SampleVehicle {
  const economics = vehicle.defaultEconomics;
  const baseWithoutPack = vehicle.lines.filter((l) => l.category !== "pack");
  const nonPackNonWarranty = baseWithoutPack.filter(
    (l) => l.findingHint !== "WARRANTY_UNCLAIMED",
  );

  if (preset.scenarioId === "pack_double") {
    const schedule = economics.packAmountCents || 25_000;
    const lines: CostLineInput[] = [
      ...nonPackNonWarranty,
      {
        category: "pack",
        description: "Used pack",
        postedAmountCents: schedule,
      },
      {
        category: "pack",
        description: "Used pack (duplicate post)",
        postedAmountCents: schedule,
        findingHint: "PACK_DOUBLE",
      },
    ];
    return { ...vehicle, lines };
  }

  if (preset.scenarioId === "warranty_unclaimed") {
    // Keep lighter ordinary recon for secondary markup; add warranty-billed work.
    const trimmed = nonPackNonWarranty.map((l) => {
      if (l.category === "recon_parts") {
        return {
          ...l,
          description: "Internal RO parts — ordinary wear",
          postedAmountCents: Math.round(l.postedAmountCents * 0.55),
        };
      }
      if (l.category === "recon_labor") {
        return {
          ...l,
          description: "Internal RO labor — ordinary wear",
          postedAmountCents: Math.round(l.postedAmountCents * 0.55),
        };
      }
      return l;
    });
    const lines: CostLineInput[] = [
      ...trimmed.filter((l) => l.category !== "detail"),
      {
        category: "other",
        description: "Bumper / sensor — warranty-eligible, billed to inventory",
        postedAmountCents: 62400,
        findingHint: "WARRANTY_UNCLAIMED",
      },
      {
        category: "detail",
        description: "Detail posted after GL sale close",
        postedAmountCents: 18500,
        findingHint: "RECON_POST_SALE",
      },
      {
        category: "pack",
        description: "Used pack",
        postedAmountCents: economics.packAmountCents,
      },
    ];
    return { ...vehicle, lines };
  }

  // ro_markup — leave curated / live lines as-is; ensure single pack
  const pack =
    vehicle.lines.find((l) => l.category === "pack") ??
    ({
      category: "pack" as const,
      description: "Used pack",
      postedAmountCents: economics.packAmountCents,
    } satisfies CostLineInput);
  return {
    ...vehicle,
    lines: [...nonPackNonWarranty, pack],
  };
}

function sumHinted(
  lines: CostLineInput[],
  code: FindingTypeCode,
): number {
  return lines
    .filter((l) => l.findingHint === code)
    .reduce((s, l) => s + l.postedAmountCents, 0);
}

export function resolveScenarioDiagnostic(
  preset: PresetCar,
  vehicle: SampleVehicle,
  economics: ReconEconomics,
  result: UnitComputeResult,
): ScenarioDiagnostic {
  const meta = SCENARIO_META[preset.scenarioId];
  const schedulePack = economics.packAmountCents;
  const postedPack = result.lines
    .filter((l) => l.category === "pack")
    .reduce((s, l) => s + l.postedAmountCents, 0);

  let primaryCents = result.internalRoMarkupCents;
  if (preset.scenarioId === "pack_double") {
    primaryCents = Math.max(0, postedPack - schedulePack);
    if (primaryCents === 0) {
      primaryCents = sumHinted(vehicle.lines, "PACK_DOUBLE") || schedulePack;
    }
  } else if (preset.scenarioId === "warranty_unclaimed") {
    primaryCents =
      sumHinted(vehicle.lines, "WARRANTY_UNCLAIMED") ||
      sumHinted(result.lines, "WARRANTY_UNCLAIMED");
  }

  const postSaleCents = sumHinted(vehicle.lines, "RECON_POST_SALE");
  const markupCents = result.internalRoMarkupCents;

  const layers: ScenarioLayer[] = [];

  if (preset.scenarioId === "ro_markup") {
    layers.push(
      {
        code: "INTERNAL_RO_MARKUP",
        label: "Internal RO markup",
        detail: "Parts ÷ markup · labor × cost rate",
        amountCents: markupCents,
        tone: "delta",
        primary: true,
      },
      {
        code: "PACK_INTEGRITY",
        label: "Pack integrity",
        detail: `Schedule pack ${formatUsd(schedulePack)} posted once`,
        amountLabel: "Checked",
        tone: "muted",
      },
      {
        code: "WARRANTY_UNCLAIMED",
        label: "Unclaimed warranty",
        detail: "Not on this unit — see lease-return profile",
        amountLabel: "—",
        tone: "muted",
      },
      {
        code: "RECON_POST_SALE",
        label: "Recon after sale close",
        detail: "Not on this unit — portal finding on other VINs",
        amountLabel: "—",
        tone: "muted",
      },
    );
  } else if (preset.scenarioId === "pack_double") {
    layers.push(
      {
        code: "PACK_DOUBLE",
        label: "Double pack",
        detail: `${formatUsd(postedPack)} posted vs ${formatUsd(schedulePack)} schedule`,
        amountCents: primaryCents,
        tone: "delta",
        primary: true,
      },
      {
        code: "INTERNAL_RO_MARKUP",
        label: "Internal RO markup",
        detail: "Also present — secondary strip",
        amountCents: markupCents,
        tone: "muted",
      },
      {
        code: "TRANSPORT_UNALLOCATED",
        label: "Auction transport",
        detail: "Allocated to this unit on the sample",
        amountLabel: "Checked",
        tone: "muted",
      },
      {
        code: "WARRANTY_UNCLAIMED",
        label: "Unclaimed warranty",
        detail: "Not the primary story on this auction buy",
        amountLabel: "—",
        tone: "muted",
      },
    );
  } else {
    layers.push(
      {
        code: "WARRANTY_UNCLAIMED",
        label: "Unclaimed warranty",
        detail: "OEM-eligible work billed to used inventory",
        amountCents: primaryCents,
        tone: "delta",
        primary: true,
      },
      {
        code: "RECON_POST_SALE",
        label: "Recon after sale close",
        detail: "Detail landed after GL sale",
        amountCents: postSaleCents || undefined,
        amountLabel: postSaleCents ? undefined : "Portal",
        tone: "muted",
      },
      {
        code: "INTERNAL_RO_MARKUP",
        label: "Internal RO markup",
        detail: "Ordinary wear strip — secondary",
        amountCents: markupCents,
        tone: "muted",
      },
      {
        code: "PACK_INTEGRITY",
        label: "Pack integrity",
        detail: `Schedule pack ${formatUsd(schedulePack)}`,
        amountLabel: "Checked",
        tone: "muted",
      },
    );
  }

  return {
    ...meta,
    primaryCents,
    layers,
    actionPlan: ({
      primaryCents: pct,
      sampleUnitCount,
      extrapolatedCents,
      prospectName,
      snapshotName,
    }) => {
      if (preset.scenarioId === "pack_double") {
        return `Remove the duplicate pack (${formatUsd(pct)}) from this unit's cost basis before you price or desk it. If the same pack error repeated across the ${sampleUnitCount}-unit sample, that is ${formatUsd(extrapolatedCents)} of overstated used inventory cost — identified, not recovered. A ${snapshotName} on ${prospectName}'s next 90 days runs pack integrity across live cost data.`;
      }
      if (preset.scenarioId === "warranty_unclaimed") {
        return `Submit the ${formatUsd(pct)} warranty-eligible recon before the OEM lookback expires — this line is recoverable cash, not a gross restatement. Across a ${sampleUnitCount}-unit sample with the same miss pattern, that is ${formatUsd(extrapolatedCents)} identified. A ${snapshotName} on ${prospectName} quantifies claim leakage on real VINs.`;
      }
      return `Strip ${formatUsd(pct)} of INTERNAL_RO_MARKUP out of this unit's cost basis before pricing or trade decisions. Across the ${sampleUnitCount}-unit sample at these rates that is ${formatUsd(extrapolatedCents)} of overstated used inventory cost — identified, not recovered. Run a ${snapshotName} on ${prospectName}'s next 90 days to quantify the same strip on live cost data.`;
    },
  };
}
