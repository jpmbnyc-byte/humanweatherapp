import type { ReconEconomics, SampleVehicle } from "@/schema/types";

/** Mid-market defaults a lazy visitor still gets a result with. */
export const PLAUSIBLE_DEFAULTS: ReconEconomics = {
  internalLaborRateCents: 18500, // $185/hr billed
  laborCostRateCents: 7500, // $75/hr actual
  partsMarkupPct: 0.4,
  subletMarkupPct: 0.0,
  packAmountCents: 30000, // $300
};

/**
 * Boringly typical used units — ~$700–800 INTERNAL_RO_MARKUP at PLAUSIBLE_DEFAULTS.
 * Dramatic outliers are intentionally absent.
 */
export const SAMPLE_VEHICLES: SampleVehicle[] = [
  {
    key: "honda-accord-22",
    franchise: "honda",
    year: 2022,
    make: "Honda",
    model: "Accord",
    trim: "Sport",
    sampleVin: "1HGCV1F3XNA000001",
    stockNumber: "U22481",
    mileage: 31840,
    acquisitionChannel: "trade",
    defaultEconomics: { ...PLAUSIBLE_DEFAULTS },
    lines: [
      {
        category: "acquisition",
        description: "Trade ACV",
        postedAmountCents: 1845000,
      },
      {
        category: "transport_in",
        description: "Dealer trade transport",
        postedAmountCents: 27500,
      },
      {
        category: "recon_parts",
        description: "Internal RO parts (posted)",
        postedAmountCents: 68600,
        isInternal: true,
      },
      {
        category: "recon_labor",
        description: "Internal RO labor 5.0 hrs @ store rate",
        postedAmountCents: 92500,
        isInternal: true,
      },
      {
        category: "recon_sublet",
        description: "Glass / alignment sublet",
        postedAmountCents: 18000,
      },
      {
        category: "pack",
        description: "Used pack",
        postedAmountCents: 30000,
      },
    ],
  },
  {
    key: "toyota-camry-21",
    franchise: "toyota",
    year: 2021,
    make: "Toyota",
    model: "Camry",
    trim: "LE",
    sampleVin: "4T1B11HK5MU000002",
    stockNumber: "U21803",
    mileage: 41220,
    acquisitionChannel: "auction",
    defaultEconomics: {
      ...PLAUSIBLE_DEFAULTS,
      internalLaborRateCents: 17900,
      packAmountCents: 25000,
    },
    lines: [
      {
        category: "acquisition",
        description: "Manheim purchase",
        postedAmountCents: 1698000,
      },
      {
        category: "transport_in",
        description: "Auction transport",
        postedAmountCents: 42500,
      },
      {
        category: "recon_parts",
        description: "Internal RO parts (posted)",
        postedAmountCents: 64400,
        isInternal: true,
      },
      {
        category: "recon_labor",
        description: "Internal RO labor 5.0 hrs @ store rate",
        postedAmountCents: 89500,
        isInternal: true,
      },
      {
        category: "detail",
        description: "Detail",
        postedAmountCents: 17500,
      },
      {
        category: "pack",
        description: "Used pack",
        postedAmountCents: 25000,
      },
    ],
  },
  {
    key: "ford-escape-22",
    franchise: "ford",
    year: 2022,
    make: "Ford",
    model: "Escape",
    trim: "SE",
    sampleVin: "1FMCU9G6XNU000003",
    stockNumber: "U23112",
    mileage: 28910,
    acquisitionChannel: "lease_return",
    defaultEconomics: {
      ...PLAUSIBLE_DEFAULTS,
      internalLaborRateCents: 19200,
      partsMarkupPct: 0.35,
      packAmountCents: 35000,
    },
    lines: [
      {
        category: "acquisition",
        description: "Lease return",
        postedAmountCents: 1782000,
      },
      {
        category: "transport_in",
        description: "Transport in",
        postedAmountCents: 19500,
      },
      {
        category: "recon_parts",
        description: "Internal RO parts (posted)",
        postedAmountCents: 70200,
        isInternal: true,
      },
      {
        category: "recon_labor",
        description: "Internal RO labor 4.8 hrs @ store rate",
        postedAmountCents: 92160,
        isInternal: true,
      },
      {
        category: "recon_sublet",
        description: "Tire sublet",
        postedAmountCents: 22000,
      },
      {
        category: "pack",
        description: "Used pack",
        postedAmountCents: 35000,
      },
    ],
  },
  {
    key: "chevrolet-equinox-21",
    franchise: "chevrolet",
    year: 2021,
    make: "Chevrolet",
    model: "Equinox",
    trim: "LT",
    sampleVin: "3GNAXUEV5MS000004",
    stockNumber: "U20944",
    mileage: 36550,
    acquisitionChannel: "trade",
    defaultEconomics: {
      ...PLAUSIBLE_DEFAULTS,
      internalLaborRateCents: 17500,
      packAmountCents: 29500,
    },
    lines: [
      {
        category: "acquisition",
        description: "Trade ACV",
        postedAmountCents: 1625000,
      },
      {
        category: "transport_in",
        description: "Local transport",
        postedAmountCents: 15000,
      },
      {
        category: "recon_parts",
        description: "Internal RO parts (posted)",
        postedAmountCents: 65800,
        isInternal: true,
      },
      {
        category: "recon_labor",
        description: "Internal RO labor 5.2 hrs @ store rate",
        postedAmountCents: 91000,
        isInternal: true,
      },
      {
        category: "detail",
        description: "Detail",
        postedAmountCents: 15000,
      },
      {
        category: "pack",
        description: "Used pack",
        postedAmountCents: 29500,
      },
    ],
  },
  {
    key: "nissan-altima-22",
    franchise: "nissan",
    year: 2022,
    make: "Nissan",
    model: "Altima",
    trim: "2.5 SV",
    sampleVin: "1N4BL4DVXNN000005",
    stockNumber: "U22601",
    mileage: 27440,
    acquisitionChannel: "trade",
    defaultEconomics: { ...PLAUSIBLE_DEFAULTS },
    lines: [
      {
        category: "acquisition",
        description: "Trade ACV",
        postedAmountCents: 1710000,
      },
      {
        category: "transport_in",
        description: "Transport in",
        postedAmountCents: 22000,
      },
      {
        category: "recon_parts",
        description: "Internal RO parts (posted)",
        postedAmountCents: 67200,
        isInternal: true,
      },
      {
        category: "recon_labor",
        description: "Internal RO labor 5.0 hrs @ store rate",
        postedAmountCents: 92500,
        isInternal: true,
      },
      {
        category: "pack",
        description: "Used pack",
        postedAmountCents: 30000,
      },
    ],
  },
  {
    key: "generic-midmarket",
    franchise: "generic",
    year: 2022,
    make: "Honda",
    model: "Accord",
    trim: "Sport",
    sampleVin: "1HGCV1F3XNA000099",
    stockNumber: "U22099",
    mileage: 31840,
    acquisitionChannel: "trade",
    defaultEconomics: { ...PLAUSIBLE_DEFAULTS },
    lines: [
      {
        category: "acquisition",
        description: "Trade ACV",
        postedAmountCents: 1845000,
      },
      {
        category: "transport_in",
        description: "Dealer trade transport",
        postedAmountCents: 27500,
      },
      {
        category: "recon_parts",
        description: "Internal RO parts (posted)",
        postedAmountCents: 68600,
        isInternal: true,
      },
      {
        category: "recon_labor",
        description: "Internal RO labor 5.0 hrs @ store rate",
        postedAmountCents: 92500,
        isInternal: true,
      },
      {
        category: "recon_sublet",
        description: "Glass / alignment sublet",
        postedAmountCents: 18000,
      },
      {
        category: "pack",
        description: "Used pack",
        postedAmountCents: 30000,
      },
    ],
  },
];

