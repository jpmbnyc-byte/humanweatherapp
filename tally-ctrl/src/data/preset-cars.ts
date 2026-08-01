import { applyScenarioLines, type ScenarioId } from "@/data/scenarios";
import { getSampleByKey, PLAUSIBLE_DEFAULTS } from "@/data/sample-vehicles";
import type { ReconEconomics, SampleVehicle } from "@/schema/types";

export type PresetAccent = "sage" | "slate" | "clay";

export interface PresetCar {
  id: string;
  /** Key into SAMPLE_VEHICLES curated fallback */
  sampleKey: string;
  label: string;
  channelLabel: string;
  blurb: string;
  accent: PresetAccent;
  /** Which variance story this profile demonstrates */
  scenarioId: ScenarioId;
  /** Hint Gemini what “live” market posture to use */
  marketHint: string;
  /** Prompt fragment for Gemini image generation */
  imagePrompt: string;
  /** Curated stock photo fallback when Gemini image is unavailable */
  fallbackImageUrl: string;
}

/**
 * Three illustrative mid-market units — each a different real finding.
 * Gemini refreshes acquisition / recon / rates + thumbnail; math stays local.
 */
export const PRESET_CARS: PresetCar[] = [
  {
    id: "accord-trade",
    sampleKey: "honda-accord-22",
    label: "Trade sedan",
    channelLabel: "Customer trade",
    blurb:
      "Three-year-old Accord off the trade desk — ordinary brakes, tires, and detail. Classic INTERNAL_RO_MARKUP strip.",
    accent: "sage",
    scenarioId: "ro_markup",
    marketHint:
      "Northeast retail trade-in, clean title, mid-mileage Honda Accord Sport. Typical store recon, not auction damage.",
    imagePrompt:
      "Photorealistic 3/4 front view of a clean silver 2022 Honda Accord Sport sedan on a quiet dealership lot, overcast Northeast daylight, no people, no logos, no text, natural colors, ordinary used-car inventory look",
    fallbackImageUrl:
      "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "camry-auction",
    sampleKey: "toyota-camry-21",
    label: "Auction sedan",
    channelLabel: "Manheim / open sale",
    blurb:
      "Camry bought at auction with transport in. Pack posted twice against the store schedule — PACK_DOUBLE.",
    accent: "slate",
    scenarioId: "pack_double",
    marketHint:
      "Manheim open-sale Toyota Camry LE, retail-ready after light recon and transport from a regional auction. Pack schedule errors are common on auction buys.",
    imagePrompt:
      "Photorealistic 3/4 front view of a white 2021 Toyota Camry LE sedan, ordinary used-car lot, soft daylight, no people, no logos, no text, realistic paint and wheels, mid-market inventory",
    fallbackImageUrl:
      "https://images.unsplash.com/photo-1623869675781-80aa31012a5a?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "escape-lease",
    sampleKey: "ford-escape-22",
    label: "Lease return",
    channelLabel: "Off-lease CUV",
    blurb:
      "Escape coming off lease — warranty-eligible bumper work billed to inventory. WARRANTY_UNCLAIMED, plus a late detail.",
    accent: "clay",
    scenarioId: "warranty_unclaimed",
    marketHint:
      "Off-lease Ford Escape SE CUV returning to a dualed Ford store; certification-path recon with warranty-eligible body/sensor work wrongly coded to used inventory.",
    imagePrompt:
      "Photorealistic 3/4 front view of a blue-gray 2022 Ford Escape SE compact SUV on a dealership apron, overcast daylight, no people, no logos, no text, ordinary off-lease inventory look",
    fallbackImageUrl:
      "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=900&q=80",
  },
];

export function getPresetById(id: string): PresetCar {
  return PRESET_CARS.find((p) => p.id === id) ?? PRESET_CARS[0];
}

export function curatedVehicleForPreset(preset: PresetCar): SampleVehicle {
  const base = getSampleByKey(preset.sampleKey);
  const vehicle: SampleVehicle = {
    ...base,
    key: preset.id,
    defaultEconomics: { ...base.defaultEconomics },
    lines: base.lines.map((l) => ({ ...l })),
  };
  return applyScenarioLines(preset, vehicle);
}

export function curatedEconomicsForPreset(preset: PresetCar): ReconEconomics {
  return {
    ...PLAUSIBLE_DEFAULTS,
    ...getSampleByKey(preset.sampleKey).defaultEconomics,
  };
}

export const ACCENT_STYLES: Record<
  PresetAccent,
  { wash: string; ink: string; ring: string }
> = {
  sage: {
    wash: "linear-gradient(145deg, #d7e6dc 0%, #b7cec0 100%)",
    ink: "#0f3d2c",
    ring: "rgba(31, 107, 74, 0.45)",
  },
  slate: {
    wash: "linear-gradient(145deg, #d8dde4 0%, #b4bdc9 100%)",
    ink: "#243041",
    ring: "rgba(55, 70, 90, 0.45)",
  },
  clay: {
    wash: "linear-gradient(145deg, #e8d9cc 0%, #d0b49a 100%)",
    ink: "#5c3a22",
    ring: "rgba(154, 52, 18, 0.35)",
  },
};
