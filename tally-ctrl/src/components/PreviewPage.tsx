import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { EconomicsInputs } from "@/components/EconomicsInputs";
import { CostWaterfall } from "@/components/CostWaterfall";
import { Extrapolation } from "@/components/Extrapolation";
import { FindingCards } from "@/components/FindingCards";
import { PresetCarPicker } from "@/components/PresetCarPicker";
import { PreviewCta } from "@/components/PreviewCta";
import { ValueReveal } from "@/components/ValueReveal";
import { SiteChrome } from "@/components/layout/SiteChrome";
import {
  curatedEconomicsForPreset,
  curatedVehicleForPreset,
  getPresetById,
  PRESET_CARS,
  type PresetCar,
} from "@/data/preset-cars";
import {
  isTokenExpired,
  lookupToken,
  recordTokenOpen,
} from "@/data/preview-tokens";
import { computeUnit, extrapolateMarkup } from "@/engine/compute";
import {
  prefetchAllPresets,
  resolvePresetLive,
  type LivePresetResult,
} from "@/gemini/live-preset";
import type {
  PreviewFindingCard,
  ReconEconomics,
  SampleVehicle,
} from "@/schema/types";

function initialPresetForToken(franchise: string | null): PresetCar {
  const match = PRESET_CARS.find((p) => {
    const v = curatedVehicleForPreset(p);
    return franchise && v.franchise === franchise.toLowerCase();
  });
  return match ?? PRESET_CARS[0];
}

