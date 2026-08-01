/**
 * Gemini live-value protocol for VIN Preview presets.
 *
 * Given a fixed illustrative unit (year/make/model/channel), ask Gemini for
 * current mid-market posted cost lines + store economics. Math never runs
 * through the model — only the seed numbers do.
 *
 * Falls back to curated sample lines when the key is missing or the call fails.
 */
import { z } from "zod";
import {
  curatedEconomicsForPreset,
  curatedVehicleForPreset,
  PRESET_CARS,
  type PresetCar,
} from "@/data/preset-cars";
import { applyScenarioLines } from "@/data/scenarios";
import type {
  CostLineInput,
  ReconEconomics,
  SampleVehicle,
} from "@/schema/types";

const LiveSeedSchema = z.object({
  mileage: z.number().int().min(8000).max(90000),
  acquisitionCents: z.number().int().min(1_000_000).max(4_000_000),
  transportCents: z.number().int().min(0).max(90_000),
  reconPartsPostedCents: z.number().int().min(40_000).max(130_000),
  reconLaborPostedCents: z.number().int().min(50_000).max(150_000),
  reconLaborHours: z.number().min(2).max(12),
  subletCents: z.number().int().min(0).max(50_000),
  packCents: z.number().int().min(0).max(60_000),
  internalLaborRateCents: z.number().int().min(12_000).max(25_000),
  laborCostRateCents: z.number().int().min(4_000).max(12_000),
  partsMarkupPct: z.number().min(0.15).max(0.65),
  marketNote: z.string().min(20).max(220),
  asOfLabel: z.string().min(4).max(40),
});

export type LiveSeed = z.infer<typeof LiveSeedSchema>;

export interface LivePresetResult {
  vehicle: SampleVehicle;
  economics: ReconEconomics;
  source: "live" | "curated";
  marketNote: string;
  asOfLabel: string;
}

const sessionCache = new Map<string, LivePresetResult>();

const SYSTEM_PROMPT = `You refresh mid-market used-vehicle cost figures for a dealer-controller preview.
Return JSON only. Rules:
- Keep the unit boringly typical — no salvage, no luxury outliers, no $2k+ recon dramas.
- Posted recon parts+labor markup vs true cost should land roughly $350–$950 after strip at the rates you supply (secondary on pack/warranty scenarios).
- Acquisition should reflect current US wholesale/trade levels for that year/make/model (ballpark, not a formal appraisal).
- Labor rates should reflect current US dealer recon shop economics (billed internal RO rate vs true tech cost).
- marketNote: one calm sentence a controller would trust — institutional register, no hype. Mention the scenario finding type briefly.
- asOfLabel: short date stamp like "Jul 2026 market" or today's month/year.`;

function buildPrompt(preset: PresetCar, base: SampleVehicle): string {
  return [
    `Preset: ${preset.label} (${preset.channelLabel})`,
    `Unit lock: ${base.year} ${base.make} ${base.model} ${base.trim}`,
    `Acquisition channel: ${base.acquisitionChannel}`,
    `Primary finding scenario: ${preset.scenarioId}`,
    `Market posture: ${preset.marketHint}`,
    "Refresh mileage, posted GL cost lines, and store economics to current mid-market levels.",
    "Do not change year/make/model/trim. Scenario-specific overlay lines are applied client-side after your seed.",
  ].join("\n");
}

