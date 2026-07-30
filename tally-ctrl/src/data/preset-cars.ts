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
  /** Hint Gemini what “live” market posture to use */
  marketHint: string;
}

/**
 * Three illustrative mid-market units — boring on purpose.
 * Gemini refreshes acquisition / recon / rates; math stays local.
 */
export const PRESET_CARS: PresetCar[] = [
  {
    id: "accord-trade",
    sampleKey: "honda-accord-22",
    label: "Trade sedan",
    channelLabel: "Customer trade",
    blurb:
      "Three-year-old Accord off the trade desk — ordinary brakes, tires, and detail. The unit most controllers recognize.",
    accent: "sage",
    marketHint:
      "Northeast retail trade-in, clean title, mid-mileage Honda Accord Sport. Typical store recon, not auction damage.",
  },
  {
    id: "camry-auction",
    sampleKey: "toyota-camry-21",
    label: "Auction sedan",
    channelLabel: "Manheim / open sale",
    blurb:
      "Camry bought at auction with transport in. Recon is still mid-market — not a cherry-picked outlier.",
    accent: "slate",
    marketHint:
      "Manheim open-sale Toyota Camry LE, retail-ready after light recon and transport from a regional auction.",
  },
  {
    id: "escape-lease",
    sampleKey: "ford-escape-22",
    label: "Lease return",
    channelLabel: "Off-lease CUV",
    blurb:
      "Escape coming off lease — tires, alignment, pack. Volume CUV economics, not a specialty unit.",
    accent: "clay",
    marketHint:
      "Off-lease Ford Escape SE CUV returning to a dualed Ford store; ordinary certification-path recon.",
  },
];

export function getPresetById(id: string): PresetCar {
  return PRESET_CARS.find((p) => p.id === id) ?? PRESET_CARS[0];
}

export function curatedVehicleForPreset(preset: PresetCar): SampleVehicle {
  const base = getSampleByKey(preset.sampleKey);
  return {
    ...base,
    key: preset.id,
    defaultEconomics: { ...base.defaultEconomics },
  };
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
