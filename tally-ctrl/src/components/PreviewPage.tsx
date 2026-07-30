import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { EconomicsInputs } from "@/components/EconomicsInputs";
import { CostWaterfall } from "@/components/CostWaterfall";
import { Extrapolation } from "@/components/Extrapolation";
import { FindingCards } from "@/components/FindingCards";
import { PreviewCta } from "@/components/PreviewCta";
import { SiteChrome } from "@/components/layout/SiteChrome";
import {
  getSampleByKey,
  getSampleForFranchise,
} from "@/data/sample-vehicles";
import {
  isTokenExpired,
  lookupToken,
  recordTokenOpen,
} from "@/data/preview-tokens";
import { computeUnit, extrapolateMarkup } from "@/engine/compute";
import { resolveFranchiseSeed } from "@/gemini/franchise-seed";
import type {
  PreviewFindingCard,
  ReconEconomics,
  SampleVehicle,
} from "@/schema/types";

export function PreviewPage() {
  const { token = "" } = useParams();
  const record = lookupToken(token);

  const [vehicle, setVehicle] = useState<SampleVehicle | null>(null);
  const [economics, setEconomics] = useState<ReconEconomics | null>(null);
  const [seedSource, setSeedSource] = useState<string>("curated");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!record || isTokenExpired(record)) {
      setLoading(false);
      return;
    }

    recordTokenOpen(record.token);
    let cancelled = false;

    (async () => {
      const seeded = await resolveFranchiseSeed({
        franchise: record.franchise,
        prospectName: record.prospectName,
      });

      if (cancelled) return;

      const fromKey = record.sampleVehicleKey
        ? getSampleByKey(record.sampleVehicleKey)
        : getSampleForFranchise(record.franchise);

      const chosenVehicle =
        seeded.source === "gemini" ? seeded.vehicle : fromKey;
      const chosenEconomics: ReconEconomics = {
        ...chosenVehicle.defaultEconomics,
        ...seeded.economics,
        ...record.defaults,
      };

      setVehicle(chosenVehicle);
      setEconomics(chosenEconomics);
      setSeedSource(seeded.source);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [record]);

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

  if (loading || !vehicle || !economics || !result) {
    return (
      <SiteChrome active="preview">
        <StatusShell
          title="Preparing your preview…"
          body="Seeding a mid-market sample for your franchise."
        />
      </SiteChrome>
    );
  }

  const extrapolated = extrapolateMarkup(
    result.internalRoMarkupCents,
    record.sampleUnitCount,
  );

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

  return (
    <SiteChrome active="preview">
      <header className="mt-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-4xl leading-none md:text-5xl">
            VIN Preview
          </h1>
          <p className="mt-3 text-sm text-[var(--tc-ink-muted)]">
            Prepared for{" "}
            <span className="font-semibold text-[var(--tc-ink)]">
              {record.prospectName}
            </span>
          </p>
        </div>
        <div className="text-left text-xs text-[var(--tc-ink-muted)] md:text-right">
          <p>Your economics · our sample VINs</p>
          <p className="mt-1">
            Seed: {vehicle.year} {vehicle.make} {vehicle.model}
            {seedSource === "curated" ? "" : ` · ${seedSource}`}
          </p>
          <p className="mt-1">
            Expires {new Date(record.expiresAt).toLocaleDateString()}
          </p>
        </div>
      </header>

      <div className="mt-14 space-y-24">
        <EconomicsInputs value={economics} onChange={setEconomics} />
        <CostWaterfall vehicle={vehicle} result={result} />
        <Extrapolation
          unitMarkupCents={result.internalRoMarkupCents}
          sampleUnitCount={record.sampleUnitCount}
          extrapolatedCents={extrapolated}
        />
        <FindingCards cards={cards} />
        <PreviewCta
          extrapolatedCents={extrapolated}
          prospectName={record.prospectName}
        />
      </div>

      <footer className="mt-20 border-t border-[var(--tc-line)] pt-6 text-xs text-[var(--tc-ink-muted)]">
        <p>
          Demonstration of the markup-strip mechanism on sample units. Not a
          demo of the portal. No customer VINs leave your building. Total is
          identified — only recoverable cash is collectible.
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