const FRANCHISE_ALIASES: Record<string, string> = {
  honda: "honda",
  acura: "honda",
  toyota: "toyota",
  lexus: "toyota",
  ford: "ford",
  lincoln: "ford",
  chevrolet: "chevrolet",
  chevy: "chevrolet",
  gmc: "chevrolet",
  buick: "chevrolet",
  cadillac: "chevrolet",
  nissan: "nissan",
  infiniti: "nissan",
  hyundai: "generic",
  kia: "generic",
  mazda: "generic",
  subaru: "generic",
  volkswagen: "generic",
  vw: "generic",
  bmw: "generic",
  mercedes: "generic",
  "mercedes-benz": "generic",
};

export function normalizeFranchise(raw: string | null | undefined): string {
  if (!raw) return "generic";
  const key = raw.trim().toLowerCase();
  return FRANCHISE_ALIASES[key] ?? "generic";
}

export function getSampleByKey(key: string): SampleVehicle {
  return (
    SAMPLE_VEHICLES.find((v) => v.key === key) ??
    SAMPLE_VEHICLES.find((v) => v.key === "generic-midmarket")!
  );
}

export function getSampleForFranchise(
  franchise: string | null | undefined,
): SampleVehicle {
  const normalized = normalizeFranchise(franchise);
  return (
    SAMPLE_VEHICLES.find((v) => v.franchise === normalized) ??
    SAMPLE_VEHICLES.find((v) => v.key === "generic-midmarket")!
  );
}