function applyLiveSeed(
  preset: PresetCar,
  base: SampleVehicle,
  seed: LiveSeed,
): LivePresetResult {
  const hoursLabel = seed.reconLaborHours.toFixed(1);
  const lines: CostLineInput[] = [
    {
      category: "acquisition",
      description:
        base.acquisitionChannel === "auction"
          ? "Auction purchase"
          : base.acquisitionChannel === "lease_return"
            ? "Lease return"
            : "Trade ACV",
      postedAmountCents: seed.acquisitionCents,
    },
    {
      category: "transport_in",
      description:
        base.acquisitionChannel === "auction"
          ? "Auction transport"
          : "Transport in",
      postedAmountCents: seed.transportCents,
    },
    {
      category: "recon_parts",
      description: "Internal RO parts (posted)",
      postedAmountCents: seed.reconPartsPostedCents,
      isInternal: true,
    },
    {
      category: "recon_labor",
      description: `Internal RO labor ${hoursLabel} hrs @ store rate`,
      postedAmountCents: seed.reconLaborPostedCents,
      isInternal: true,
    },
  ];

  if (seed.subletCents > 0) {
    lines.push({
      category: "recon_sublet",
      description: "Sublet (alignment / glass / tires)",
      postedAmountCents: seed.subletCents,
    });
  }

  lines.push({
    category: "pack",
    description: "Used pack",
    postedAmountCents: seed.packCents,
  });

  const economics: ReconEconomics = {
    internalLaborRateCents: seed.internalLaborRateCents,
    laborCostRateCents: seed.laborCostRateCents,
    partsMarkupPct: seed.partsMarkupPct,
    subletMarkupPct: 0,
    packAmountCents: seed.packCents,
  };

  const seeded: SampleVehicle = {
    ...base,
    key: preset.id,
    mileage: seed.mileage,
    defaultEconomics: economics,
    lines,
  };
  const vehicle = applyScenarioLines(preset, seeded);

  return {
    vehicle,
    economics,
    source: "live",
    marketNote: seed.marketNote,
    asOfLabel: seed.asOfLabel,
  };
}

async function callGeminiLive(preset: PresetCar, base: SampleVehicle): Promise<LiveSeed | null> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!apiKey) return null;

  const model =
    (import.meta.env.VITE_GEMINI_MODEL as string | undefined) ||
    "gemini-2.0-flash";

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const responseSchema = {
    type: "OBJECT",
    properties: {
      mileage: { type: "INTEGER" },
      acquisitionCents: { type: "INTEGER" },
      transportCents: { type: "INTEGER" },
      reconPartsPostedCents: { type: "INTEGER" },
      reconLaborPostedCents: { type: "INTEGER" },
      reconLaborHours: { type: "NUMBER" },
      subletCents: { type: "INTEGER" },
      packCents: { type: "INTEGER" },
      internalLaborRateCents: { type: "INTEGER" },
      laborCostRateCents: { type: "INTEGER" },
      partsMarkupPct: { type: "NUMBER" },
      marketNote: { type: "STRING" },
      asOfLabel: { type: "STRING" },
    },
    required: [
      "mileage",
      "acquisitionCents",
      "transportCents",
      "reconPartsPostedCents",
      "reconLaborPostedCents",
      "reconLaborHours",
      "subletCents",
      "packCents",
      "internalLaborRateCents",
      "laborCostRateCents",
      "partsMarkupPct",
      "marketNote",
      "asOfLabel",
    ],
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: buildPrompt(preset, base) }] }],
        generationConfig: {
          temperature: 0.35,
          responseMimeType: "application/json",
          responseSchema,
        },
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    const parsed = LiveSeedSchema.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function curatedFallback(preset: PresetCar): LivePresetResult {
  const vehicle = curatedVehicleForPreset(preset);
  const economics = curatedEconomicsForPreset(preset);
  return {
    vehicle,
    economics,
    source: "curated",
    marketNote:
      "Curated mid-market sample — set VITE_GEMINI_API_KEY on Render to refresh live values.",
    asOfLabel: "Curated sample",
  };
}

/** Load a preset: curated immediately available; Gemini upgrades to live when keyed. */
export async function resolvePresetLive(
  preset: PresetCar,
  opts?: { forceRefresh?: boolean },
): Promise<LivePresetResult> {
  const cacheKey = preset.id;
  if (!opts?.forceRefresh && sessionCache.has(cacheKey)) {
    return sessionCache.get(cacheKey)!;
  }

  const base = curatedVehicleForPreset(preset);
  const seed = await callGeminiLive(preset, base);
  const result = seed ? applyLiveSeed(preset, base, seed) : curatedFallback(preset);
  sessionCache.set(cacheKey, result);
  return result;
}

/** Prefetch all three presets in parallel (live when keyed). */
export async function prefetchAllPresets(): Promise<Map<string, LivePresetResult>> {
  const entries = await Promise.all(
    PRESET_CARS.map(async (preset) => {
      const result = await resolvePresetLive(preset);
      return [preset.id, result] as const;
    }),
  );
  return new Map(entries);
}
