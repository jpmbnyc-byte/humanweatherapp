import { useMemo, useState, type FormEvent } from "react";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { BRAND_TIERS } from "@/config/estimator-coefficients";
import {
  BUCKET_COPY,
  CONTACT_EMAIL,
  ESTIMATOR_PRIMARY_CTA,
  ESTIMATOR_SECONDARY_CTA,
  TIER,
} from "@/config/positioning";
import {
  computeEstimator,
  defaultsForTier,
  formatDollars,
  formatPct,
  type EstimatorInputs,
} from "@/estimator/compute";

export function EstimatorPage() {
  const [inputs, setInputs] = useState<EstimatorInputs>(defaultsForTier("moderate"));
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const result = useMemo(() => computeEstimator(inputs), [inputs]);

  function patch(partial: Partial<EstimatorInputs>) {
    setInputs((prev) => {
      const next = { ...prev, ...partial };
      if (partial.brandTier && partial.brandTier !== prev.brandTier) {
        const tier = BRAND_TIERS.find((t) => t.id === partial.brandTier);
        if (tier) next.reconPerUsedUnit = tier.defaultReconPerUsedUnit;
      }
      return next;
    });
  }

  function onEmail(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSent(true);
  }

  return (
    <SiteChrome active="estimate">
      <section className="mt-14 max-w-3xl">
        <p className="tc-eyebrow">{TIER.estimator.name}</p>
        <h1 className="tc-display text-[2.5rem] md:text-5xl">
          Estimate your used-vehicle variance pool.
        </h1>
        <p className="tc-support">
          Four inputs. Under 90 seconds. Three buckets — never one blended
          number. Modelled estimate, not a finding.
        </p>
      </section>

      <section className="mt-12 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        <label className="tc-field">
          <span className="tc-label">Rooftops</span>
          <input
            className="tc-input"
            type="number"
            min={1}
            max={100}
            autoComplete="off"
            value={inputs.rooftops}
            onChange={(e) =>
              patch({ rooftops: clampInt(e.target.value, 1, 100) })
            }
          />
        </label>
        <label className="tc-field">
          <span className="tc-label">Used units / month</span>
          <input
            className="tc-input"
            type="number"
            min={0}
            max={5000}
            autoComplete="off"
            value={inputs.usedUnitsMonth}
            onChange={(e) =>
              patch({ usedUnitsMonth: clampInt(e.target.value, 0, 5000) })
            }
          />
        </label>
        <label className="tc-field sm:col-span-2">
          <span className="tc-label">Primary franchise group</span>
          <select
            className="tc-input"
            value={inputs.brandTier}
            onChange={(e) =>
              patch({
                brandTier: e.target.value as EstimatorInputs["brandTier"],
              })
            }
          >
            {BRAND_TIERS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}: {t.brands}
              </option>
            ))}
          </select>
        </label>
      </section>

      <div className="mt-6">
        <button
          type="button"
          className="text-sm font-semibold text-[var(--tc-accent)]"
          onClick={() => setAdvancedOpen((o) => !o)}
          aria-expanded={advancedOpen}
        >
          {advancedOpen ? "Hide" : "Show"} advanced inputs
        </button>
        {advancedOpen ? (
          <div className="mt-5 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            <label className="tc-field">
              <span className="tc-label">Avg used unit cost</span>
              <input
                className="tc-input"
                type="number"
                autoComplete="off"
                value={inputs.avgUnitCost}
                onChange={(e) =>
                  patch({ avgUnitCost: clampInt(e.target.value, 10000, 150000) })
                }
              />
            </label>
            <label className="tc-field">
              <span className="tc-label">Floorplan rate (%)</span>
              <input
                className="tc-input"
                type="number"
                step="0.1"
                autoComplete="off"
                value={+(inputs.floorplanRate * 100).toFixed(2)}
                onChange={(e) =>
                  patch({
                    floorplanRate: clampFloat(e.target.value, 3, 15) / 100,
                  })
                }
              />
            </label>
            <label className="tc-field">
              <span className="tc-label">Days in inventory</span>
              <input
                className="tc-input"
                type="number"
                autoComplete="off"
                value={inputs.daysInInventory}
                onChange={(e) =>
                  patch({
                    daysInInventory: clampInt(e.target.value, 15, 180),
                  })
                }
              />
            </label>
            <label className="tc-field">
              <span className="tc-label">Recon per used unit</span>
              <input
                className="tc-input"
                type="number"
                autoComplete="off"
                value={inputs.reconPerUsedUnit}
                onChange={(e) =>
                  patch({
                    reconPerUsedUnit: clampInt(e.target.value, 0, 8000),
                  })
                }
              />
            </label>
          </div>
        ) : null}
      </div>

      <section className="mt-14 grid gap-8 md:grid-cols-3">
        <BucketCard
          title={BUCKET_COPY.recoverable_cash.title}
          amount={result.bucketA}
          blurb={BUCKET_COPY.recoverable_cash.blurb}
        />
        <BucketCard
          title={BUCKET_COPY.gross_accuracy.title}
          amount={result.bucketB}
          blurb={BUCKET_COPY.gross_accuracy.blurb}
        />
        <BucketCard
          title={BUCKET_COPY.period_exposure.title}
          amount={null}
          blurb={`${BUCKET_COPY.period_exposure.blurb} Quantified from your close calendar in a ${TIER.snapshot.name} or ${TIER.diagnostic.name} — not modelled from volume alone.`}
        />
      </section>

      <section className="mt-10 max-w-3xl border-l-2 border-[var(--tc-accent)] pl-5">
        <p className="font-display text-2xl leading-snug md:text-3xl">
          Total variance identified:{" "}
          <span className="text-[var(--tc-delta)]">
            {formatDollars(result.totalIdentified)}
          </span>{" "}
          — approximately{" "}
          <span className="tabular-nums">
            {formatDollars(result.leakagePerUsedUnit)}
          </span>{" "}
          per used unit across{" "}
          <span className="tabular-nums">
            {result.usedUnitsYear.toLocaleString()}
          </span>{" "}
          annual used units.
        </p>
        <p className="mt-4 text-sm text-[var(--tc-ink-muted)]">
          A {TIER.diagnostic.name} is {TIER.diagnostic.priceLabel}
          {result.feeRatioTotal != null
            ? ` — ${formatPct(result.feeRatioTotal)} of the variance identified`
            : ""}
          {result.feeRatioCash != null
            ? `, and ${formatPct(result.feeRatioCash)} of the recoverable cash`
            : ""}
          . The fee is fixed before we begin. If we find less, you have bought
          certainty at a known price.
        </p>
      </section>

      <p className="mt-8 max-w-3xl text-sm text-[var(--tc-ink-muted)]">
        <strong className="font-semibold text-[var(--tc-ink)]">
          How this was calculated.
        </strong>{" "}
        Estimates are derived from your reported used volume, franchise mix,
        floorplan terms, and reconditioning spend, applied against leakage rates
        observed in completed Tally CTRL engagements (coefficient set{" "}
        <span className="tabular-nums">{result.coefficientVersion}</span>).
        This is a modelled estimate, not a finding. A {TIER.snapshot.name}{" "}
        examines 90 days of your actual cost data.
      </p>

      {result.showOwnerBlock ? (
        <p className="mt-8 max-w-3xl text-sm leading-relaxed text-[var(--tc-ink-muted)]">
          <strong className="font-semibold text-[var(--tc-ink)]">
            For the owner&apos;s side of the desk:
          </strong>{" "}
          recovering the cash is one-time. Closing the leak is recurring. At{" "}
          {formatDollars(result.recoverablePerUsedUnit)} recoverable per used
          unit across {result.usedUnitsYear.toLocaleString()} annual units,
          installed controls add roughly{" "}
          <span className="font-semibold text-[var(--tc-ink)]">
            {formatDollars(result.runRateEbitda)}
          </span>{" "}
          to annual run-rate EBITDA — and run-rate EBITDA is what carries a blue
          sky multiple. Recoveries do not.
        </p>
      ) : null}

      <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center">
        <a
          href={`mailto:${CONTACT_EMAIL}?subject=CTRL%20Snapshot%20request`}
          className="inline-flex items-center justify-center rounded-md bg-[var(--tc-accent-deep)] px-6 py-3 text-sm font-semibold text-[var(--tc-paper)] transition hover:bg-[var(--tc-accent)]"
        >
          {ESTIMATOR_PRIMARY_CTA}
        </a>
      </div>

      <form onSubmit={onEmail} className="mt-10 max-w-md">
        <p className="tc-label">{ESTIMATOR_SECONDARY_CTA}</p>
        {sent ? (
          <p className="text-sm text-[var(--tc-accent)]">
            Noted — we&apos;ll send these figures to {email}.
          </p>
        ) : (
          <div className="flex gap-2">
            <input
              type="email"
              required
              className="tc-input"
              placeholder="controller@dealergroup.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              type="submit"
              className="shrink-0 rounded-md border border-[var(--tc-line)] bg-white/70 px-4 text-sm font-semibold"
            >
              Send
            </button>
          </div>
        )}
      </form>
    </SiteChrome>
  );
}

function BucketCard({
  title,
  amount,
  blurb,
}: {
  title: string;
  amount: number | null;
  blurb: string;
}) {
  return (
    <article className="border-t border-[var(--tc-line)] pt-4">
      <p className="tc-label">{title}</p>
      <p className="font-display mt-2 text-3xl tabular-nums text-[var(--tc-ink)]">
        {amount == null ? "From your periods" : formatDollars(amount)}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-[var(--tc-ink-muted)]">
        {blurb}
      </p>
    </article>
  );
}

function clampInt(raw: string, min: number, max: number): number {
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function clampFloat(raw: string, min: number, max: number): number {
  const n = Number.parseFloat(raw);
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}