export function PreviewPage() {
  const { token = "" } = useParams();
  const record = lookupToken(token);

  const [selectedId, setSelectedId] = useState(
    () => initialPresetForToken(record?.franchise ?? null).id,
  );
  const [liveById, setLiveById] = useState<
    Record<string, LivePresetResult | undefined>
  >({});
  const [economics, setEconomics] = useState<ReconEconomics | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  /** Forces ValueReveal + waterfall to re-autoplay on unit / rate commits. */
  const [demoNonce, setDemoNonce] = useState(0);

  const selectedPreset = getPresetById(selectedId);
  const live = liveById[selectedId];
  const vehicle: SampleVehicle | null =
    live?.vehicle ?? curatedVehicleForPreset(selectedPreset);

  useEffect(() => {
    if (!record || isTokenExpired(record)) {
      setBootstrapped(true);
      return;
    }
    recordTokenOpen(record.token);

    // Seed curated immediately so the page is interactive without waiting on Gemini.
    const curatedMap: Record<string, LivePresetResult> = {};
    for (const preset of PRESET_CARS) {
      curatedMap[preset.id] = {
        vehicle: curatedVehicleForPreset(preset),
        economics: curatedEconomicsForPreset(preset),
        source: "curated",
        marketNote:
          "Curated mid-market sample. Live Gemini values load when configured.",
        asOfLabel: "Curated sample",
      };
    }
    const starter = initialPresetForToken(record.franchise);
    setSelectedId(starter.id);
    setLiveById(curatedMap);
    setEconomics({
      ...curatedMap[starter.id].economics,
      ...record.defaults,
    });
    setBootstrapped(true);

    let cancelled = false;
    (async () => {
      const liveMap = await prefetchAllPresets();
      if (cancelled) return;
      const next: Record<string, LivePresetResult> = {};
      liveMap.forEach((value, key) => {
        next[key] = value;
      });
      setLiveById(next);
      setEconomics((prev) => {
        const selected = next[starter.id] ?? curatedMap[starter.id];
        return {
          ...selected.economics,
          ...record.defaults,
          // Keep any rates the visitor already typed
          ...(prev && prev !== curatedMap[starter.id].economics
            ? {
                internalLaborRateCents: prev.internalLaborRateCents,
                laborCostRateCents: prev.laborCostRateCents,
                partsMarkupPct: prev.partsMarkupPct,
                packAmountCents: prev.packAmountCents,
              }
            : {}),
        };
      });
      setDemoNonce((n) => n + 1);
    })();

    return () => {
      cancelled = true;
    };
  }, [record]);

  const selectPreset = useCallback(
    (preset: PresetCar) => {
      setSelectedId(preset.id);
      const entry = liveById[preset.id];
      if (entry) {
        setEconomics({ ...entry.economics, ...record?.defaults });
      } else {
        setEconomics({
          ...curatedEconomicsForPreset(preset),
          ...record?.defaults,
        });
      }
      setDemoNonce((n) => n + 1);
    },
    [liveById, record?.defaults],
  );

  const refreshPreset = useCallback(
    async (preset: PresetCar) => {
      setLoadingId(preset.id);
      const fresh = await resolvePresetLive(preset, { forceRefresh: true });
      setLiveById((prev) => ({ ...prev, [preset.id]: fresh }));
      if (preset.id === selectedId) {
        setEconomics({ ...fresh.economics, ...record?.defaults });
        setDemoNonce((n) => n + 1);
      }
      setLoadingId(null);
    },
    [record?.defaults, selectedId],
  );

  const result = useMemo(() => {
    if (!vehicle || !economics) return null;
    return computeUnit(vehicle.lines, economics);
  }, [vehicle, economics]);

  if (!record) {
    return (
      <SiteChrome active="preview">
        <StatusShell
          title="Preview not found"
          body="This link is invalid or was mistyped."
        />
      </SiteChrome>
    );
  }

  if (isTokenExpired(record)) {
    return (
      <SiteChrome active="preview">
        <StatusShell
          title="This preview has expired"
          body="Private previews close after 21 days. Request a CTRL Snapshot to run the same strip against a real 90 days."
        />
      </SiteChrome>
    );
  }

  if (!bootstrapped || !vehicle || !economics || !result) {
    return (
      <SiteChrome active="preview">
        <StatusShell
          title="Preparing your preview…"
          body="Loading three mid-market sample units — the strip starts automatically."
        />
      </SiteChrome>
    );
  }

  const extrapolated = extrapolateMarkup(
    result.internalRoMarkupCents,
    record.sampleUnitCount,
  );

  // Replay auto-demo on unit switch / live refresh — not on every rate keystroke.
  const demoKey = `${selectedId}-${demoNonce}`;

  const cards: PreviewFindingCard[] = [
    {
      code: "INTERNAL_RO_MARKUP",
      label: "Internal RO markup",
      bucket: "gross_accuracy",
      blurb:
        "Posted recon parts and labor carry store markup into inventory cost. Strip reveals the true cost basis — the number your front gross should have used.",
      amountCents: result.internalRoMarkupCents,
    },
    {
      code: "WARRANTY_UNCLAIMED",
      label: "Unclaimed warranty",
      bucket: "recoverable_cash",
      blurb:
        "Recon on in-warranty units billed to used inventory instead of submitted as a claim. Recoverable cash, subject to OEM lookback windows.",
    },
    {
      code: "RECON_POST_SALE",
      label: "Recon posted after sale",
      bucket: "gross_accuracy",
      blurb:
        "Cost lines arriving after GL sale close understate period gross and surface the GAAP classification question.",
    },
    {
      code: "PACK_DOUBLE",
      label: "Pack errors",
      bucket: "gross_accuracy",
      blurb:
        "Missing pack, double pack, or pack that doesn't match the store schedule — small lines that compound across volume.",
    },
  ];

  const liveMeta = liveById[selectedId];

  return (
    <SiteChrome active="preview">
      <header className="mt-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl">
          <h1 className="font-display text-[2.75rem] leading-[1.05] md:text-5xl">
            VIN Preview
          </h1>
          <p className="mt-4 text-[1.05rem] leading-relaxed text-[var(--tc-ink-muted)]">
            Prepared for{" "}
            <span className="font-semibold text-[var(--tc-ink)]">
              {record.prospectName}
            </span>
            {" — "}
            the strip runs on load. No DMS upload.
          </p>
        </div>
        <div className="space-y-1.5 text-left text-[0.8125rem] leading-snug text-[var(--tc-ink-muted)] md:max-w-xs md:text-right">
          <p>Your economics · our sample VINs</p>
          <p>
            Active: {vehicle.year} {vehicle.make} {vehicle.model}
          </p>
          <p>
            {liveMeta?.source === "live"
              ? `Live values · ${liveMeta.asOfLabel}`
              : (liveMeta?.asOfLabel ?? "Curated sample")}
          </p>
          <p>Expires {new Date(record.expiresAt).toLocaleDateString()}</p>
        </div>
      </header>

      <div className="mt-14 space-y-24">
        <PresetCarPicker
          selectedId={selectedId}
          liveById={liveById}
          loadingId={loadingId}
          onSelect={selectPreset}
          onRefresh={refreshPreset}
        />

        <ValueReveal
          vehicle={vehicle}
          result={result}
          sampleUnitCount={record.sampleUnitCount}
          extrapolatedCents={extrapolated}
          demoKey={demoKey}
        />

        <CostWaterfall
          vehicle={vehicle}
          result={result}
          demoKey={demoKey}
        />

        <Extrapolation
          unitMarkupCents={result.internalRoMarkupCents}
          sampleUnitCount={record.sampleUnitCount}
          extrapolatedCents={extrapolated}
        />

        <EconomicsInputs value={economics} onChange={setEconomics} />

        <FindingCards cards={cards} />

        <PreviewCta
          extrapolatedCents={extrapolated}
          prospectName={record.prospectName}
        />
      </div>

      <footer className="mt-20 border-t border-[var(--tc-line)] pt-6 text-xs text-[var(--tc-ink-muted)]">
        <p>
          Three illustrative sample units. The markup strip auto-plays on load
          and when you switch cars. Live acquisition and recon figures refresh
          via Gemini when configured; math stays client-side. No customer VINs
          leave your building. Total is identified — only recoverable cash is
          collectible.
        </p>
      </footer>
    </SiteChrome>
  );
}

function StatusShell({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-16 max-w-lg">
      <h1 className="font-display text-4xl">{title}</h1>
      <p className="mt-4 text-[var(--tc-ink-muted)]">{body}</p>
    </div>
  );
}
