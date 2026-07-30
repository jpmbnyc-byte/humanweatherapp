/**
 * Gemini franchise-seed protocol
 *
 * Optimizes sample vehicle selection when gate-3 franchise data is present
 * but the curated library has no match — or when we want franchise-tuned
 * default rates. Math never runs through the model; only seeding does.
 *
 * Protocol:
 *  1. POST generativelanguage.googleapis.com with responseMimeType JSON
 *  2. Validate with Zod (reject dramatic outliers)
 *  3. Fall back to curated library on any failure
 */
import { z } from "zod";
import {
  getSampleForFranchise,
  normalizeFranchise,
  PLAUSIBLE_DEFAULTS,
} from "@/data/sample-vehicles";
import type { ReconEconomics, SampleVehicle } from "@/schema/types";

const GeminiSeedSchema = z.object({
  year: z.number().int().min(2018).max(2025),
  make: z.string().min(2).max(40),
  model: z.string().min(1).max(40),
  trim: z.string().min(1).max(40),
  mileage: z.number().int().min(8000).max(80000),
  /** Posted recon parts — must stay mid-market */
  reconPartsPostedCents: z.number().int().min(40000).max(120000),
  /** Posted recon labor — must stay mid-market */
  reconLaborPostedCents: z.number().int().min(50000).max(140000),
  acquisitionCents: z.number().int().min(1000000).max(3500000),
  transportCents: z.number().int().min(0).max(80000),
  packCents: z.number().int().min(0).max(60000),
  internalLaborRateCents: z.number().int().min(12000).max(25000),
  laborCostRateCents: z.number().int().min(4000).max(12000),
  partsMarkupPct: z.number().min(0).max(0.75),
});

export type GeminiSeed = z.infer<typeof GeminiSeedSchema>;

export interface FranchiseSeedResult {
  vehicle: SampleVehicle;
  economics: ReconEconomics;
  source: "curated" | "gemini" | "curated+gemini-rates";
}

const SYSTEM_PROMPT = `You seed a boringly typical mid-market used vehicle for a dealer-controller preview.
Rules:
- One common CPO/retail-ready unit for the given franchise (3 years old ±1).
- Recon must be ordinary — brakes, tires, detail, glass — NOT catastrophic.
- Posted recon parts+labor markup vs true cost should land roughly $500–$900 at typical rates.
- Never invent luxury outliers, salvage titles, or $2k+ findings.
- Return ONLY JSON matching the schema.`;

function buildPrompt(franchise: string, prospectName?: string): string {
  return [
    `Franchise: ${franchise}`,
    prospectName ? `Prepared for: ${prospectName}` : null,
    "Propose year/make/model/trim, mileage, posted cost lines, and plausible store economics.",
  ]
    .filter(Boolean)
    .join("\n");
}

function seedToVehicle(
  franchise: string,
  seed: GeminiSeed,
  base: SampleVehicle,
): SampleVehicle {
  return {
    ...base,
    key: `gemini-${normalizeFranchise(franchise)}`,
    franchise: normalizeFranchise(franchise),
    year: seed.year,
    make: seed.make,
    model: seed.model,
    trim: seed.trim,
    mileage: seed.mileage,
    sampleVin: base.sampleVin.replace(/\d{6}$/, "900001"),
    stockNumber: `U${String(seed.year).slice(2)}G01`,
    defaultEconomics: {
      internalLaborRateCents: seed.internalLaborRateCents,
      laborCostRateCents: seed.laborCostRateCents,
      partsMarkupPct: seed.partsMarkupPct,
      subletMarkupPct: 0,
      packAmountCents: seed.packCents,
    },
    lines: [
      {
        category: "acquisition",
        description: "Acquisition",
        postedAmountCents: seed.acquisitionCents,
      },
      {
        category: "transport_in",
        description: "Transport in",
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
        description: "Internal RO labor (posted)",
        postedAmountCents: seed.reconLaborPostedCents,
        isInternal: true,
      },
      {
        category: "pack",
        description: "Used pack",
        postedAmountCents: seed.packCents,
      },
    ],
  };
}

async function callGemini(
  franchise: string,
  prospectName?: string,
): Promise<GeminiSeed | null> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!apiKey) return null;

  const model =
    (import.meta.env.VITE_GEMINI_MODEL as string | undefined) ||
    "gemini-2.0-flash";

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const responseSchema = {
    type: "OBJECT",
    properties: {
      year: { type: "INTEGER" },
      make: { type: "STRING" },
      model: { type: "STRING" },
      trim: { type: "STRING" },
      mileage: { type: "INTEGER" },
      reconPartsPostedCents: { type: "INTEGER" },
      reconLaborPostedCents: { type: "INTEGER" },
      acquisitionCents: { type: "INTEGER" },
      transportCents: { type: "INTEGER" },
      packCents: { type: "INTEGER" },
      internalLaborRateCents: { type: "INTEGER" },
      laborCostRateCents: { type: "INTEGER" },
      partsMarkupPct: { type: "NUMBER" },
    },
    required: [
      "year",
      "make",
      "model",
      "trim",
      "mileage",
      "reconPartsPostedCents",
      "reconLaborPostedCents",
      "acquisitionCents",
      "transportCents",
      "packCents",
      "internalLaborRateCents",
      "laborCostRateCents",
      "partsMarkupPct",
    ],
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [
          { role: "user", parts: [{ text: buildPrompt(franchise, prospectName) }] },
        ],
        generationConfig: {
          temperature: 0.2,
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
    const parsed = GeminiSeedSchema.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/**
 * Resolve the best sample + economics for a prospect.
 * Curated library is the fast path; Gemini fills unknown franchises / rate tuning.
 */
export async function resolveFranchiseSeed(opts: {
  franchise: string | null | undefined;
  prospectName?: string;
  preferGemini?: boolean;
}): Promise<FranchiseSeedResult> {
  const curated = getSampleForFranchise(opts.franchise);
  const normalized = normalizeFranchise(opts.franchise);
  const hasKey = Boolean(import.meta.env.VITE_GEMINI_API_KEY);

  // Fast path: curated library covers major franchises without a model call.
  // Gemini runs when the franchise is unknown, or when explicitly preferred
  // for rate calibration.
  const shouldCallGemini =
    hasKey && (opts.preferGemini || normalized === "generic");

  if (!shouldCallGemini) {
    return {
      vehicle: curated,
      economics: curated.defaultEconomics,
      source: "curated",
    };
  }

  const seed = await callGemini(opts.franchise || "generic", opts.prospectName);
  if (!seed) {
    return {
      vehicle: curated,
      economics: curated.defaultEconomics,
      source: "curated",
    };
  }

  // Prefer rates-only merge when we already have a curated unit for the brand.
  if (normalized !== "generic" && !opts.preferGemini) {
    const economics: ReconEconomics = {
      ...PLAUSIBLE_DEFAULTS,
      internalLaborRateCents: seed.internalLaborRateCents,
      laborCostRateCents: seed.laborCostRateCents,
      partsMarkupPct: seed.partsMarkupPct,
      packAmountCents: seed.packCents,
    };
    return {
      vehicle: curated,
      economics,
      source: "curated+gemini-rates",
    };
  }

  const vehicle = seedToVehicle(opts.franchise || "generic", seed, curated);
  return {
    vehicle,
    economics: vehicle.defaultEconomics,
    source: "gemini",
  };
}
